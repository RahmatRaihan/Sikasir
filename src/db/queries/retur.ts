// Database queries for Retur — Supabase version
import { supabase } from '../supabaseClient';

/**
 * Create a product return via Supabase RPC
 * Atomic: insert retur + update stok
 */
export async function createRetur(data: {
  produkId: number;
  transaksiItemId?: number | null;
  qtyRetur: number;
  alasan?: string;
  tanggal: string;
}) {
  const { error } = await supabase.rpc('create_retur', {
    p_produk_id: data.produkId,
    p_transaksi_item_id: data.transaksiItemId || null,
    p_qty_retur: data.qtyRetur,
    p_alasan: data.alasan || null,
    p_tanggal: data.tanggal,
  });

  if (error) throw new Error(error.message);
}

/**
 * Get returs by period (date or month)
 */
export async function getReturByPeriode(periode: string) {
  const { data, error } = await supabase
    .from('retur')
    .select('*')
    .ilike('tanggal', `${periode}%`)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Get retur summary by penyedia for a period
 */
export async function getReturSummaryByPenyedia(bulan: string) {
  const { data, error } = await supabase
    .from('retur')
    .select('qty_retur, produk!inner(penyedia_id, harga_jual)')
    .ilike('tanggal', `${bulan}%`);

  if (error) {
    console.error('getReturSummaryByPenyedia error:', error.message);
    return [];
  }

  // Group by penyedia
  const grouped: Record<number, { totalRetur: number; nilaiRetur: number }> = {};
  (data || []).forEach((row: any) => {
    const penyediaId = row.produk?.penyedia_id;
    if (!penyediaId) return;

    if (!grouped[penyediaId]) {
      grouped[penyediaId] = { totalRetur: 0, nilaiRetur: 0 };
    }
    grouped[penyediaId].totalRetur += row.qty_retur;
    grouped[penyediaId].nilaiRetur += row.qty_retur * (row.produk?.harga_jual || 0);
  });

  return Object.entries(grouped).map(([id, val]) => ({
    penyediaId: Number(id),
    totalRetur: val.totalRetur,
    nilaiRetur: val.nilaiRetur,
  }));
}
