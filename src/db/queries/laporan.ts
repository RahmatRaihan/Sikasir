// Database queries for Laporan — Supabase version
import { supabase } from '../supabaseClient';

export interface LaporanHarian {
  tanggal: string;
  penjualanHarian: number;
  titipanKering: number;
  produkDWP: number;
  titipanMona: number;
  barangHarian: number;
  barangRetur: number;
  jumlahKeringHarian: number;
}

export interface RingkasanBagiHasil {
  penyediaId: number;
  penyediaNama: string;
  totalKotor: number;
  barangRetur: number;
  nilaiRetur: number;
  potonganRS: number;
  pendapatanBersih: number;
  totalTunai: number;
  totalQRIS: number;
}

/**
 * Get laporan rincian penjualan harian via RPC
 */
export async function getLaporanHarian(periode: string, penyediaId?: number | null): Promise<LaporanHarian[]> {
  const { data, error } = await supabase.rpc('get_laporan_harian', {
    p_periode: periode,
    p_penyedia_id: penyediaId || null,
  });

  if (error) {
    console.error('getLaporanHarian error:', error.message);
    return [];
  }

  // Map snake_case to camelCase
  return (data || []).map((row: any) => ({
    tanggal: row.tanggal,
    penjualanHarian: Number(row.penjualan_harian) || 0,
    titipanKering: Number(row.titipan_kering) || 0,
    produkDWP: Number(row.produk_dwp) || 0,
    titipanMona: Number(row.titipan_mona) || 0,
    barangHarian: Number(row.barang_harian) || 0,
    barangRetur: Number(row.barang_retur) || 0,
    jumlahKeringHarian: Number(row.jumlah_kering_harian) || 0,
  }));
}

/**
 * Get ringkasan bagi hasil per penyedia via RPC
 */
export async function getRingkasanBagiHasil(periode: string, penyediaId?: number | null): Promise<RingkasanBagiHasil[]> {
  const { data, error } = await supabase.rpc('get_ringkasan_bagi_hasil', {
    p_periode: periode,
    p_penyedia_id: penyediaId || null,
  });

  if (error) {
    console.error('getRingkasanBagiHasil error:', error.message);
    return [];
  }

  // Map and calculate pendapatan bersih
  return (data || []).map((row: any) => {
    const totalKotor = Number(row.total_kotor) || 0;
    const nilaiRetur = Number(row.nilai_retur) || 0;
    const potonganRS = Number(row.potongan_rs) || 0;

    return {
      penyediaId: row.penyedia_id,
      penyediaNama: row.penyedia_nama,
      totalKotor,
      barangRetur: Number(row.barang_retur) || 0,
      nilaiRetur,
      potonganRS,
      pendapatanBersih: totalKotor - potonganRS - nilaiRetur,
      totalTunai: Number(row.total_tunai) || 0,
      totalQRIS: Number(row.total_qris) || 0,
    };
  });
}

/**
 * Get laporan for a specific date
 */
export async function getLaporanTanggal(tanggal: string): Promise<LaporanHarian | null> {
  const results = await getLaporanHarian(tanggal);
  return results.length > 0 ? results[0] : null;
}
