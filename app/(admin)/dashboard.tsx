import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Users, Package, CheckCircle, AlertTriangle, Truck, TrendingUp, LayoutDashboard, Menu, X } from 'lucide-react-native';
import { useAdminRealtime } from '@/contexts/AdminRealtimeContext';

type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

type HourlyDataPoint = {
  hour: string;
  value: number;
};

type MonthlyDataPoint = {
  month: string;
  value: number;
};

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timePeriod, setTimePeriod] = useState<'am' | 'pm'>('pm');
  const analytics = useAdminRealtime();

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  const navItems: NavItem[] = [
    { id: 'overall', label: 'Overall', icon: <LayoutDashboard size={20} color="#FFFFFF" /> },
    { id: 'route', label: 'Route', icon: <TrendingUp size={20} color="#FFFFFF" /> },
    { id: 'delay', label: 'Delay', icon: <AlertTriangle size={20} color="#FFFFFF" /> },
  ];

  const amHourlyData: HourlyDataPoint[] = [
    { hour: '12AM', value: 28 },
    { hour: '1AM', value: 22 },
    { hour: '2AM', value: 18 },
    { hour: '3AM', value: 15 },
    { hour: '4AM', value: 20 },
    { hour: '5AM', value: 32 },
    { hour: '6AM', value: 45 },
    { hour: '7AM', value: 58 },
    { hour: '8AM', value: 72 },
    { hour: '9AM', value: 85 },
    { hour: '10AM', value: 78 },
    { hour: '11AM', value: 68 },
  ];

  const pmHourlyData: HourlyDataPoint[] = [
    { hour: '12PM', value: 45 },
    { hour: '1PM', value: 52 },
    { hour: '2PM', value: 68 },
    { hour: '3PM', value: 78 },
    { hour: '4PM', value: 72 },
    { hour: '5PM', value: 85 },
    { hour: '6PM', value: 62 },
    { hour: '7PM', value: 58 },
    { hour: '8PM', value: 55 },
    { hour: '9PM', value: 48 },
    { hour: '10PM', value: 42 },
    { hour: '11PM', value: 38 },
  ];

  const monthlyData: MonthlyDataPoint[] = [
    { month: 'January', value: 45 },
    { month: 'February', value: 38 },
    { month: 'March', value: 52 },
    { month: 'April', value: 61 },
    { month: 'May', value: 58 },
    { month: 'June', value: 67 },
    { month: 'July', value: 73 },
    { month: 'August', value: 78 },
  ];

  const topDrivers = [
    'Jake Miller',
    'Sarah Lopez',
    'Tony Reed',
    'John Davis',
    'Rachel Carter',
  ];

  const topDestinations = [
    'Houston, TX',
    'Phoenix, AZ',
    'Atlanta, GA',
    'Miami, FL',
    'Denver, CO',
  ];

  const hourlyData = useMemo(() => {
    return timePeriod === 'am' ? amHourlyData : pmHourlyData;
  }, [timePeriod]);

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
                item.id === 'overall' && styles.navItemActive,
              ]}
              onPress={() => {
                if (isMobile) setSidebarOpen(false);
                if (item.id === 'route') {
                  router.push('/(admin)/route');
                } else if (item.id === 'delay') {
                  router.push('/(admin)/delay');
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

  const renderMetricCards = () => {
    if (analytics.isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      );
    }

    if (analytics.error) {
      return (
        <View style={styles.errorContainer}>
          <AlertTriangle size={48} color="#EF4444" />
          <Text style={styles.errorText}>Error loading analytics</Text>
          <Text style={styles.errorSubtext}>{analytics.error}</Text>
        </View>
      );
    }

    return (
      <>
        <View style={[styles.metricsRow, isMobile && styles.metricsColumn]}>
          <View style={[styles.metricCard, isMobile && styles.metricCardMobile]}>
            <View style={styles.metricContent}>
              <Text style={styles.metricTitle}>Total Active Loads</Text>
              <Text style={styles.metricValue}>{analytics.activeLoads.toLocaleString()}</Text>
            </View>
            <View style={[styles.metricIconContainer, { backgroundColor: '#DBEAFE' }]}>
              <Package size={40} color="#2563EB" />
            </View>
            <View style={[styles.progressBar, { backgroundColor: '#2563EB' }]} />
          </View>

          <View style={[styles.metricCard, isMobile && styles.metricCardMobile]}>
            <View style={styles.metricContent}>
              <Text style={styles.metricTitle}>Delivered Loads</Text>
              <Text style={styles.metricValue}>{analytics.deliveredLoads.toLocaleString()}</Text>
              <Text style={styles.metricSubtitle}>
                {analytics.loadCounts.total > 0
                  ? ((analytics.deliveredLoads / analytics.loadCounts.total) * 100).toFixed(2)
                  : '0.00'}%
              </Text>
            </View>
            <View style={[styles.metricIconContainer, { backgroundColor: '#D1FAE5' }]}>
              <CheckCircle size={40} color="#10B981" />
            </View>
            <View style={[styles.progressBar, { backgroundColor: '#10B981' }]} />
          </View>

          <View style={[styles.metricCard, isMobile && styles.metricCardMobile]}>
            <View style={styles.metricContent}>
              <Text style={styles.metricTitle}>Delayed or Pending</Text>
              <Text style={styles.metricValue}>{analytics.delayedLoads.toLocaleString()}</Text>
              <Text style={styles.metricSubtitle}>
                {analytics.loadCounts.total > 0
                  ? ((analytics.delayedLoads / analytics.loadCounts.total) * 100).toFixed(2)
                  : '0.00'}%
              </Text>
            </View>
            <View style={[styles.metricIconContainer, { backgroundColor: '#FEF3C7' }]}>
              <AlertTriangle size={40} color="#F59E0B" />
            </View>
            <View style={[styles.progressBar, { backgroundColor: '#F59E0B' }]} />
          </View>
        </View>

        <View style={[styles.metricCard, { marginBottom: 24 }]}>
          <View style={styles.metricContent}>
            <Text style={styles.metricTitle}>In-Transit Shipments</Text>
            <Text style={styles.metricValue}>{analytics.inTransitLoads.toLocaleString()}</Text>
          </View>
          <View style={[styles.metricIconContainer, { backgroundColor: '#EDE9FE' }]}>
            <Truck size={40} color="#8B5CF6" />
          </View>
          <View style={[styles.progressBar, { backgroundColor: '#8B5CF6' }]} />
        </View>

        <View style={[styles.metricsRow, isMobile && styles.metricsColumn]}>
          <View style={[styles.metricCard, isMobile && styles.metricCardMobile]}>
            <View style={styles.metricContent}>
              <Text style={styles.metricTitle}>Total Revenue</Text>
              <Text style={styles.metricValue}>${analytics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
            <View style={[styles.metricIconContainer, { backgroundColor: '#D1FAE5' }]}>
              <TrendingUp size={40} color="#10B981" />
            </View>
            <View style={[styles.progressBar, { backgroundColor: '#10B981' }]} />
          </View>

          <View style={[styles.metricCard, isMobile && styles.metricCardMobile]}>
            <View style={styles.metricContent}>
              <Text style={styles.metricTitle}>Avg Rate/Mile</Text>
              <Text style={styles.metricValue}>${analytics.avgRate.toFixed(2)}</Text>
            </View>
            <View style={[styles.metricIconContainer, { backgroundColor: '#DBEAFE' }]}>
              <Package size={40} color="#2563EB" />
            </View>
            <View style={[styles.progressBar, { backgroundColor: '#2563EB' }]} />
          </View>

          <View style={[styles.metricCard, isMobile && styles.metricCardMobile]}>
            <View style={styles.metricContent}>
              <Text style={styles.metricTitle}>Avg MPG</Text>
              <Text style={styles.metricValue}>{analytics.avgMPG.toFixed(1)}</Text>
            </View>
            <View style={[styles.metricIconContainer, { backgroundColor: '#FEF3C7' }]}>
              <Truck size={40} color="#F59E0B" />
            </View>
            <View style={[styles.progressBar, { backgroundColor: '#F59E0B' }]} />
          </View>
        </View>

        <View style={styles.aiInsightWidget}>
          <View style={styles.aiInsightHeader}>
            <View style={styles.aiInsightIconContainer}>
              <TrendingUp size={26} color="#2563EB" />
            </View>
            <Text style={styles.aiInsightTitle}>LoadRush AI Insight</Text>
          </View>
          <Text style={styles.aiInsightContent}>
            Live data connected. {analytics.loadCounts.total} total loads tracked. Average rate of ${analytics.avgRate.toFixed(2)}/mile with {analytics.avgMPG.toFixed(1)} MPG efficiency. {analytics.activeLoads} loads currently active.
          </Text>
        </View>
      </>
    );
  };

  const renderHourlyChart = () => {
    const maxValue = Math.max(...hourlyData.map(d => d.value));
    
    return (
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Load Distribution by Hour</Text>
          <View style={styles.toggleButtons}>
            <TouchableOpacity
              style={[styles.toggleButton, timePeriod === 'am' && styles.toggleButtonActive]}
              onPress={() => setTimePeriod('am')}
            >
              <Text style={[styles.toggleButtonText, timePeriod === 'am' && styles.toggleButtonTextActive]}>
                AM
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, timePeriod === 'pm' && styles.toggleButtonActive]}
              onPress={() => setTimePeriod('pm')}
            >
              <Text style={[styles.toggleButtonText, timePeriod === 'pm' && styles.toggleButtonTextActive]}>
                PM
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.barChart}>
          {hourlyData.map((item, index) => {
            const barHeight = (item.value / maxValue) * 180;
            return (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      { height: barHeight, backgroundColor: '#1E3A8A' }
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{item.hour}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderMonthlyChart = () => {
    const maxValue = Math.max(...monthlyData.map(d => d.value));
    
    return (
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Load Volume Trend (12-Month)</Text>
        <View style={styles.lineChart}>
          {monthlyData.map((item, index) => {
            const barHeight = (item.value / maxValue) * 120;
            return (
              <View key={index} style={styles.lineBarContainer}>
                <View style={styles.lineBarWrapper}>
                  <View
                    style={[
                      styles.lineBar,
                      { height: barHeight, backgroundColor: '#1E3A8A' }
                    ]}
                  />
                </View>
                <Text style={styles.lineBarLabel}>{item.month.substring(0, 3)}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderDonutCharts = () => {
    return (
      <View style={[styles.chartsSection, isMobile && styles.chartsSectionMobile]}>
        <View style={[styles.chartCard, isMobile && styles.chartCardMobile]}>
          <Text style={styles.chartTitle}>Total Booking by Day Type</Text>
          <View style={styles.donutContainer}>
            <View style={styles.donutChart}>
              <View style={[styles.donutSegment, { backgroundColor: '#1E3A8A' }]} />
              <View style={styles.donutCenter} />
            </View>
            <View style={styles.donutLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#1E3A8A' }]} />
                <Text style={styles.legendText}>Weekday 2,202</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#E5E7EB' }]} />
                <Text style={styles.legendText}>Weekend 277</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.chartCard, isMobile && styles.chartCardMobile]}>
          <Text style={styles.chartTitle}>Total Booking by Route Type</Text>
          <View style={styles.donutContainer}>
            <View style={styles.donutChart}>
              <View style={[styles.donutSegment, { backgroundColor: '#1E3A8A' }]} />
              <View style={styles.donutCenter} />
            </View>
            <View style={styles.donutLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#1E3A8A' }]} />
                <Text style={styles.legendText}>Inter City 76%</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#E5E7EB' }]} />
                <Text style={styles.legendText}>Intra City 24%</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderTopDriversAndDestinations = () => {
    const driverWidths = [100, 85, 78, 72, 65];
    const destinationWidths = [100, 88, 75, 68, 55];

    return (
      <View style={[styles.chartsSection, isMobile && styles.chartsSectionMobile]}>
        <View style={[styles.chartCard, isMobile && styles.chartCardMobile]}>
          <Text style={styles.chartTitle}>Top 5 Most Booked Drivers</Text>
          <View style={styles.horizontalBarChart}>
            {topDrivers.map((name, index) => (
              <View key={index} style={styles.horizontalBarItem}>
                <Text style={styles.horizontalBarLabel}>{name}</Text>
                <View style={styles.horizontalBarWrapper}>
                  <View 
                    style={[
                      styles.horizontalBar,
                      { width: `${driverWidths[index]}%`, backgroundColor: '#1E3A8A' }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.chartCard, isMobile && styles.chartCardMobile]}>
          <Text style={styles.chartTitle}>Top 5 Destinations</Text>
          <View style={styles.horizontalBarChart}>
            {topDestinations.map((name, index) => (
              <View key={index} style={styles.horizontalBarItem}>
                <Text style={styles.horizontalBarLabel}>{name}</Text>
                <View style={styles.horizontalBarWrapper}>
                  <View 
                    style={[
                      styles.horizontalBar,
                      { width: `${destinationWidths[index]}%`, backgroundColor: '#1E3A8A' }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>
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
              <Menu size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              LoadRush Admin Analytics Console
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              Live Overview • Drivers • Shippers • Loads • Performance
            </Text>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.systemStatusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.systemStatusText}>System Stable</Text>
            </View>
            <View style={styles.userBadge}>
              <View style={styles.userIcon}>
                <Users size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.userText} numberOfLines={1}>
                Welcome Admin — LoadRush Control Center
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {renderMetricCards()}
          {!analytics.isLoading && !analytics.error && (
            <>
              {renderHourlyChart()}
              {renderMonthlyChart()}
              {renderDonutCharts()}
              {renderTopDriversAndDestinations()}
            </>
          )}
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
    backgroundColor: '#0A1B2A',
  },
  sidebar: {
    width: 140,
    backgroundColor: '#0A1B2A',
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
    letterSpacing: 0.5,
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
    backgroundColor: '#0A1E57',
    paddingHorizontal: 24,
    paddingBottom: 20,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    maxHeight: 130,
  },
  headerContent: {
    flex: 1,
    minWidth: 200,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
    letterSpacing: -0.2,
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  userIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#FFFFFF',
  },
  systemStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E6F9E8',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  systemStatusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#16A34A',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    marginTop: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  metricsColumn: {
    flexDirection: 'column',
  },
  metricCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 15,
    borderWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  metricCardMobile: {
    minWidth: '100%',
  },
  metricIconContainer: {
    width: 78,
    height: 78,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricContent: {
    flex: 1,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#111827',
    letterSpacing: -0.5,
  },
  metricSubtitle: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#6B7280',
    marginTop: 4,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 24,
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
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#111827',
    letterSpacing: 0.2,
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
  },
  toggleButtonActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  toggleButtonText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#6B7280',
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
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
  lineChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    paddingTop: 10,
  },
  lineBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  lineBarWrapper: {
    height: 150,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  lineBar: {
    width: 28,
    borderRadius: 4,
  },
  lineBarLabel: {
    fontSize: 9,
    color: '#6B7280',
    textAlign: 'center',
  },
  chartsSection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  chartsSectionMobile: {
    flexDirection: 'column',
  },
  chartCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    minHeight: 280,
  },
  chartCardMobile: {
    flex: 1,
  },
  chartTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 20,
    letterSpacing: 0.2,
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
  horizontalBarChart: {
    gap: 16,
  },
  horizontalBarItem: {
    gap: 8,
  },
  horizontalBarLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#111827',
  },
  horizontalBarWrapper: {
    height: 24,
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
  aiInsightWidget: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  aiInsightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  aiInsightIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E0EDFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiInsightTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
    letterSpacing: 0.2,
  },
  aiInsightContent: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: '#475569',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#6B7280',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#EF4444',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
});
