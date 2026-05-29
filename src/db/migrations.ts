// Database initialization — SiKasir DWP RS Rubini
// Checks Supabase connection and verifies tables exist
import { supabase } from './supabaseClient';

/**
 * Initialize database connection.
 * Verifies that Supabase is reachable and tables exist.
 */
export async function initializeDatabase() {
  try {
    // Test connection by querying penyedia table
    const { data, error } = await supabase.from('penyedia').select('id').limit(1);

    if (error) {
      console.error('⚠️ Database connection error:', error.message);
      throw new Error(`Database tidak terhubung: ${error.message}`);
    }

    console.log('✅ Database connected successfully');
    return true;
  } catch (e) {
    console.error('❌ Failed to initialize database:', e);
    throw e;
  }
}

/**
 * Seed penyedia data if table is empty.
 * In online mode, this is typically done via SQL migration.
 * This function serves as a safety net.
 */
export async function seedPenyedia() {
  const { data, error } = await supabase.from('penyedia').select('id');

  if (error) {
    console.error('Seed check error:', error.message);
    return;
  }

  if (data && data.length > 0) return;

  // Seed default penyedia
  const { error: insertError } = await supabase.from('penyedia').insert([
    { nama: 'DWP' },
    { nama: 'Mona' },
    { nama: 'Harian' },
    { nama: 'Kering' },
  ]);

  if (insertError) {
    console.error('Seed insert error:', insertError.message);
  } else {
    console.log('✅ Penyedia data seeded');
  }
}

/**
 * Seed sample products (for testing/demo only)
 */
export async function seedSampleProducts() {
  const { data } = await supabase.from('produk').select('id').limit(1);
  if (data && data.length > 0) return;

  const now = new Date().toISOString();
  const products = [
    { kode_barang: 'PRD-20260526-001', nama_produk: 'Roti Tawar Gandum', penyedia_id: 1, potongan_rs: '10%', harga_jual: 15000, stok_fisik: 50 },
    { kode_barang: 'PRD-20260526-002', nama_produk: 'Donat Coklat', penyedia_id: 1, potongan_rs: '10%', harga_jual: 8000, stok_fisik: 30 },
    { kode_barang: 'PRD-20260526-003', nama_produk: 'Kue Lapis Legit', penyedia_id: 1, potongan_rs: '20%', harga_jual: 35000, stok_fisik: 15 },
    { kode_barang: 'PRD-20260526-004', nama_produk: 'Brownies Panggang', penyedia_id: 1, potongan_rs: '10%', harga_jual: 25000, stok_fisik: 20 },
    { kode_barang: 'PRD-20260526-005', nama_produk: 'Nasi Uduk Komplit', penyedia_id: 2, potongan_rs: '10%', harga_jual: 18000, stok_fisik: 25 },
    { kode_barang: 'PRD-20260526-006', nama_produk: 'Soto Ayam', penyedia_id: 2, potongan_rs: '10%', harga_jual: 15000, stok_fisik: 20 },
    { kode_barang: 'PRD-20260526-007', nama_produk: 'Nasi Goreng Special', penyedia_id: 2, potongan_rs: 'none', harga_jual: 20000, stok_fisik: 30 },
    { kode_barang: 'PRD-20260526-008', nama_produk: 'Mie Ayam Bakso', penyedia_id: 2, potongan_rs: '10%', harga_jual: 15000, stok_fisik: 25 },
    { kode_barang: 'PRD-20260526-009', nama_produk: 'Air Mineral 600ml', penyedia_id: 3, potongan_rs: 'none', harga_jual: 5000, stok_fisik: 100 },
    { kode_barang: 'PRD-20260526-010', nama_produk: 'Teh Botol 450ml', penyedia_id: 3, potongan_rs: 'none', harga_jual: 6000, stok_fisik: 80 },
    { kode_barang: 'PRD-20260526-011', nama_produk: 'Kopi Sachet', penyedia_id: 3, potongan_rs: 'none', harga_jual: 3000, stok_fisik: 60 },
    { kode_barang: 'PRD-20260526-012', nama_produk: 'Susu Kotak 200ml', penyedia_id: 3, potongan_rs: '10%', harga_jual: 7000, stok_fisik: 40 },
    { kode_barang: 'PRD-20260526-013', nama_produk: 'Keripik Singkong', penyedia_id: 4, potongan_rs: '10%', harga_jual: 12000, stok_fisik: 35 },
    { kode_barang: 'PRD-20260526-014', nama_produk: 'Kacang Mete 100g', penyedia_id: 4, potongan_rs: '20%', harga_jual: 25000, stok_fisik: 20 },
    { kode_barang: 'PRD-20260526-015', nama_produk: 'Dodol Garut', penyedia_id: 4, potongan_rs: '10%', harga_jual: 18000, stok_fisik: 25 },
    { kode_barang: 'PRD-20260526-016', nama_produk: 'Kerupuk Udang', penyedia_id: 4, potongan_rs: 'none', harga_jual: 10000, stok_fisik: 45 },
  ];

  const { error } = await supabase.from('produk').insert(products);
  if (error) {
    console.error('Seed products error:', error.message);
  } else {
    console.log('✅ Sample products seeded');
  }
}
