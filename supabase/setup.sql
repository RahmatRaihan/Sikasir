-- ============================================================
-- SiKasir DWP RS Rubini — Supabase Database Setup
-- Jalankan SQL ini di Supabase SQL Editor (supabase.com)
-- ============================================================

-- ─── 1. TABEL: penyedia ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS penyedia (
  id SERIAL PRIMARY KEY,
  nama TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. TABEL: produk ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS produk (
  id SERIAL PRIMARY KEY,
  kode_barang TEXT UNIQUE NOT NULL,
  nama_produk TEXT NOT NULL,
  penyedia_id INTEGER REFERENCES penyedia(id),
  potongan_rs TEXT DEFAULT 'none',
  harga_jual INTEGER NOT NULL,
  stok_fisik INTEGER NOT NULL DEFAULT 0,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. TABEL: transaksi ────────────────────────────────────
CREATE TABLE IF NOT EXISTS transaksi (
  id SERIAL PRIMARY KEY,
  nomor_transaksi TEXT UNIQUE NOT NULL,
  tanggal TEXT NOT NULL,           -- YYYY-MM-DD
  metode_bayar TEXT NOT NULL,      -- 'tunai', 'qris'
  total_tagihan INTEGER NOT NULL,
  uang_diterima INTEGER,
  kembalian INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 4. TABEL: transaksi_item ───────────────────────────────
CREATE TABLE IF NOT EXISTS transaksi_item (
  id SERIAL PRIMARY KEY,
  transaksi_id INTEGER REFERENCES transaksi(id),
  produk_id INTEGER REFERENCES produk(id),
  nama_produk TEXT,
  penyedia_id INTEGER,
  harga_satuan INTEGER,
  potongan_rs TEXT,
  qty INTEGER NOT NULL,
  subtotal INTEGER NOT NULL
);

-- ─── 5. TABEL: retur ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS retur (
  id SERIAL PRIMARY KEY,
  produk_id INTEGER REFERENCES produk(id),
  transaksi_item_id INTEGER REFERENCES transaksi_item(id),
  qty_retur INTEGER NOT NULL,
  alasan TEXT,
  tanggal TEXT NOT NULL,           -- YYYY-MM-DD
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 6. INDEXES ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_produk_penyedia ON produk(penyedia_id);
CREATE INDEX IF NOT EXISTS idx_produk_is_deleted ON produk(is_deleted);
CREATE INDEX IF NOT EXISTS idx_transaksi_tanggal ON transaksi(tanggal);
CREATE INDEX IF NOT EXISTS idx_transaksi_item_transaksi ON transaksi_item(transaksi_id);
CREATE INDEX IF NOT EXISTS idx_transaksi_item_penyedia ON transaksi_item(penyedia_id);
CREATE INDEX IF NOT EXISTS idx_retur_tanggal ON retur(tanggal);
CREATE INDEX IF NOT EXISTS idx_retur_produk ON retur(produk_id);

-- ─── 7. SEED DATA: penyedia ────────────────────────────────
INSERT INTO penyedia (nama) VALUES ('DWP')
  ON CONFLICT DO NOTHING;
INSERT INTO penyedia (nama) VALUES ('Mona')
  ON CONFLICT DO NOTHING;
INSERT INTO penyedia (nama) VALUES ('Harian')
  ON CONFLICT DO NOTHING;
INSERT INTO penyedia (nama) VALUES ('Kering')
  ON CONFLICT DO NOTHING;

-- ─── 8. ROW LEVEL SECURITY ─────────────────────────────────
-- Disable RLS for simplicity (single-user app via anon key)
ALTER TABLE penyedia ENABLE ROW LEVEL SECURITY;
ALTER TABLE produk ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaksi_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE retur ENABLE ROW LEVEL SECURITY;

-- Allow full access via anon key
CREATE POLICY "Allow all for anon" ON penyedia FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON produk FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON transaksi FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON transaksi_item FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON retur FOR ALL USING (true) WITH CHECK (true);

-- ─── 9. STORED PROCEDURES (RPC) ────────────────────────────

-- RPC: Create transaksi (atomic insert + stok update)
CREATE OR REPLACE FUNCTION create_transaksi(
  p_nomor_transaksi TEXT,
  p_tanggal TEXT,
  p_metode_bayar TEXT,
  p_total_tagihan INTEGER,
  p_uang_diterima INTEGER,
  p_kembalian INTEGER,
  p_items JSONB  -- Array of {produk_id, nama_produk, penyedia_id, harga_satuan, potongan_rs, qty, subtotal}
) RETURNS JSONB AS $$
DECLARE
  v_transaksi_id INTEGER;
  v_item JSONB;
BEGIN
  -- Insert transaksi header
  INSERT INTO transaksi (nomor_transaksi, tanggal, metode_bayar, total_tagihan, uang_diterima, kembalian)
  VALUES (p_nomor_transaksi, p_tanggal, p_metode_bayar, p_total_tagihan, p_uang_diterima, p_kembalian)
  RETURNING id INTO v_transaksi_id;

  -- Insert items and update stok
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO transaksi_item (transaksi_id, produk_id, nama_produk, penyedia_id, harga_satuan, potongan_rs, qty, subtotal)
    VALUES (
      v_transaksi_id,
      (v_item->>'produk_id')::INTEGER,
      v_item->>'nama_produk',
      (v_item->>'penyedia_id')::INTEGER,
      (v_item->>'harga_satuan')::INTEGER,
      v_item->>'potongan_rs',
      (v_item->>'qty')::INTEGER,
      (v_item->>'subtotal')::INTEGER
    );

    -- Update stok
    UPDATE produk SET stok_fisik = stok_fisik - (v_item->>'qty')::INTEGER, updated_at = NOW()
    WHERE id = (v_item->>'produk_id')::INTEGER;
  END LOOP;

  RETURN jsonb_build_object('transaksi_id', v_transaksi_id, 'nomor_transaksi', p_nomor_transaksi);
END;
$$ LANGUAGE plpgsql;

-- RPC: Create retur (atomic insert + stok update)
CREATE OR REPLACE FUNCTION create_retur(
  p_produk_id INTEGER,
  p_transaksi_item_id INTEGER,
  p_qty_retur INTEGER,
  p_alasan TEXT,
  p_tanggal TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO retur (produk_id, transaksi_item_id, qty_retur, alasan, tanggal)
  VALUES (p_produk_id, p_transaksi_item_id, p_qty_retur, p_alasan, p_tanggal);

  UPDATE produk SET stok_fisik = stok_fisik - p_qty_retur, updated_at = NOW()
  WHERE id = p_produk_id;
END;
$$ LANGUAGE plpgsql;

-- RPC: Get laporan harian (aggregate)
CREATE OR REPLACE FUNCTION get_laporan_harian(
  p_periode TEXT,
  p_penyedia_id INTEGER DEFAULT NULL
) RETURNS TABLE (
  tanggal TEXT,
  penjualan_harian BIGINT,
  titipan_kering BIGINT,
  produk_dwp BIGINT,
  titipan_mona BIGINT,
  barang_harian BIGINT,
  barang_retur BIGINT,
  jumlah_kering_harian BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.tanggal,
    COALESCE(SUM(ti.subtotal), 0)::BIGINT as penjualan_harian,
    COALESCE(SUM(CASE WHEN ti.penyedia_id = 4 THEN ti.subtotal ELSE 0 END), 0)::BIGINT as titipan_kering,
    COALESCE(SUM(CASE WHEN ti.penyedia_id = 1 THEN ti.subtotal ELSE 0 END), 0)::BIGINT as produk_dwp,
    COALESCE(SUM(CASE WHEN ti.penyedia_id = 2 THEN ti.subtotal ELSE 0 END), 0)::BIGINT as titipan_mona,
    COALESCE(SUM(CASE WHEN ti.penyedia_id = 3 THEN ti.subtotal ELSE 0 END), 0)::BIGINT as barang_harian,
    COALESCE((SELECT SUM(r.qty_retur) FROM retur r WHERE r.tanggal = t.tanggal), 0)::BIGINT as barang_retur,
    COALESCE(SUM(CASE WHEN ti.penyedia_id IN (3, 4) THEN ti.subtotal ELSE 0 END), 0)::BIGINT as jumlah_kering_harian
  FROM transaksi t
  JOIN transaksi_item ti ON ti.transaksi_id = t.id
  WHERE t.tanggal LIKE p_periode || '%'
    AND (p_penyedia_id IS NULL OR ti.penyedia_id = p_penyedia_id)
  GROUP BY t.tanggal
  ORDER BY t.tanggal ASC;
END;
$$ LANGUAGE plpgsql;

-- RPC: Get ringkasan bagi hasil
CREATE OR REPLACE FUNCTION get_ringkasan_bagi_hasil(
  p_periode TEXT,
  p_penyedia_id INTEGER DEFAULT NULL
) RETURNS TABLE (
  penyedia_id INTEGER,
  penyedia_nama TEXT,
  total_kotor BIGINT,
  barang_retur BIGINT,
  nilai_retur BIGINT,
  potongan_rs BIGINT,
  pendapatan_bersih BIGINT,
  total_tunai BIGINT,
  total_qris BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as penyedia_id,
    p.nama as penyedia_nama,
    COALESCE(SUM(ti.subtotal), 0)::BIGINT as total_kotor,
    COALESCE((
      SELECT SUM(r.qty_retur) FROM retur r JOIN produk pr ON pr.id = r.produk_id
      WHERE pr.penyedia_id = p.id AND r.tanggal LIKE p_periode || '%'
    ), 0)::BIGINT as barang_retur,
    COALESCE((
      SELECT SUM(r.qty_retur * pr.harga_jual) FROM retur r JOIN produk pr ON pr.id = r.produk_id
      WHERE pr.penyedia_id = p.id AND r.tanggal LIKE p_periode || '%'
    ), 0)::BIGINT as nilai_retur,
    COALESCE(SUM(
      CASE
        WHEN ti.potongan_rs = '10%' THEN (ti.subtotal * 0.1)::INTEGER
        WHEN ti.potongan_rs = '20%' THEN (ti.subtotal * 0.2)::INTEGER
        ELSE 0
      END
    ), 0)::BIGINT as potongan_rs,
    0::BIGINT as pendapatan_bersih,  -- calculated in app
    COALESCE(SUM(CASE WHEN t.metode_bayar = 'tunai' THEN ti.subtotal ELSE 0 END), 0)::BIGINT as total_tunai,
    COALESCE(SUM(CASE WHEN t.metode_bayar = 'qris' THEN ti.subtotal ELSE 0 END), 0)::BIGINT as total_qris
  FROM penyedia p
  LEFT JOIN transaksi_item ti ON ti.penyedia_id = p.id
  LEFT JOIN transaksi t ON t.id = ti.transaksi_id AND t.tanggal LIKE p_periode || '%'
  WHERE (p_penyedia_id IS NULL OR p.id = p_penyedia_id)
  GROUP BY p.id, p.nama
  HAVING COALESCE(SUM(ti.subtotal), 0) > 0
     OR COALESCE((SELECT SUM(r.qty_retur) FROM retur r JOIN produk pr ON pr.id = r.produk_id WHERE pr.penyedia_id = p.id AND r.tanggal LIKE p_periode || '%'), 0) > 0
  ORDER BY p.id ASC;
END;
$$ LANGUAGE plpgsql;

-- RPC: Restore stock when deleting a transaction
CREATE OR REPLACE FUNCTION restore_stock(
  p_produk_id INTEGER,
  p_qty INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE produk
  SET stok_fisik = stok_fisik + p_qty,
      updated_at = NOW()
  WHERE id = p_produk_id;
END;
$$ LANGUAGE plpgsql;
