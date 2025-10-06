import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { Stack } from 'expo-router';

import { ChevronDown, Lightbulb, Truck, TrendingUp } from 'lucide-react-native';

const { width } = Dimensions.get('window');

type TimeFilter = 7 | 14 | 30 | 45 | 60 | 90;

export default function ShipperAnalytics() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(30);
  const [showDropdown, setShowDropdown] = useState(false);

  const timeFilterOptions: TimeFilter[] = [7, 14, 30, 45, 60, 90];

  const analyticsData = useMemo(() => {
    console.log(`[Analytics] Calculating data for last ${timeFilter} days for shipper:`, user?.id);
    
    const loadsPosted = 1325;
    const loadsAccepted = 1093;
    const totalSpend = 450278;
    const avgPerMile = 2.48;
    const avgMilesPerLoad = 655;
    const onTimePercent = 86.3;

    return {
      loadsPosted,
      loadsAccepted,
      totalSpend,
      fillRate: ((loadsAccepted / loadsPosted) * 100).toFixed(1),
      avgPerMile: avgPerMile.toFixed(2),
      avgMilesPerLoad,
      onTimePercent: onTimePercent.toFixed(1),
      loadsVsFills: [
        { month: 'Jul', posted: 200, filled: 180 },
        { month: 'Aug', posted: 280, filled: 240 },
        { month: 'Sep', posted: 300, filled: 260 },
        { month: 'Oct', posted: 290, filled: 250 },
        { month: 'Nov', posted: 340, filled: 300 },
        { month: 'Dec', posted: 320, filled: 280 },
        { month: 'Jan', posted: 310, filled: 270 },
        { month: 'Feb', posted: 330, filled: 290 },
      ],
      spendByDay: [
        { day: 'Mon', amount: 18000 },
        { day: 'Tue', amount: 20000 },
        { day: 'Wed', amount: 24000 },
        { day: 'Thu', amount: 22000 },
        { day: 'Apr', amount: 21000 },
        { day: 'Sep', amount: 23000 },
        { day: 'Oct', amount: 20000 },
        { day: 'Nov', amount: 18000 },
        { day: 'Feb', amount: 19000 },
      ],
      equipmentMix: [
        { type: 'Van', percent: 55, color: '#0066FF' },
        { type: 'Flatbed', percent: 23, color: '#66A3FF' },
        { type: 'Reefer', percent: 20, color: '#B3D1FF' },
      ],
      cargoMix: [
        { type: 'Dry Goods', color: '#0066FF' },
        { type: 'Machinery', color: '#66A3FF' },
        { type: 'Refrigerated', color: '#B3D1FF' },
      ],
      topLanes: [
        { lane: 'Atlanta, GA to Charlotte, NC', count: 375 },
        { lane: 'Dallas, TX to Houston, TX', count: 342 },
        { lane: 'Chicago, IL to Detroit, MI', count: 298 },
      ],
      topDrivers: [
        { name: 'James K.', loads: 145 },
        { name: 'Sarah M.', loads: 132 },
        { name: 'Robert W.', loads: 135 },
      ],
    };
  }, [timeFilter, user?.id]);

  const maxSpend = Math.max(...analyticsData.spendByDay.map(d => d.amount));

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true }} />

      <View style={[styles.filterBar, { paddingTop: insets.top }]}>
        <Text style={styles.filterLabel}>Time Period:</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowDropdown(!showDropdown)}
        >
          <Text style={styles.filterButtonText}>Last {timeFilter} Days</Text>
          <ChevronDown size={16} color="#0066FF" />
        </TouchableOpacity>
        {showDropdown && (
          <View style={styles.dropdown}>
            {timeFilterOptions.map((days) => (
              <TouchableOpacity
                key={days}
                style={[
                  styles.dropdownItem,
                  timeFilter === days && styles.dropdownItemActive,
                ]}
                onPress={() => {
                  console.log(`[Analytics] Time filter changed to ${days} days`);
                  setTimeFilter(days);
                  setShowDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    timeFilter === days && styles.dropdownItemTextActive,
                  ]}
                >
                  Last {days} Days
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{analyticsData.loadsPosted.toLocaleString()}</Text>
            <Text style={styles.kpiLabel}>Active + Completed Loads</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>${analyticsData.totalSpend.toLocaleString()}</Text>
            <Text style={styles.kpiLabel}>Total Spend</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{analyticsData.fillRate}%</Text>
            <Text style={styles.kpiLabel}>Driver Acceptance Rate</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{analyticsData.avgPerMile}</Text>
            <Text style={styles.kpiLabel}>Avg Cost per Mile</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{analyticsData.avgMilesPerLoad}</Text>
            <Text style={styles.kpiLabel}>Avg Distance per Load</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{analyticsData.onTimePercent}%</Text>
            <Text style={styles.kpiLabel}>On-Time Delivery %</Text>
          </View>
        </View>

        <View style={styles.chartsRow}>
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Posts vs Accepted</Text>
            <View style={styles.areaChart}>
              {analyticsData.loadsVsFills.map((item, index) => (
                <View key={index} style={styles.areaChartColumn}>
                  <View style={styles.areaChartBar}>
                    <View
                      style={[
                        styles.areaChartFill,
                        { height: `${(item.posted / 400) * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.areaChartLabel}>{item.month}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Spend by Day</Text>
            <View style={styles.barChart}>
              <View style={styles.barChartYAxis}>
                <Text style={styles.yAxisLabel}>$25 k</Text>
                <Text style={styles.yAxisLabel}>$20 k</Text>
                <Text style={styles.yAxisLabel}>$15 k</Text>
                <Text style={styles.yAxisLabel}>$0 B</Text>
              </View>
              <View style={styles.barChartBars}>
                {analyticsData.spendByDay.map((item, index) => (
                  <View key={index} style={styles.barChartColumn}>
                    <View
                      style={[
                        styles.barChartBar,
                        { height: `${(item.amount / maxSpend) * 100}%` },
                      ]}
                    />
                    <Text style={styles.barChartLabel}>{item.day}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.mixRow}>
          <View style={styles.mixCard}>
            <Text style={styles.mixTitle}>Equipment Mix</Text>
            <View style={styles.donutChart}>
              <View style={styles.donutRing}>
                {analyticsData.equipmentMix.map((item, index) => (
                  <View
                    key={index}
                    style={[
                      styles.donutSegment,
                      {
                        backgroundColor: item.color,
                        transform: [{ rotate: `${index * 120}deg` }],
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
            <View style={styles.legend}>
              {analyticsData.equipmentMix.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText}>
                    {item.type} {item.percent}%
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.mixCard}>
            <Text style={styles.mixTitle}>Cargo Mix</Text>
            <View style={styles.donutChart}>
              <View style={styles.donutRing}>
                {analyticsData.cargoMix.map((item, index) => (
                  <View
                    key={index}
                    style={[
                      styles.donutSegment,
                      {
                        backgroundColor: item.color,
                        transform: [{ rotate: `${index * 120}deg` }],
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
            <View style={styles.legend}>
              {analyticsData.cargoMix.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText}>{item.type}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.slouretCard}>
            <Text style={styles.mixTitle}>Carrier Performance Trend</Text>
            <View style={styles.lineChart}>
              <View style={styles.lineChartPath} />
            </View>
            <View style={styles.lineChartXAxis}>
              <Text style={styles.lineChartLabel}>Jul</Text>
              <Text style={styles.lineChartLabel}>Sep</Text>
              <Text style={styles.lineChartLabel}>Feb</Text>
            </View>
          </View>

          <View style={styles.leadersCard}>
            <Text style={styles.mixTitle}>Top Carriers / Drivers</Text>
            <View style={styles.leadersHeader}>
              <Text style={styles.leadersHeaderText}>Lane</Text>
              <Text style={styles.leadersHeaderText}>Loads</Text>
            </View>
            {analyticsData.topDrivers.map((driver, index) => (
              <View key={index} style={styles.leaderRow}>
                <Text style={styles.leaderName}>{driver.name}</Text>
                <Text style={styles.leaderValue}>{driver.loads}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.tablesRow}>
          <View style={styles.tableCard}>
            <Text style={styles.tableTitle}>Top Lanes (with Avg Cost/Mi)</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Count</Text>
            </View>
            {analyticsData.topLanes.map((lane, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableLane}>{lane.lane}</Text>
                <Text style={styles.tableCount}>{lane.count}</Text>
              </View>
            ))}
          </View>

          <View style={styles.tableCard}>
            <Text style={styles.tableTitle}>Top Carriers / Drivers</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Loads</Text>
            </View>
            {analyticsData.topDrivers.map((driver, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableLane}>{driver.name}</Text>
                <Text style={styles.tableCount}>{driver.loads}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.aiInsightsSection}>
          <Text style={styles.aiInsightsTitle}>🧠 AI Insights & Recommendations</Text>
          <View style={styles.aiInsightsRow}>
            <View style={styles.aiInsightCard}>
              <View style={styles.aiInsightHeader}>
                <Lightbulb size={24} color="#2563EB" />
                <Text style={styles.aiInsightCardTitle}>Optimize Spend</Text>
              </View>
              <Text style={styles.aiInsightText}>
                You could save 7.2% by posting earlier on Dallas → Phoenix routes.
              </Text>
            </View>

            <View style={styles.aiInsightCard}>
              <View style={styles.aiInsightHeader}>
                <Truck size={24} color="#2563EB" />
                <Text style={styles.aiInsightCardTitle}>Carrier Reliability</Text>
              </View>
              <Text style={styles.aiInsightText}>
                Your highest on-time rate is with Reefer carriers this month.
              </Text>
            </View>

            <View style={styles.aiInsightCard}>
              <View style={styles.aiInsightHeader}>
                <TrendingUp size={24} color="#2563EB" />
                <Text style={styles.aiInsightCardTitle}>Forecast Spend</Text>
              </View>
              <Text style={styles.aiInsightText}>
                Predicted spend next week: $38,450 based on recent volume.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },

  filterBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 100,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 160,
  },
  dropdown: {
    position: 'absolute',
    top: 50,
    left: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 160,
    zIndex: 1001,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemActive: {
    backgroundColor: '#F0F7FF',
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#374151',
  },
  dropdownItemTextActive: {
    color: '#0066FF',
    fontWeight: '600' as const,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#0066FF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 32,
  },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  kpiCard: {
    flex: 1,
    minWidth: width > 768 ? 150 : '30%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  kpiValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#0066FF',
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#6B7280',
  },
  chartsRow: {
    flexDirection: width > 768 ? 'row' : 'column',
    gap: 16,
    marginBottom: 24,
  },
  chartCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0066FF',
    marginBottom: 16,
  },
  areaChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 200,
    paddingTop: 20,
  },
  areaChartColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  areaChartBar: {
    width: '80%',
    flex: 1,
    justifyContent: 'flex-end',
  },
  areaChartFill: {
    width: '100%',
    backgroundColor: '#B3D1FF',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  areaChartLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 8,
  },
  barChart: {
    flexDirection: 'row',
    height: 200,
  },
  barChartYAxis: {
    justifyContent: 'space-between',
    paddingRight: 8,
    paddingVertical: 10,
  },
  yAxisLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  barChartBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  barChartColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  barChartBar: {
    width: '70%',
    backgroundColor: '#0066FF',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barChartLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 8,
  },
  mixRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  mixCard: {
    flex: 1,
    minWidth: width > 768 ? 200 : '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  slouretCard: {
    flex: 1,
    minWidth: width > 768 ? 200 : '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  leadersCard: {
    flex: 1,
    minWidth: width > 768 ? 200 : '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  mixTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0066FF',
    marginBottom: 16,
  },
  donutChart: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    marginBottom: 16,
  },
  donutRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0066FF',
    position: 'relative',
  },
  donutSegment: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  legend: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 13,
    color: '#374151',
  },
  lineChart: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  lineChartPath: {
    width: '100%',
    height: 60,
    borderBottomWidth: 2,
    borderBottomColor: '#0066FF',
    borderRadius: 4,
  },
  lineChartXAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  lineChartLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  leadersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 12,
  },
  leadersHeaderText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  leaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  leaderName: {
    fontSize: 14,
    color: '#0066FF',
  },
  leaderValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
  },
  tablesRow: {
    flexDirection: width > 768 ? 'row' : 'column',
    gap: 16,
  },
  tableCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0066FF',
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 12,
  },
  tableHeaderText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableLane: {
    flex: 1,
    fontSize: 14,
    color: '#0066FF',
  },
  tableCount: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
  },
  aiInsightsSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  aiInsightsTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#0A0A0A',
    marginBottom: 16,
  },
  aiInsightsRow: {
    flexDirection: width > 768 ? 'row' : 'column',
    gap: 16,
  },
  aiInsightCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  aiInsightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  aiInsightCardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0A0A0A',
  },
  aiInsightText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
});
