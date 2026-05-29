// Database queries for Produk — Supabase version
import { supabase } from '../supabaseClient';

export interface Produk {
  id: number;
  kode_barang: string;
  nama_produk: string;
  penyedia_id: number | null;
  potongan_rs: string | null;
  harga_jual: number;
  stok_fisik: number;
  is_deleted: number;
  created_at: string | null;
  updated_at: string | null;
}

// Map DB snake_case to app camelCase
function mapProduk(row: any): any {
  return {
    id: row.id,
    kodeBarang: row.kode_barang,
    namaProduk: row.nama_produk,
    penyediaId: row.penyedia_id,
    potonganRs: row.potongan_rs,
    hargaJual: row.harga_jual,
    stokFisik: row.stok_fisik,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    penyediaNama: row.penyedia?.nama || null,
  };
}

/**
 * Get all active products (not soft-deleted) with optional filters
 */
export async function getAllProduk(filters?: {
  penyediaId?: number | null;
  search?: string;
}) {
  let query = supabase
    .from('produk')
    .select('*, penyedia(nama)')
    .eq('is_deleted', 0)
    .order('nama_produk', { ascending: true });

  if (filters?.penyediaId) {
    query = query.eq('penyedia_id', filters.penyediaId);
  }

  if (filters?.search) {
    query = query.or(`nama_produk.ilike.%${filters.search}%,kode_barang.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []).map(mapProduk);
}

/**
 * Get a single product by ID
 */
export async function getProdukById(id: number) {
  const { data, error } = await supabase
    .from('produk')
    .select('*, penyedia(nama)')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data ? mapProduk(data) : null;
}

/**
 * Insert a new product
 */
export async function insertProduk(data: {
  namaProduk: string;
  penyediaId: number;
  potonganRs: string;
  hargaJual: number;
  stokFisik: number;
}) {
  // Generate kode barang
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

  // Get next sequence
  const { data: lastProduk } = await supabase
    .from('produk')
    .select('kode_barang')
    .ilike('kode_barang', `PRD-${dateStr}%`)
    .order('kode_barang', { ascending: false })
    .limit(1);

  let nextSeq = 1;
  if (lastProduk && lastProduk.length > 0) {
    const lastSeq = parseInt(lastProduk[0].kode_barang.split('-').pop() || '0');
    nextSeq = lastSeq + 1;
  }

  const kodeBarang = `PRD-${dateStr}-${String(nextSeq).padStart(3, '0')}`;

  const { error } = await supabase.from('produk').insert({
    kode_barang: kodeBarang,
    nama_produk: data.namaProduk,
    penyedia_id: data.penyediaId,
    potongan_rs: data.potonganRs,
    harga_jual: data.hargaJual,
    stok_fisik: data.stokFisik,
    is_deleted: 0,
  });

  if (error) throw new Error(error.message);
}

/**
 * Update a product
 */
export async function updateProduk(id: number, data: {
  namaProduk: string;
  penyediaId: number;
  potonganRs: string;
  hargaJual: number;
  stokFisik: number;
}) {
  const { error } = await supabase
    .from('produk')
    .update({
      nama_produk: data.namaProduk,
      penyedia_id: data.penyediaId,
      potongan_rs: data.potonganRs,
      harga_jual: data.hargaJual,
      stok_fisik: data.stokFisik,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/**
 * Soft delete a product
 */
export async function deleteProduk(id: number) {
  const { error } = await supabase
    .from('produk')
    .update({
      is_deleted: 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/**
 * Get products for kasir (active, in stock)
 */
export async function getProdukForKasir(penyediaId?: number | null, search?: string) {
  let query = supabase
    .from('produk')
    .select('*, penyedia(nama)')
    .eq('is_deleted', 0)
    .order('nama_produk', { ascending: true });

  if (penyediaId) {
    query = query.eq('penyedia_id', penyediaId);
  }

  if (search) {
    query = query.or(`nama_produk.ilike.%${search}%,kode_barang.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []).map(mapProduk);
}
