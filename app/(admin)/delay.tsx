import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Users, AlertTriangle, ThumbsDown, ThumbsUp, ChevronLeft, ChevronRight, LayoutDashboard, TrendingUp, Menu, X } from 'lucide-react-native';

type RouteData = {
  route: string;
  delays: number;
  delayRate: number;
  avgETADays: number;
  avgNetTripDays: number;
  avgDistanceDays: number;
  avgPlanETADays: number;
};

type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

export default function DelayAnalytics() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [routeType, setRouteType] = useState<'city' | 'state'>('city');
  const [filterType, setFilterType] = useState<'customer' | 'supplier' | 'material'>('customer');

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  const navItems: NavItem[] = [
    { id: 'overall', label: 'Overall', icon: <LayoutDashboard size={20} color="#FFFFFF" /> },
    { id: 'route', label: 'Route', icon: <TrendingUp size={20} color="#FFFFFF" /> },
    { id: 'delay', label: 'Delay', icon: <AlertTriangle size={20} color="#FFFFFF" /> },
  ];

  const cityRoutes: RouteData[] = [
    { route: 'Hosur-To-Hosur', delays: 0, delayRate: 0.02, avgETADays: 0.03, avgNetTripDays: 126.25, avgDistanceDays: 4.17, avgPlanETADays: 0 },
    { route: 'Kanchipuram-To-Kanchipuram', delays: 6, delayRate: 1.8, avgETADays: 1.05, avgNetTripDays: 1.06, avgDistanceDays: 120.99, avgPlanETADays: 4.17 },
    { route: 'Gurgaon-To-Ahmedabad', delays: 18, delayRate: 23.7, avgETADays: 3.57, avgNetTripDays: 3.28, avgDistanceDays: 996.71, avgPlanETADays: 4.17 },
    { route: 'Kanchipuram-To-Pune', delays: 70, delayRate: 73.7, avgETADays: 6.57, avgNetTripDays: 6.02, avgDistanceDays: 1017.55, avgPlanETADays: 3.36 },
    { route: 'Pune-To-Kanchipuram', delays: 84, delayRate: 59.2, avgETADays: 7.03, avgNetTripDays: 6.75, avgDistanceDays: 1287.42, avgPlanETADays: 4.14 },
    { route: 'Gurgaon-To-Kanchipuram', delays: 117, delayRate: 73.1, avgETADays: 7.35, avgNetTripDays: 7.19, avgDistanceDays: 2419.53, avgPlanETADays: 4.17 },
    { route: 'Kanchipuram-To-Ahmedabad', delays: 79, delayRate: 86.8, avgETADays: 7.76, avgNetTripDays: 7.72, avgDistanceDays: 1669.64, avgPlanETADays: 3.41 },
  ];

  const stateRoutes: RouteData[] = [
    { route: 'TamilNadu-To-TamilNadu', delays: 43, delayRate: 12.0, avgETADays: 2.41, avgNetTripDays: 4.15, avgDistanceDays: 314.23, avgPlanETADays: 2.15 },
    { route: 'Gujarat-To-Gujarat', delays: 23, delayRate: 18.0, avgETADays: 4.51, avgNetTripDays: 7.01, avgDistanceDays: 419.13, avgPlanETADays: 3.82 },
    { route: 'Odisha-To-Odisha', delays: 58, delayRate: 27.0, avgETADays: 5.05, avgNetTripDays: 8.56, avgDistanceDays: 293.45, avgPlanETADays: 4.21 },
    { route: 'Maharashtra-To-TamilNadu', delays: 92, delayRate: 45.5, avgETADays: 6.12, avgNetTripDays: 9.34, avgDistanceDays: 1156.78, avgPlanETADays: 5.03 },
    { route: 'Haryana-To-Gujarat', delays: 67, delayRate: 38.2, avgETADays: 5.89, avgNetTripDays: 8.91, avgDistanceDays: 987.45, avgPlanETADays: 4.67 },
    { route: 'Karnataka-To-Maharashtra', delays: 105, delayRate: 52.8, avgETADays: 6.78, avgNetTripDays: 10.12, avgDistanceDays: 1345.89, avgPlanETADays: 5.45 },
  ];

  const delaysByMonth = [
    { month: 'Jan', value: 40 },
    { month: 'Feb', value: 20 },
    { month: 'Mar', value: 25 },
    { month: 'May', value: 80 },
    { month: 'Jun', value: 100 },
    { month: 'Jul', value: 15 },
    { month: 'Aug', value: 10 },
  ];

  const topDelayCustomers = [
    { name: 'Larsen & Toubro Limited', value: 92 },
    { name: 'Ford India Private Limited', value: 81 },
    { name: 'Ericsson India Private Limited', value: 67 },
    { name: 'Daimler India Commercial Vehi...', value: 52 },
    { name: 'Brakes India Private Ltd', value: 41 },
  ];

  const topDelaySuppliers = [
    { name: 'TransLog Supply Co.', value: 85 },
    { name: 'HaulPro Logistics', value: 70 },
    { name: 'NextHaul Freight', value: 55 },
    { name: 'RoadKing Supply', value: 44 },
    { name: 'Velocity Transport', value: 33 },
  ];

  const topDelayMaterials = [
    { name: 'Steel', value: 89 },
    { name: 'Electronics', value: 76 },
    { name: 'Automotive Parts', value: 63 },
    { name: 'Textiles', value: 45 },
    { name: 'Machinery', value: 31 },
  ];

  const topDelayData = 
    filterType === 'customer' 
      ? topDelayCustomers 
      : filterType === 'supplier' 
      ? topDelaySuppliers 
      : topDelayMaterials;

  const renderSidebar = () => {
    if (isMobile && !sidebarOpen) return null;

    return (
      <View style={[
        styles.sidebar,
        isMobile && styles.sidebarMobile,
        isTablet && styles.sidebarTablet,
      ]}>
        {isMobile && (
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setSidebarOpen(false)}
          >
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Navigate</Text>
        </View>

        <View style={styles.navList}>
          {navItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.navItem,
                item.id === 'delay' && styles.navItemActive,
              ]}
              onPress={() => {
                if (isMobile) setSidebarOpen(false);
                if (item.id === 'overall') {
                  router.push('/(admin)/dashboard');
                } else if (item.id === 'route') {
                  router.push('/(admin)/route');
                }
              }}
            >
              <View style={styles.navIcon}>{item.icon}</View>
              <Text style={styles.navLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.outerContainer}>
      {renderSidebar()}

      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          {isMobile && (
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => setSidebarOpen(true)}
            >
              <Menu size={24} color="#1E3A8A" />
            </TouchableOpacity>
          )}
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Transportation and Logistics Analysis</Text>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.userBadge}>
              <View style={styles.userIcon}>
                <Users size={20} color="#1E3A8A" />
              </View>
              <Text style={styles.userText}>Hello User, Welcome</Text>
            </View>
          </View>
        </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.metricsRow, isMobile && styles.metricsColumn]}>
          <View style={[styles.metricCard, isMobile && styles.metricCardMobile]}>
            <View style={styles.metricIconContainer}>
              <AlertTriangle size={32} color="#F97316" />
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricTitle}>Delays</Text>
              <Text style={styles.metricValue}>2,002</Text>
              <Text style={styles.metricSubtitle}>13.19%</Text>
            </View>
          </View>

          <View style={[styles.metricCard, isMobile && styles.metricCardMobile]}>
            <View style={styles.metricIconContainer}>
              <ThumbsDown size={32} color="#F97316" />
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricTitle}>Delay Rate</Text>
              <Text style={styles.metricValue}>59.5%</Text>
            </View>
          </View>

          <View style={[styles.metricCard, isMobile && styles.metricCardMobile]}>
            <View style={styles.metricIconContainer}>
              <ThumbsUp size={32} color="#22C55E" />
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricTitle}>Ontime</Text>
              <Text style={styles.metricValue}>1,364</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transportation and Logistics Analysis</Text>
            <View style={styles.toggleButtons}>
              <TouchableOpacity
                style={[styles.toggleButton, routeType === 'city' && styles.toggleButtonActive]}
                onPress={() => setRouteType('city')}
              >
                <Text style={[styles.toggleButtonText, routeType === 'city' && styles.toggleButtonTextActive]}>
                  City Route
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, routeType === 'state' && styles.toggleButtonActive]}
                onPress={() => setRouteType('state')}
              >
                <Text style={[styles.toggleButtonText, routeType === 'state' && styles.toggleButtonTextActive]}>
                  State Route
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.routeColumn]}>{routeType === 'city' ? 'City Route' : 'State Route'}</Text>
                <Text style={styles.tableHeaderCell}>Delays</Text>
                <Text style={styles.tableHeaderCell}>Delay Rate</Text>
                <Text style={styles.tableHeaderCell}>Avg ETA Days</Text>
                <Text style={styles.tableHeaderCell}>Avg Net Trip Days</Text>
                <Text style={styles.tableHeaderCell}>Avg Distance Days</Text>
                <Text style={styles.tableHeaderCell}>Avg Plan ETA Days</Text>
              </View>

              {(routeType === 'city' ? cityRoutes : stateRoutes).map((route, index) => (
                <View key={index} style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven]}>
                  <Text style={[styles.tableCell, styles.routeColumn]}>{route.route}</Text>
                  <Text style={styles.tableCell}>{route.delays}</Text>
                  <Text style={[styles.tableCell, styles.tableCellHighlight]}>{route.delayRate.toFixed(1)}%</Text>
                  <Text style={[styles.tableCell, styles.tableCellHighlight]}>{route.avgETADays.toFixed(2)}</Text>
                  <Text style={[styles.tableCell, styles.tableCellHighlight]}>{route.avgNetTripDays.toFixed(2)}</Text>
                  <Text style={[styles.tableCell, styles.tableCellHighlight]}>{route.avgDistanceDays.toFixed(2)}</Text>
                  <Text style={[styles.tableCell, styles.tableCellHighlight]}>{route.avgPlanETADays.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.pagination}>
            <TouchableOpacity style={styles.paginationButton}>
              <ChevronLeft size={20} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.paginationButton}>
              <Text style={styles.paginationText}>×</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.paginationButton}>
              <ChevronRight size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.chartsSection, isMobile && styles.chartsSectionMobile]}>
          <View style={[styles.chartCard, styles.chartCardSmall, isMobile && styles.chartCardMobile]}>
            <Text style={styles.chartTitle}>Delays by Day Type</Text>
            <View style={styles.donutContainer}>
              <View style={styles.donutChart}>
                <View style={[styles.donutSegment, { backgroundColor: '#F97316' }]} />
                <View style={styles.donutCenter}>
                  <Text style={styles.donutCenterText}>13.19%</Text>
                </View>
              </View>
              <View style={styles.donutLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#F97316' }]} />
                  <Text style={styles.legendText}>86.81%</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.chartCard, styles.chartCardLarge, isMobile && styles.chartCardMobile]}>
            <Text style={styles.chartTitle}>Delays by Month</Text>
            <View style={styles.barChart}>
              {delaysByMonth.map((item, index) => {
                const maxValue = 100;
                const barHeight = (item.value / maxValue) * 180;
                return (
                  <View key={index} style={styles.barContainer}>
                    <View style={styles.barWrapper}>
                      <View
                        style={[
                          styles.bar,
                          { height: barHeight, backgroundColor: '#F97316' }
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{item.month}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={[styles.chartCard, styles.chartCardSmall, isMobile && styles.chartCardMobile]}>
            <Text style={styles.chartTitle}>Delays by AM to PM</Text>
            <View style={styles.donutContainer}>
              <View style={styles.donutChart}>
                <View style={[styles.donutSegment, { backgroundColor: '#F97316' }]} />
                <View style={styles.donutCenter}>
                  <Text style={styles.donutCenterText}>23.78%</Text>
                </View>
              </View>
              <View style={styles.donutLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#F97316' }]} />
                  <Text style={styles.legendText}>76.22%</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Delay by Customer</Text>
            <View style={styles.filterButtons}>
              <TouchableOpacity
                style={[styles.filterButton, filterType === 'customer' && styles.filterButtonActive]}
                onPress={() => setFilterType('customer')}
              >
                <Text style={[styles.filterButtonText, filterType === 'customer' && styles.filterButtonTextActive]}>
                  Customer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, filterType === 'supplier' && styles.filterButtonActive]}
                onPress={() => setFilterType('supplier')}
              >
                <Text style={[styles.filterButtonText, filterType === 'supplier' && styles.filterButtonTextActive]}>
                  Supplier
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, filterType === 'material' && styles.filterButtonActive]}
                onPress={() => setFilterType('material')}
              >
                <Text style={[styles.filterButtonText, filterType === 'material' && styles.filterButtonTextActive]}>
                  Material
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.horizontalBarChart}>
            {topDelayData.map((item, index) => (
              <View key={index} style={styles.horizontalBarItem}>
                <View style={styles.horizontalBarLabelRow}>
                  <Text style={styles.horizontalBarLabel}>{item.name}</Text>
                  <Text style={styles.horizontalBarValue}>{item.value}</Text>
                </View>
                <View style={styles.horizontalBarWrapper}>
                  <View
                    style={[
                      styles.horizontalBar,
                      { width: `${item.value}%`, backgroundColor: '#F97316' }
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

        {isMobile && sidebarOpen && (
          <TouchableOpacity 
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setSidebarOpen(false)}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#111827',
  },
  sidebar: {
    width: 140,
    backgroundColor: '#111827',
    paddingTop: 40,
    paddingHorizontal: 16,
    ...Platform.select({
      web: {
        position: 'sticky' as any,
        top: 0,
        height: '100vh',
      },
    }),
  },
  sidebarMobile: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sidebarTablet: {
    width: 100,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  sidebarHeader: {
    paddingBottom: 32,
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  navList: {
    paddingTop: 16,
  },
  navItem: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 8,
    borderRadius: 12,
    marginBottom: 8,
  },
  navItemActive: {
    backgroundColor: '#1E3A8A',
  },
  navIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  menuButton: {
    padding: 8,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
    maxHeight: 130,
  },
  headerContent: {
    flex: 1,
    flexShrink: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600' as const,
    color: '#111827',
    whiteSpace: 'normal',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F9FAFB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  userIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    flexWrap: 'nowrap',
  },
  metricsColumn: {
    flexDirection: 'column',
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metricCardMobile: {
    minWidth: '100%',
  },
  metricIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricContent: {
    flex: 1,
  },
  metricTitle: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#6B7280',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#111827',
  },
  metricSubtitle: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#6B7280',
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
  },
  toggleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease-in-out',
      },
    }),
  },
  toggleButtonActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease-in-out',
      },
    }),
  },
  toggleButtonText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#6B7280',
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease-in-out',
      },
    }),
  },
  filterButtonActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease-in-out',
      },
    }),
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  table: {
    minWidth: 1000,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#DBEAFE',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#111827',
    textAlign: 'center',
    minWidth: 100,
  },
  routeColumn: {
    minWidth: 200,
    textAlign: 'left',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableRowEven: {
    backgroundColor: '#F9FAFB',
  },
  tableCell: {
    flex: 1,
    fontSize: 12,
    color: '#111827',
    textAlign: 'center',
    minWidth: 100,
  },
  tableCellHighlight: {
    backgroundColor: '#BFDBFE',
    paddingVertical: 4,
    borderRadius: 4,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
  },
  paginationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationText: {
    fontSize: 18,
    color: '#6B7280',
  },
  chartsSection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    flexWrap: 'nowrap',
    minHeight: 280,
  },
  chartsSectionMobile: {
    flexDirection: 'column',
  },
  chartCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 280,
  },
  chartCardMobile: {
    minWidth: '100%',
  },
  chartCardSmall: {
    flex: 1,
    minWidth: 250,
  },
  chartCardLarge: {
    flex: 2,
    minWidth: 400,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 16,
  },
  donutContainer: {
    alignItems: 'center',
    gap: 16,
  },
  donutChart: {
    width: 120,
    height: 120,
    borderRadius: 60,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutSegment: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  donutCenter: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
  },
  donutLegend: {
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
    color: '#6B7280',
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 220,
    paddingTop: 10,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    height: 200,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  bar: {
    width: 32,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  horizontalBarChart: {
    gap: 16,
  },
  horizontalBarItem: {
    gap: 8,
  },
  horizontalBarLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  horizontalBarLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#111827',
    flex: 1,
  },
  horizontalBarValue: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#111827',
    marginLeft: 8,
  },
  horizontalBarWrapper: {
    height: 32,
    backgroundColor: '#F9FAFB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  horizontalBar: {
    height: '100%',
    borderRadius: 4,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
});
