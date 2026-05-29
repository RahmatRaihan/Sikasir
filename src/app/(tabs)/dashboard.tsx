// Dashboard Screen — Monitoring performa penjualan
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { Text, Divider, Button, SegmentedButtons } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { formatRupiah } from '@/utils/formatRupiah';
import { formatDateISO, formatBulan, formatTanggal } from '@/utils/dateHelper';
import StatCard from '@/components/common/StatCard';
import FilterBar from '@/components/common/FilterBar';
import { useFilterStore } from '@/store/filterStore';
import {
  getTotalPenjualanHariIni,
  getTotalPenjualanBulanan,
  getTotalItemTerjual,
  getDailySalesChart,
  getPeriodStats,
  getPeriodReturStats,
} from '@/db/queries/transaksi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DashboardScreen() {
  const filter = useFilterStore();
  const [viewMode, setViewMode] = useState<'harian' | 'bulanan'>('harian');
  const [selectedDate, setSelectedDate] = useState(formatDateISO(new Date()));
  const [dailyTotal, setDailyTotal] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [itemsSold, setItemsSold] = useState(0);
  const [chartData, setChartData] = useState<{
    tanggal: string;
    total: number;
    dwp: number;
    mona: number;
    harian: number;
    kering: number;
  }[]>([]);
  const [periodSales, setPeriodSales] = useState({ kotor: 0, potongan: 0, bersih: 0 });
  const [periodRetur, setPeriodRetur] = useState({ qty: 0, nilai: 0 });

  const loadDashboardData = useCallback(async () => {
    try {
      const today = formatDateISO(new Date());
      const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

      const dateForQuery = viewMode === 'harian' ? selectedDate : today;
      const monthForQuery = viewMode === 'bulanan' ? filter.bulan : currentMonth;
      const periodForQuery = viewMode === 'harian' ? selectedDate : filter.bulan;

      const [daily, monthly, items, chart, pSales, pRetur] = await Promise.all([
        getTotalPenjualanHariIni(filter.penyediaId, dateForQuery),
        getTotalPenjualanBulanan(monthForQuery, filter.penyediaId),
        getTotalItemTerjual(dateForQuery, filter.penyediaId),
        getDailySalesChart(7, filter.penyediaId),
        getPeriodStats(periodForQuery, filter.penyediaId),
        getPeriodReturStats(periodForQuery, filter.penyediaId),
      ]);

      setDailyTotal(daily);
      setMonthlyTotal(monthly);
      setItemsSold(items);
      setChartData(chart as any);
      setPeriodSales(pSales);
      setPeriodRetur(pRetur);
    } catch (e) {
      console.error('Dashboard load error:', e);
    }
  }, [filter.penyediaId, filter.bulan, viewMode, selectedDate]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Navigate date
  const navigateDate = (direction: -1 | 1) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + direction);
    setSelectedDate(formatDateISO(d));
  };

  // Navigate month
  const navigateMonth = (direction: -1 | 1) => {
    const [y, m] = filter.bulan.split('-').map(Number);
    let newY = y;
    let newM = m + direction;
    if (newM < 1) { newY--; newM = 12; }
    if (newM > 12) { newY++; newM = 1; }
    filter.setBulan(`${newY}-${String(newM).padStart(2, '0')}`);
  };

  // Find max value for simple chart rendering
  const maxChartValue = Math.max(...chartData.map((d) => d.total), 1);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Dashboard Penjualan</Text>
          <Text style={styles.headerDate}>{formatTanggal(new Date())}</Text>
        </View>
        <MaterialCommunityIcons name="chart-bar" size={28} color={Colors.white} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {/* Filter */}
        <View style={styles.filterContainer}>
          {/* Period Toggle */}
          <SegmentedButtons
            value={viewMode}
            onValueChange={(v) => setViewMode(v as 'harian' | 'bulanan')}
            buttons={[
              { value: 'harian', label: '📅 Harian' },
              { value: 'bulanan', label: '📆 Bulanan' },
            ]}
            style={styles.segmentedButtons}
          />

          {/* Date/Month Picker */}
          <View style={styles.periodSelector}>
            {viewMode === 'harian' ? (
              <>
                <Text style={styles.filterLabel}>Tanggal:</Text>
                <View style={styles.pickerRow}>
                  <Button mode="outlined" compact onPress={() => navigateDate(-1)} style={styles.navButton}>◀</Button>
                  <Text style={styles.periodText}>{selectedDate}</Text>
                  <Button mode="outlined" compact onPress={() => navigateDate(1)} style={styles.navButton}>▶</Button>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.filterLabel}>Bulan:</Text>
                <View style={styles.pickerRow}>
                  <Button mode="outlined" compact onPress={() => navigateMonth(-1)} style={styles.navButton}>◀</Button>
                  <Text style={styles.periodText}>{filter.bulan}</Text>
                  <Button mode="outlined" compact onPress={() => navigateMonth(1)} style={styles.navButton}>▶</Button>
                </View>
              </>
            )}
          </View>

          <FilterBar
            selectedPenyediaId={filter.penyediaId}
            onPenyediaChange={filter.setPenyediaId}
          />
        </View>

        {/* Stat Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsScroll}
          style={styles.statsScrollContainer}
          nestedScrollEnabled={true}
        >
          <StatCard
            title={viewMode === 'harian' ? 'Kotor Hari Ini' : 'Kotor Bulan Ini'}
            value={formatRupiah(periodSales.kotor)}
            icon="cash"
            color={Colors.primary}
          />
          {viewMode === 'harian' && (
            <StatCard
              title="Kotor Bulan Ini"
              value={formatRupiah(monthlyTotal)}
              icon="calendar-month"
              color={Colors.primaryLight}
            />
          )}
          <StatCard
            title={viewMode === 'harian' ? 'Item Terjual Hari Ini' : 'Item Terjual Bulan Ini'}
            value={`${itemsSold} pcs`}
            icon="package-variant-closed"
            color={Colors.accent}
          />
          <StatCard
            title={viewMode === 'harian' ? 'Retur Hari Ini' : 'Retur Bulan Ini'}
            value={`${periodRetur.qty} pcs`}
            subtitle={formatRupiah(periodRetur.nilai)}
            icon="keyboard-backspace"
            color={Colors.danger}
          />
          <StatCard
            title={viewMode === 'harian' ? 'Bersih Hari Ini' : 'Bersih Bulan Ini'}
            value={formatRupiah(periodSales.kotor - periodSales.potongan - periodRetur.nilai)}
            subtitle="Setelah Potongan RS & Retur"
            icon="wallet"
            color={Colors.secondary}
          />
        </ScrollView>

        {/* Sales Chart (Simple bar chart) */}
        <View style={[styles.chartCard, Shadows.md]}>
          <Text style={styles.chartTitle}>📊 Penjualan 7 Hari Terakhir</Text>
          <Divider style={{ marginVertical: Spacing.md }} />

          {chartData.length === 0 ? (
            <View style={styles.emptyChart}>
              <MaterialCommunityIcons name="chart-line" size={48} color={Colors.textLight} />
              <Text style={styles.emptyChartText}>Belum ada data penjualan</Text>
            </View>
          ) : (
            <>
              <View style={styles.barChart}>
                {chartData.map((item, index) => {
                  const barHeight = Math.max((item.total / maxChartValue) * 120, 4);
                  const dayLabel = item.tanggal.slice(-2); // DD

                  return (
                    <View key={index} style={styles.barItem}>
                      <Text style={styles.barValue}>
                        {item.total > 0 ? formatRupiah(item.total, true) : '-'}
                      </Text>
                      <View
                        style={[
                          styles.barContainer,
                          {
                            height: barHeight,
                            backgroundColor: item.total > 0 ? 'transparent' : Colors.divider,
                          },
                        ]}
                      >
                        {item.total > 0 && (
                          <>
                            {item.dwp > 0 && (
                              <View style={{ flex: item.dwp, backgroundColor: Colors.dwp }} />
                            )}
                            {item.mona > 0 && (
                              <View style={{ flex: item.mona, backgroundColor: Colors.mona }} />
                            )}
                            {item.harian > 0 && (
                              <View style={{ flex: item.harian, backgroundColor: Colors.harian }} />
                            )}
                            {item.kering > 0 && (
                              <View style={{ flex: item.kering, backgroundColor: Colors.kering }} />
                            )}
                          </>
                        )}
                      </View>
                      <Text style={styles.barLabel}>{dayLabel}</Text>
                    </View>
                  );
                })}
              </View>

              {/* Chart Legend */}
              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: Colors.dwp }]} />
                  <Text style={styles.legendLabel}>DWP</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: Colors.mona }]} />
                  <Text style={styles.legendLabel}>Mona</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: Colors.harian }]} />
                  <Text style={styles.legendLabel}>Harian</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: Colors.kering }]} />
                  <Text style={styles.legendLabel}>Kering</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Summary by Penyedia */}
        <View style={[styles.summaryCard, Shadows.md]}>
          <Text style={styles.chartTitle}>📋 Ringkasan Per Penyedia</Text>
          <Divider style={{ marginVertical: Spacing.md }} />

          {[
            { name: 'DWP', color: Colors.dwp, icon: 'cookie' },
            { name: 'Mona', color: Colors.mona, icon: 'cupcake' },
            { name: 'Harian', color: Colors.harian, icon: 'food-apple' },
            { name: 'Kering', color: Colors.kering, icon: 'package-variant-closed' },
          ].map((item) => (
            <View key={item.name} style={styles.summaryRow}>
              <View style={styles.summaryLeft}>
                <View style={[styles.summaryIcon, { backgroundColor: `${item.color}15` }]}>
                  <MaterialCommunityIcons name={item.icon as any} size={20} color={item.color} />
                </View>
                <Text style={styles.summaryName}>{item.name}</Text>
              </View>
              <View style={[styles.summaryBadge, { backgroundColor: `${item.color}10` }]}>
                <Text style={[styles.summaryBadgeText, { color: item.color }]}>
                  Aktif
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: Spacing.xxxl }} />
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
  headerDate: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  filterContainer: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  segmentedButtons: {
    maxWidth: 280,
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  navButton: {
    borderRadius: BorderRadius.md,
    minWidth: 40,
  },
  periodText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    minWidth: 100,
    textAlign: 'center',
  },
  statsScroll: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statsScrollContainer: {
    marginHorizontal: -Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  chartCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptyChart: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyChartText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 180,
    paddingTop: Spacing.lg,
  },
  barItem: {
    alignItems: 'center',
    flex: 1,
  },
  barValue: {
    fontSize: 9,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  barContainer: {
    width: 32,
    borderRadius: 4,
    minHeight: 4,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  barLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
    fontWeight: '600',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  summaryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
  },
  summaryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
