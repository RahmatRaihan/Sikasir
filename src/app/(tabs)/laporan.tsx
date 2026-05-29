// Laporan Screen — Reports with daily/monthly view, bagi hasil, and export
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, DataTable, Divider, SegmentedButtons } from 'react-native-paper';
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

export default function LaporanScreen() {
  const filter = useFilterStore();
  const [viewMode, setViewMode] = useState<'bulanan' | 'harian'>('bulanan');
  const [selectedDate, setSelectedDate] = useState(formatDateISO(new Date()));
  const [dataHarian, setDataHarian] = useState<LaporanHarian[]>([]);
  const [dataBagiHasil, setDataBagiHasil] = useState<RingkasanBagiHasil[]>([]);
  const [exporting, setExporting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const periode = viewMode === 'harian' ? selectedDate : filter.bulan;
      const harian = await getLaporanHarian(periode, filter.penyediaId);
      const bagiHasil = await getRingkasanBagiHasil(periode, filter.penyediaId);
      setDataHarian(harian);
      setDataBagiHasil(bagiHasil);
    } catch (e) {
      console.error('Load laporan error:', e);
    }
  }, [filter.bulan, filter.penyediaId, viewMode, selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
                  </DataTable.Row>
                </>
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
    minWidth: 1160,
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
});
