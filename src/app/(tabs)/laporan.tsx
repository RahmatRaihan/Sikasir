// Laporan Screen — Reports with daily/monthly view, bagi hasil, and export
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Button, DataTable, Divider, SegmentedButtons, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { formatRupiah } from '@/utils/formatRupiah';
import { formatBulan, formatTanggal, formatDateISO } from '@/utils/dateHelper';
import FilterBar from '@/components/common/FilterBar';
import { useFilterStore } from '@/store/filterStore';
import { getLaporanHarian, getRingkasanBagiHasil } from '@/db/queries/laporan';
import type { LaporanHarian, RingkasanBagiHasil } from '@/db/queries/laporan';
import { exportLaporanExcel } from '@/utils/exportExcel';
import { getPenyediaById } from '@/constants/penyedia';
import { getTransaksiByDate, getTransaksiByMonth } from '@/db/queries/transaksi';
import { supabase } from '@/db/supabaseClient';

export default function LaporanScreen() {
  const filter = useFilterStore();
  const [viewMode, setViewMode] = useState<'bulanan' | 'harian'>('bulanan');
  const [selectedDate, setSelectedDate] = useState(formatDateISO(new Date()));
  const [dataHarian, setDataHarian] = useState<LaporanHarian[]>([]);
  const [dataBagiHasil, setDataBagiHasil] = useState<RingkasanBagiHasil[]>([]);
  const [exporting, setExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [transaksiList, setTransaksiList] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      const periode = viewMode === 'harian' ? selectedDate : filter.bulan;
      const harian = await getLaporanHarian(periode, filter.penyediaId);
      const bagiHasil = await getRingkasanBagiHasil(periode, filter.penyediaId);
      setDataHarian(harian);
      setDataBagiHasil(bagiHasil);

      // Load transaksi list
      const trxData = viewMode === 'harian'
        ? await getTransaksiByDate(selectedDate)
        : await getTransaksiByMonth(filter.bulan);
      setTransaksiList(trxData);
    } catch (e) {
      console.error('Load laporan error:', e);
    }
  }, [filter.bulan, filter.penyediaId, viewMode, selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const periodeLabel = viewMode === 'harian' ? selectedDate : filter.bulan;
      await exportLaporanExcel(dataHarian, dataBagiHasil, periodeLabel);
      Toast.show({
        type: 'success',
        text1: '✅ Export Berhasil',
        text2: 'File Excel telah dibuat',
        position: 'bottom',
      });
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Export Gagal',
        text2: e.message,
        position: 'bottom',
      });
    }
    setExporting(false);
  };

  // Delete transaksi (with confirmation)
  const handleDeleteTransaksi = (id: number, nomorTransaksi: string) => {
    Alert.alert(
      'Hapus Transaksi',
      `Anda yakin ingin menghapus transaksi ${nomorTransaksi}?\n\nStok produk yang terkait akan dikembalikan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              // Get items to restore stock
              const { data: items } = await supabase
                .from('transaksi_item')
                .select('produk_id, qty')
                .eq('transaksi_id', id);

              // Restore stock for each item
              if (items) {
                for (const item of items) {
                  await supabase.rpc('restore_stock', {
                    p_produk_id: item.produk_id,
                    p_qty: item.qty,
                  });
                }
              }

              // Delete items then transaction
              await supabase.from('transaksi_item').delete().eq('transaksi_id', id);
              await supabase.from('transaksi').delete().eq('id', id);

              Toast.show({
                type: 'success',
                text1: '✓ Transaksi dihapus',
                text2: `${nomorTransaksi} berhasil dihapus`,
                position: 'bottom',
              });

              // Reload data
              await loadData();
            } catch (e: any) {
              Toast.show({
                type: 'error',
                text1: 'Gagal menghapus',
                text2: e.message,
                position: 'bottom',
              });
            }
          },
        },
      ]
    );
  };

  // Edit transaksi (Toggle / change payment method)
  const handleEditTransaksi = (trx: any) => {
    const newMethod = trx.metode_bayar === 'QRIS' ? 'tunai' : 'qris';
    Alert.alert(
      'Ubah Metode Bayar',
      `Ubah metode pembayaran transaksi ${trx.nomor_transaksi} menjadi ${newMethod.toUpperCase()}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ubah',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('transaksi')
                .update({ metode_bayar: newMethod })
                .eq('id', trx.id);
              if (error) throw error;

              Toast.show({
                type: 'success',
                text1: '✓ Berhasil diubah',
                text2: `Metode bayar ${trx.nomor_transaksi} diubah ke ${newMethod.toUpperCase()}`,
                position: 'bottom',
              });
              await loadData();
            } catch (e: any) {
              Toast.show({
                type: 'error',
                text1: 'Gagal mengubah',
                text2: e.message,
                position: 'bottom',
              });
            }
          }
        }
      ]
    );
  };

  // Edit tanggal (Filter to this date)
  const handleEditTanggal = (tanggal: string) => {
    setViewMode('harian');
    setSelectedDate(tanggal);
    Toast.show({
      type: 'info',
      text1: '📅 Filter Tanggal Aktif',
      text2: `Melihat transaksi untuk tanggal ${tanggal}`,
      position: 'bottom',
    });
  };

  // Hapus semua transaksi pada tanggal tertentu
  const handleHapusTanggal = (tanggal: string) => {
    Alert.alert(
      'Hapus Transaksi Harian',
      `Anda yakin ingin menghapus semua transaksi pada tanggal ${tanggal}?\n\nStok semua produk yang terjual akan dikembalikan ke kondisi semula.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus Semua',
          style: 'destructive',
          onPress: async () => {
            try {
              // 1. Get all transactions on this date
              const { data: trxsFiltered, error: filteredError } = await supabase
                .from('transaksi')
                .select('id')
                .eq('tanggal', tanggal);
              
              if (filteredError) throw filteredError;
              if (!trxsFiltered || trxsFiltered.length === 0) {
                Toast.show({
                  type: 'info',
                  text1: 'Tidak ada transaksi',
                  text2: 'Tidak ada transaksi yang dapat dihapus pada tanggal ini',
                  position: 'bottom',
                });
                return;
              }

              const trxIds = trxsFiltered.map(t => t.id);

              // 2. Get all transaction items to restore stock
              const { data: items, error: itemsError } = await supabase
                .from('transaksi_item')
                .select('produk_id, qty')
                .in('transaksi_id', trxIds);

              if (itemsError) throw itemsError;

              // 3. Restore stock for each item
              if (items) {
                for (const item of items) {
                  await supabase.rpc('restore_stock', {
                    p_produk_id: item.produk_id,
                    p_qty: item.qty,
                  });
                }
              }

              // 4. Delete items then transactions
              await supabase.from('transaksi_item').delete().in('transaksi_id', trxIds);
              await supabase.from('transaksi').delete().in('id', trxIds);

              Toast.show({
                type: 'success',
                text1: '✓ Berhasil Dihapus',
                text2: `Semua transaksi pada ${tanggal} telah dihapus`,
                position: 'bottom',
              });

              await loadData();
            } catch (e: any) {
              Toast.show({
                type: 'error',
                text1: 'Gagal menghapus',
                text2: e.message,
                position: 'bottom',
              });
            }
          }
        }
      ]
    );
  };

  // Edit penyedia (Filter to this penyedia)
  const handleEditPenyedia = (penyediaId: number) => {
    filter.setPenyediaId(penyediaId);
    Toast.show({
      type: 'info',
      text1: '🏢 Filter Penyedia Aktif',
      text2: `Hanya menampilkan data penyedia yang dipilih`,
      position: 'bottom',
    });
  };

  // Hapus semua transaksi untuk penyedia tertentu pada periode terpilih
  const handleHapusPenyedia = (penyediaId: number, namaPenyedia: string) => {
    const periode = viewMode === 'harian' ? selectedDate : filter.bulan;
    Alert.alert(
      'Hapus Data Penyedia',
      `Anda yakin ingin menghapus semua transaksi untuk penyedia "${namaPenyedia}" pada periode ${periode}?\n\nStok produk terkait akan dikembalikan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              // 1. Get all transaction items for this penyedia in the period
              const { data: items, error: itemsError } = await supabase
                .from('transaksi_item')
                .select('id, transaksi_id, produk_id, qty, transaksi!inner(tanggal)')
                .eq('penyedia_id', penyediaId)
                .ilike('transaksi.tanggal', `${periode}%`);

              if (itemsError) throw itemsError;
              if (!items || items.length === 0) {
                Toast.show({
                  type: 'info',
                  text1: 'Tidak ada data',
                  text2: `Tidak ada penjualan untuk ${namaPenyedia} pada periode ini`,
                  position: 'bottom',
                });
                return;
              }

              const itemIds = items.map(i => i.id);
              const trxIds = Array.from(new Set(items.map(i => i.transaksi_id)));

              // 2. Restore stock for each item
              for (const item of items) {
                await supabase.rpc('restore_stock', {
                  p_produk_id: item.produk_id,
                  p_qty: item.qty,
                });
              }

              // 3. Delete the transaction items
              await supabase.from('transaksi_item').delete().in('id', itemIds);

              // 4. Clean up any transactions that are now empty (have 0 items)
              for (const trxId of trxIds) {
                const { data: remainingItems } = await supabase
                  .from('transaksi_item')
                  .select('id')
                  .eq('transaksi_id', trxId)
                  .limit(1);
                
                if (!remainingItems || remainingItems.length === 0) {
                  await supabase.from('transaksi').delete().eq('id', trxId);
                } else {
                  const { data: allTrxItems } = await supabase
                    .from('transaksi_item')
                    .select('subtotal')
                    .eq('transaksi_id', trxId);
                  
                  const newTotal = (allTrxItems || []).reduce((sum, item) => sum + Number(item.subtotal), 0);
                  await supabase
                    .from('transaksi')
                    .update({ total_tagihan: newTotal })
                    .eq('id', trxId);
                }
              }

              Toast.show({
                type: 'success',
                text1: '✓ Berhasil Dihapus',
                text2: `Transaksi ${namaPenyedia} berhasil dihapus`,
                position: 'bottom',
              });

              await loadData();
            } catch (e: any) {
              Toast.show({
                type: 'error',
                text1: 'Gagal menghapus',
                text2: e.message,
                position: 'bottom',
              });
            }
          }
        }
      ]
    );
  };

  // Navigate date
  const navigateDate = (direction: -1 | 1) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + direction);
    setSelectedDate(formatDateISO(d));
  };

  // Calculate totals for summary
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Laporan Penjualan</Text>
          <Text style={styles.headerSubtitle}>
            Periode: {viewMode === 'harian' ? selectedDate : filter.bulan}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Button
            mode="contained"
            icon="microsoft-excel"
            onPress={handleExport}
            loading={exporting}
            disabled={exporting || dataHarian.length === 0}
            buttonColor="#217346"
            style={styles.exportButton}
            labelStyle={{ fontWeight: '700', fontSize: 13 }}
          >
            Export Excel
          </Button>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        {/* View Mode Toggle */}
        <View style={styles.viewModeRow}>
          <SegmentedButtons
            value={viewMode}
            onValueChange={(v) => setViewMode(v as 'bulanan' | 'harian')}
            buttons={[
              { value: 'harian', label: '📅 Harian' },
              { value: 'bulanan', label: '📆 Bulanan' },
            ]}
            style={styles.segmentedButtons}
          />
        </View>

        {/* Period selector */}
        <View style={styles.periodSelector}>
          {viewMode === 'bulanan' ? (
            <>
              <Text style={styles.filterLabel}>Bulan:</Text>
              <View style={styles.monthPicker}>
                <Button
                  mode="outlined"
                  compact
                  onPress={() => {
                    const [y, m] = filter.bulan.split('-').map(Number);
                    const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
                    filter.setBulan(prev);
                  }}
                  style={styles.monthButton}
                >
                  ◀
                </Button>
                <Text style={styles.monthText}>{filter.bulan}</Text>
                <Button
                  mode="outlined"
                  compact
                  onPress={() => {
                    const [y, m] = filter.bulan.split('-').map(Number);
                    const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
                    filter.setBulan(next);
                  }}
                  style={styles.monthButton}
                >
                  ▶
                </Button>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.filterLabel}>Tanggal:</Text>
              <View style={styles.monthPicker}>
                <Button mode="outlined" compact onPress={() => navigateDate(-1)} style={styles.monthButton}>
                  ◀
                </Button>
                <Text style={styles.monthText}>{selectedDate}</Text>
                <Button mode="outlined" compact onPress={() => navigateDate(1)} style={styles.monthButton}>
                  ▶
                </Button>
              </View>
            </>
          )}
        </View>
        <FilterBar
          selectedPenyediaId={filter.penyediaId}
          onPenyediaChange={filter.setPenyediaId}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {/* Tabel 1: Rincian Penjualan Harian */}
        <View style={[styles.tableCard, Shadows.md]}>
          <Text style={styles.tableTitle}>📊 Rincian Penjualan {viewMode === 'harian' ? 'Hari Ini' : 'Harian'}</Text>
          <Divider style={{ marginVertical: Spacing.md }} />

          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <DataTable style={styles.table}>
              <DataTable.Header style={styles.tableHeader}>
                <DataTable.Title style={styles.colTanggal}>
                  <Text style={styles.headerCell}>Tanggal</Text>
                </DataTable.Title>
                <DataTable.Title style={styles.colAmount} numeric>
                  <Text style={styles.headerCell}>Penjualan (Rp)</Text>
                </DataTable.Title>
                <DataTable.Title style={styles.colAmount} numeric>
                  <Text style={styles.headerCell}>Kering (Rp)</Text>
                </DataTable.Title>
                <DataTable.Title style={styles.colAmount} numeric>
                  <Text style={styles.headerCell}>DWP (Rp)</Text>
                </DataTable.Title>
                <DataTable.Title style={styles.colAmount} numeric>
                  <Text style={styles.headerCell}>Mona (Rp)</Text>
                </DataTable.Title>
                <DataTable.Title style={styles.colAmount} numeric>
                  <Text style={styles.headerCell}>Harian (Rp)</Text>
                </DataTable.Title>
                <DataTable.Title style={styles.colSmall} numeric>
                  <Text style={styles.headerCell}>Retur</Text>
                </DataTable.Title>
                <DataTable.Title style={styles.colAmount} numeric>
                  <Text style={styles.headerCell}>Kering+Harian</Text>
                </DataTable.Title>
                <DataTable.Title style={styles.colAksi} numeric>
                  <Text style={styles.headerCell}>Aksi</Text>
                </DataTable.Title>
              </DataTable.Header>

              {dataHarian.length === 0 ? (
                <View style={styles.emptyTable}>
                  <Text style={styles.emptyText}>Belum ada data penjualan</Text>
                </View>
              ) : (
                <>
                  {dataHarian.map((row, index) => (
                    <DataTable.Row key={index} style={styles.tableRow}>
                      <DataTable.Cell style={styles.colTanggal}>
                        <Text style={styles.cellText}>{row.tanggal}</Text>
                      </DataTable.Cell>
                      <DataTable.Cell style={styles.colAmount} numeric>
                        <Text style={styles.amountText}>{formatRupiah(row.penjualanHarian)}</Text>
                      </DataTable.Cell>
                      <DataTable.Cell style={styles.colAmount} numeric>
                        <Text style={styles.cellText}>{formatRupiah(row.titipanKering)}</Text>
                      </DataTable.Cell>
                      <DataTable.Cell style={styles.colAmount} numeric>
                        <Text style={styles.cellText}>{formatRupiah(row.produkDWP)}</Text>
                      </DataTable.Cell>
                      <DataTable.Cell style={styles.colAmount} numeric>
                        <Text style={styles.cellText}>{formatRupiah(row.titipanMona)}</Text>
                      </DataTable.Cell>
                      <DataTable.Cell style={styles.colAmount} numeric>
                        <Text style={styles.cellText}>{formatRupiah(row.barangHarian)}</Text>
                      </DataTable.Cell>
                      <DataTable.Cell style={styles.colSmall} numeric>
                        <Text style={[styles.cellText, row.barangRetur > 0 && { color: Colors.danger }]}>
                          {row.barangRetur}
                        </Text>
                      </DataTable.Cell>
                      <DataTable.Cell style={styles.colAmount} numeric>
                        <Text style={styles.cellText}>{formatRupiah(row.jumlahKeringHarian)}</Text>
                      </DataTable.Cell>
                      <DataTable.Cell style={styles.colAksi} numeric>
                        <View style={{ flexDirection: 'row', gap: 2, justifyContent: 'flex-end' }}>
                          <IconButton
                            icon="pencil-outline"
                            iconColor={Colors.primary}
                            size={18}
                            onPress={() => handleEditTanggal(row.tanggal)}
                            style={{ margin: 0 }}
                          />
                          <IconButton
                            icon="delete-outline"
                            iconColor={Colors.danger}
                            size={18}
                            onPress={() => handleHapusTanggal(row.tanggal)}
                            style={{ margin: 0 }}
                          />
                        </View>
                      </DataTable.Cell>
                    </DataTable.Row>
                  ))}

                  {/* Totals Row */}
                  <DataTable.Row style={styles.totalRow}>
                    <DataTable.Cell style={styles.colTanggal}>
                      <Text style={styles.totalText}>TOTAL</Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.colAmount} numeric>
                      <Text style={styles.totalAmount}>{formatRupiah(totalHarian.penjualan)}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.colAmount} numeric>
                      <Text style={styles.totalText}>{formatRupiah(totalHarian.kering)}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.colAmount} numeric>
                      <Text style={styles.totalText}>{formatRupiah(totalHarian.dwp)}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.colAmount} numeric>
                      <Text style={styles.totalText}>{formatRupiah(totalHarian.mona)}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.colAmount} numeric>
                      <Text style={styles.totalText}>{formatRupiah(totalHarian.harian)}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.colSmall} numeric>
                      <Text style={styles.totalText}>{totalHarian.retur}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.colAmount} numeric>
                      <Text style={styles.totalText}>{formatRupiah(totalHarian.keringHarian)}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.colAksi} numeric>
                      <Text>{''}</Text>
                    </DataTable.Cell>
                  </DataTable.Row>
                </>
              )}
            </DataTable>
          </ScrollView>
        </View>

        {/* Tabel 2: Ringkasan Bagi Hasil */}
        <View style={[styles.tableCard, Shadows.md]}>
          <Text style={styles.tableTitle}>📋 Ringkasan Bagi Hasil & Potongan</Text>
          <Divider style={{ marginVertical: Spacing.md }} />

          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <DataTable style={styles.table}>
              <DataTable.Header style={styles.tableHeader}>
                <DataTable.Title style={styles.colPenyedia}>
                  <Text style={styles.headerCell}>Penyedia</Text>
                </DataTable.Title>
                <DataTable.Title style={styles.colAmount} numeric>
                  <Text style={styles.headerCell}>Total Kotor</Text>
                </DataTable.Title>
                <DataTable.Title style={styles.colAmount} numeric>
                  <Text style={styles.headerCell}>Tunai</Text>
                </DataTable.Title>
                <DataTable.Title style={styles.colAmount} numeric>
                  <Text style={styles.headerCell}>QRIS</Text>
                </DataTable.Title>
                <DataTable.Title style={styles.colSmall} numeric>
                  <Text style={styles.headerCell}>Retur (pcs)</Text>
                </DataTable.Title>
                <DataTable.Title style={styles.colAmount} numeric>
                  <Text style={styles.headerCell}>Nilai Retur</Text>
                </DataTable.Title>
                <DataTable.Title style={styles.colAmount} numeric>
                  <Text style={styles.headerCell}>Potongan RS</Text>
                </DataTable.Title>
                <DataTable.Title style={styles.colAmount} numeric>
                  <Text style={styles.headerCell}>Pendapatan Bersih</Text>
                </DataTable.Title>
                <DataTable.Title style={styles.colAksi} numeric>
                  <Text style={styles.headerCell}>Aksi</Text>
                </DataTable.Title>
              </DataTable.Header>

              {dataBagiHasil.length === 0 ? (
                <View style={styles.emptyTable}>
                  <Text style={styles.emptyText}>Belum ada data</Text>
                </View>
              ) : (
                <>
                  {dataBagiHasil.map((row) => {
                    const penyedia = getPenyediaById(row.penyediaId);
                    return (
                      <DataTable.Row key={row.penyediaId} style={styles.tableRow}>
                        <DataTable.Cell style={styles.colPenyedia}>
                          <View style={[styles.penyediaBadge, { backgroundColor: penyedia?.bgColor }]}>
                            <Text style={[styles.penyediaBadgeText, { color: penyedia?.color }]}>
                              {row.penyediaNama}
                            </Text>
                          </View>
                        </DataTable.Cell>
                        <DataTable.Cell style={styles.colAmount} numeric>
                          <Text style={styles.cellText}>{formatRupiah(row.totalKotor)}</Text>
                        </DataTable.Cell>
                        <DataTable.Cell style={styles.colAmount} numeric>
                          <Text style={styles.cellText}>{formatRupiah(row.totalTunai)}</Text>
                        </DataTable.Cell>
                        <DataTable.Cell style={styles.colAmount} numeric>
                          <Text style={styles.cellText}>{formatRupiah(row.totalQRIS)}</Text>
                        </DataTable.Cell>
                        <DataTable.Cell style={styles.colSmall} numeric>
                          <Text style={styles.cellText}>{row.barangRetur}</Text>
                        </DataTable.Cell>
                        <DataTable.Cell style={styles.colAmount} numeric>
                          <Text style={[styles.cellText, row.nilaiRetur > 0 && { color: Colors.danger }]}>
                            {formatRupiah(row.nilaiRetur)}
                          </Text>
                        </DataTable.Cell>
                        <DataTable.Cell style={styles.colAmount} numeric>
                          <Text style={[styles.cellText, row.potonganRS > 0 && { color: Colors.accent }]}>
                            {formatRupiah(row.potonganRS)}
                          </Text>
                        </DataTable.Cell>
                        <DataTable.Cell style={styles.colAmount} numeric>
                          <Text style={styles.amountText}>{formatRupiah(row.pendapatanBersih)}</Text>
                        </DataTable.Cell>
                        <DataTable.Cell style={styles.colAksi} numeric>
                          <View style={{ flexDirection: 'row', gap: 2, justifyContent: 'flex-end' }}>
                            <IconButton
                              icon="filter-outline"
                              iconColor={Colors.primary}
                              size={18}
                              onPress={() => handleEditPenyedia(row.penyediaId)}
                              style={{ margin: 0 }}
                            />
                            <IconButton
                              icon="delete-outline"
                              iconColor={Colors.danger}
                              size={18}
                              onPress={() => handleHapusPenyedia(row.penyediaId, row.penyediaNama)}
                              style={{ margin: 0 }}
                            />
                          </View>
                        </DataTable.Cell>
                      </DataTable.Row>
                    );
                  })}

                  {/* Totals Row */}
                  <DataTable.Row style={styles.totalRow}>
                    <DataTable.Cell style={styles.colPenyedia}>
                      <Text style={styles.totalText}>TOTAL</Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.colAmount} numeric>
                      <Text style={styles.totalAmount}>
                        {formatRupiah(dataBagiHasil.reduce((s, r) => s + r.totalKotor, 0))}
                      </Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.colAmount} numeric>
                      <Text style={styles.totalText}>
                        {formatRupiah(dataBagiHasil.reduce((s, r) => s + r.totalTunai, 0))}
                      </Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.colAmount} numeric>
                      <Text style={styles.totalText}>
                        {formatRupiah(dataBagiHasil.reduce((s, r) => s + r.totalQRIS, 0))}
                      </Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.colSmall} numeric>
                      <Text style={styles.totalText}>
                        {dataBagiHasil.reduce((s, r) => s + r.barangRetur, 0)}
                      </Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.colAmount} numeric>
                      <Text style={styles.totalText}>
                        {formatRupiah(dataBagiHasil.reduce((s, r) => s + r.nilaiRetur, 0))}
                      </Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.colAmount} numeric>
                      <Text style={styles.totalText}>
                        {formatRupiah(dataBagiHasil.reduce((s, r) => s + r.potonganRS, 0))}
                      </Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.colAmount} numeric>
                      <Text style={styles.totalAmount}>
                        {formatRupiah(dataBagiHasil.reduce((s, r) => s + r.pendapatanBersih, 0))}
                      </Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.colAksi} numeric>
                      <Text>{''}</Text>
                    </DataTable.Cell>
                  </DataTable.Row>
                </>
              )}
            </DataTable>
          </ScrollView>
        </View>

        {/* Tabel 3: Daftar Transaksi (with edit/delete) */}
        <View style={[styles.tableCard, Shadows.md]}>
          <Text style={styles.tableTitle}>🧾 Daftar Transaksi</Text>
          <Divider style={{ marginVertical: Spacing.md }} />

          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <DataTable style={{ minWidth: 700 }}>
              <DataTable.Header style={styles.tableHeader}>
                <DataTable.Title style={{ width: 160 }}>
                  <Text style={styles.headerCell}>No. Transaksi</Text>
                </DataTable.Title>
                <DataTable.Title style={{ width: 110 }}>
                  <Text style={styles.headerCell}>Tanggal</Text>
                </DataTable.Title>
                <DataTable.Title style={{ width: 100 }}>
                  <Text style={styles.headerCell}>Metode</Text>
                </DataTable.Title>
                <DataTable.Title style={styles.colAmount} numeric>
                  <Text style={styles.headerCell}>Total (Rp)</Text>
                </DataTable.Title>
                <DataTable.Title style={{ width: 100 }}>
                  <Text style={styles.headerCell}>Aksi</Text>
                </DataTable.Title>
              </DataTable.Header>

              {transaksiList.length === 0 ? (
                <View style={styles.emptyTable}>
                  <Text style={styles.emptyText}>Belum ada transaksi</Text>
                </View>
              ) : (
                transaksiList.map((trx) => (
                  <DataTable.Row key={trx.id} style={styles.tableRow}>
                    <DataTable.Cell style={{ width: 160 }}>
                      <Text style={[styles.cellText, { fontFamily: 'monospace', fontSize: 11 }]}>
                        {trx.nomor_transaksi}
                      </Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={{ width: 110 }}>
                      <Text style={styles.cellText}>{trx.tanggal}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={{ width: 100 }}>
                      <View style={[
                        styles.metodeBadge,
                        { backgroundColor: trx.metode_bayar === 'QRIS' ? '#E8F5E9' : '#E3F2FD' }
                      ]}>
                        <Text style={[
                          styles.metodeBadgeText,
                          { color: trx.metode_bayar === 'QRIS' ? '#2E7D32' : '#1565C0' }
                        ]}>
                          {trx.metode_bayar}
                        </Text>
                      </View>
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.colAmount} numeric>
                      <Text style={styles.amountText}>{formatRupiah(trx.total_tagihan)}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={{ width: 100 }}>
                      <View style={{ flexDirection: 'row', gap: 2 }}>
                        <IconButton
                          icon="pencil-outline"
                          iconColor={Colors.primary}
                          size={20}
                          onPress={() => handleEditTransaksi(trx)}
                          style={{ margin: 0 }}
                        />
                        <IconButton
                          icon="delete-outline"
                          iconColor={Colors.danger}
                          size={20}
                          onPress={() => handleDeleteTransaksi(trx.id, trx.nomor_transaksi)}
                          style={{ margin: 0 }}
                        />
                      </View>
                    </DataTable.Cell>
                  </DataTable.Row>
                ))
              )}
            </DataTable>
          </ScrollView>
        </View>

        <View style={{ height: Spacing.xxxl * 2 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  exportButton: {
    borderRadius: BorderRadius.md,
  },
  filterContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  viewModeRow: {
    marginBottom: Spacing.sm,
  },
  segmentedButtons: {
    maxWidth: 280,
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  monthPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  monthButton: {
    borderRadius: BorderRadius.md,
    minWidth: 40,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    minWidth: 100,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  tableCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  table: {
    minWidth: 1300,
  },
  tableHeader: {
    backgroundColor: '#F8F9FA',
  },
  headerCell: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  totalRow: {
    backgroundColor: '#F0F7FF',
    borderBottomWidth: 0,
  },
  colTanggal: { width: 110 },
  colPenyedia: { width: 110 },
  colAmount: { width: 130 },
  colSmall: { width: 80 },
  colAksi: { width: 100 },
  cellText: {
    fontSize: 12,
    color: Colors.textPrimary,
  },
  amountText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  totalText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  totalAmount: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  penyediaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
  },
  penyediaBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyTable: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  metodeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
  },
  metodeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
