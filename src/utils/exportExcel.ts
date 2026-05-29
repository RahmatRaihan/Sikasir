// Export Excel utility using SheetJS (xlsx)
// Uses expo-file-system v56+ new API (File, Paths)
import * as XLSX from 'xlsx';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { formatRupiah } from './formatRupiah';
import type { LaporanHarian, RingkasanBagiHasil } from '../db/queries/laporan';
import { Alert } from 'react-native';

/**
 * Export laporan to Excel (.xlsx) with 2 sheets
 * Sheet 1: Rincian Penjualan Harian
 * Sheet 2: Ringkasan Bagi Hasil & Potongan
 */
export async function exportLaporanExcel(
  dataHarian: LaporanHarian[],
  dataBagiHasil: RingkasanBagiHasil[],
  periodeLabel: string
) {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // ─── Sheet 1: Rincian Penjualan Harian ───
  const harianHeaders = [
    'Tanggal',
    'Penjualan Harian (Rp)',
    'Titipan Kering (Rp)',
    'Produk DWP (Rp)',
    'Titipan Mona (Rp)',
    'Barang Harian (Rp)',
    'Barang Retur (pcs)',
    'Jumlah Kering & Harian (Rp)',
  ];

  const harianData = dataHarian.map((row) => [
    row.tanggal,
    row.penjualanHarian,
    row.titipanKering,
    row.produkDWP,
    row.titipanMona,
    row.barangHarian,
    row.barangRetur,
    row.jumlahKeringHarian,
  ]);

  // Add totals row
  const totalHarian = dataHarian.reduce(
    (acc, row) => ({
      penjualan: acc.penjualan + row.penjualanHarian,
      kering: acc.kering + row.titipanKering,
      dwp: acc.dwp + row.produkDWP,
      mona: acc.mona + row.titipanMona,
      harian: acc.harian + row.barangHarian,
      retur: acc.retur + row.barangRetur,
      keringHarian: acc.keringHarian + row.jumlahKeringHarian,
    }),
    { penjualan: 0, kering: 0, dwp: 0, mona: 0, harian: 0, retur: 0, keringHarian: 0 }
  );

  harianData.push([
    'TOTAL',
    totalHarian.penjualan,
    totalHarian.kering,
    totalHarian.dwp,
    totalHarian.mona,
    totalHarian.harian,
    totalHarian.retur,
    totalHarian.keringHarian,
  ]);

  const ws1 = XLSX.utils.aoa_to_sheet([
    [`Laporan Rincian Penjualan Harian — ${periodeLabel}`],
    [],
    harianHeaders,
    ...harianData,
  ]);

  // Set column widths
  ws1['!cols'] = [
    { wch: 14 },
    { wch: 20 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 24 },
  ];

  XLSX.utils.book_append_sheet(wb, ws1, 'Rincian Harian');

  // ─── Sheet 2: Ringkasan Bagi Hasil ───
  const bagiHasilHeaders = [
    'Nama Penyedia',
    'Total Kotor (Rp)',
    'Barang Retur (pcs)',
    'Nilai Retur (Rp)',
    'Potongan RS (Rp)',
    'Pendapatan Bersih (Rp)',
  ];

  const bagiHasilData = dataBagiHasil.map((row) => [
    row.penyediaNama,
    row.totalKotor,
    row.barangRetur,
    row.nilaiRetur,
    row.potonganRS,
    row.pendapatanBersih,
  ]);

  // Add totals row
  const totalBagiHasil = dataBagiHasil.reduce(
    (acc, row) => ({
      kotor: acc.kotor + row.totalKotor,
      retur: acc.retur + row.barangRetur,
      nilaiRetur: acc.nilaiRetur + row.nilaiRetur,
      potongan: acc.potongan + row.potonganRS,
      bersih: acc.bersih + row.pendapatanBersih,
    }),
    { kotor: 0, retur: 0, nilaiRetur: 0, potongan: 0, bersih: 0 }
  );

  bagiHasilData.push([
    'TOTAL',
    totalBagiHasil.kotor,
    totalBagiHasil.retur,
    totalBagiHasil.nilaiRetur,
    totalBagiHasil.potongan,
    totalBagiHasil.bersih,
  ]);

  const ws2 = XLSX.utils.aoa_to_sheet([
    [`Ringkasan Bagi Hasil & Potongan — ${periodeLabel}`],
    [],
    bagiHasilHeaders,
    ...bagiHasilData,
  ]);

  ws2['!cols'] = [
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 22 },
  ];

  XLSX.utils.book_append_sheet(wb, ws2, 'Ringkasan Bagi Hasil');

  // Generate file as Uint8Array
  const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const uint8 = new Uint8Array(wbout);
  
  const fileName = `Laporan_${periodeLabel.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;

  // Write using new expo-file-system API (File + Paths)
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  file.bytes = uint8;

  // Share the file (user can save to Files, Drive, WhatsApp, etc.)
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: `Simpan/Bagikan ${fileName}`,
    });
  } else {
    Alert.alert('Export Berhasil', `File disimpan di: ${file.uri}`);
  }

  return file.uri;
}
