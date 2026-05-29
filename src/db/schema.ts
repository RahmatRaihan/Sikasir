// Database Types — SiKasir DWP RS Rubini
// Type definitions matching Supabase PostgreSQL schema

export interface Penyedia {
  id: number;
  nama: string;
  created_at: string | null;
}

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

export interface Transaksi {
  id: number;
  nomor_transaksi: string;
  tanggal: string;
  metode_bayar: string;
  total_tagihan: number;
  uang_diterima: number | null;
  kembalian: number | null;
  created_at: string | null;
}

export interface TransaksiItem {
  id: number;
  transaksi_id: number | null;
  produk_id: number | null;
  nama_produk: string | null;
  penyedia_id: number | null;
  harga_satuan: number | null;
  potongan_rs: string | null;
  qty: number;
  subtotal: number;
}

export interface Retur {
  id: number;
  produk_id: number | null;
  transaksi_item_id: number | null;
  qty_retur: number;
  alasan: string | null;
  tanggal: string;
  created_at: string | null;
}
