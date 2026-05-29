// Database queries for Transaksi — Supabase version
import { supabase } from '../supabaseClient';
import { formatDateISO } from '../../utils/dateHelper';
import { generateNomorTransaksi } from '../../utils/generateKode';
import type { CartItemData } from '../../store/cartStore';

/**
 * Create a complete transaction via Supabase RPC
 * Atomic: insert transaksi + items + update stok
 */
export async function createTransaksi(data: {
  items: CartItemData[];
  metodeBayar: string;
  totalTagihan: number;
  uangDiterima: number | null;
  kembalian: number | null;
}) {
  const now = new Date();
  const tanggal = formatDateISO(now);

  // Generate nomor transaksi
  const todayPrefix = `TRX-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

  const { data: lastTrx } = await supabase
    .from('transaksi')
    .select('nomor_transaksi')
    .ilike('nomor_transaksi', `${todayPrefix}%`)
    .order('nomor_transaksi', { ascending: false })
    .limit(1);

  let nextSeq = 1;
  if (lastTrx && lastTrx.length > 0) {
    const lastSeq = parseInt(lastTrx[0].nomor_transaksi.split('-').pop() || '0');
    nextSeq = lastSeq + 1;
  }

  const nomorTransaksi = generateNomorTransaksi(nextSeq, now);

  // Prepare items for RPC
  const items = data.items.map((item) => ({
    produk_id: item.produkId,
    nama_produk: item.namaProduk,
    penyedia_id: item.penyediaId,
    harga_satuan: item.hargaSatuan,
    potongan_rs: item.potonganRs,
    qty: item.qty,
    subtotal: item.hargaSatuan * item.qty,
  }));

  // Call RPC for atomic operation
  const { data: result, error } = await supabase.rpc('create_transaksi', {
    p_nomor_transaksi: nomorTransaksi,
    p_tanggal: tanggal,
    p_metode_bayar: data.metodeBayar,
    p_total_tagihan: data.totalTagihan,
    p_uang_diterima: data.uangDiterima,
    p_kembalian: data.kembalian,
    p_items: items,
  });

  if (error) throw new Error(error.message);

  return { nomorTransaksi, tanggal };
}

/**
 * Get transactions by date
 */
export async function getTransaksiByDate(tanggal: string) {
  const { data, error } = await supabase
    .from('transaksi')
    .select('*')
    .eq('tanggal', tanggal)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Get transactions by month (YYYY-MM)
 */
export async function getTransaksiByMonth(bulan: string) {
  const { data, error } = await supabase
    .from('transaksi')
    .select('*')
    .ilike('tanggal', `${bulan}%`)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Get transaction with items (detail)
 */
export async function getTransaksiDetail(id: number) {
  const { data: trx, error: trxError } = await supabase
    .from('transaksi')
    .select('*')
    .eq('id', id)
    .single();

  if (trxError) throw new Error(trxError.message);
  if (!trx) return null;

  const { data: items, error: itemsError } = await supabase
    .from('transaksi_item')
    .select('*')
    .eq('transaksi_id', id);

  if (itemsError) throw new Error(itemsError.message);

  return { ...trx, items: items || [] };
}

/**
 * Get today's total sales amount
 */
export async function getTotalPenjualanHariIni(penyediaId?: number | null, date?: string) {
  const targetDate = date || formatDateISO(new Date());

  let query = supabase
    .from('transaksi_item')
    .select('subtotal, transaksi!inner(tanggal)')
    .eq('transaksi.tanggal', targetDate);

  if (penyediaId) {
    query = query.eq('penyedia_id', penyediaId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('getTotalPenjualanHariIni error:', error.message);
    return 0;
  }

  return (data || []).reduce((sum, item) => sum + (item.subtotal || 0), 0);
}

/**
 * Get monthly total sales amount
 */
export async function getTotalPenjualanBulanan(bulan: string, penyediaId?: number | null) {
  let query = supabase
    .from('transaksi_item')
    .select('subtotal, transaksi!inner(tanggal)')
    .ilike('transaksi.tanggal', `${bulan}%`);

  if (penyediaId) {
    query = query.eq('penyedia_id', penyediaId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('getTotalPenjualanBulanan error:', error.message);
    return 0;
  }

  return (data || []).reduce((sum, item) => sum + (item.subtotal || 0), 0);
}

/**
 * Get total items sold for a date
 */
export async function getTotalItemTerjual(tanggal: string, penyediaId?: number | null) {
  let query = supabase
    .from('transaksi_item')
    .select('qty, transaksi!inner(tanggal)')
    .eq('transaksi.tanggal', tanggal);

  if (penyediaId) {
    query = query.eq('penyedia_id', penyediaId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('getTotalItemTerjual error:', error.message);
    return 0;
  }

  return (data || []).reduce((sum, item) => sum + (item.qty || 0), 0);
}

/**
 * Get daily sales data for chart (last N days)
 */
export async function getDailySalesChart(days: number = 7, penyediaId?: number | null) {
  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = formatDateISO(startDate);

  let query = supabase
    .from('transaksi_item')
    .select('subtotal, transaksi!inner(tanggal)')
    .gte('transaksi.tanggal', startDateStr);

  if (penyediaId) {
    query = query.eq('penyedia_id', penyediaId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('getDailySalesChart error:', error.message);
    return [];
  }

  // Group by date
  const grouped: Record<string, number> = {};
  (data || []).forEach((item: any) => {
    const tanggal = item.transaksi?.tanggal || '';
    grouped[tanggal] = (grouped[tanggal] || 0) + (item.subtotal || 0);
  });

  // Convert to array sorted by date
  return Object.entries(grouped)
    .map(([tanggal, total]) => ({ tanggal, total }))
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal));
}
