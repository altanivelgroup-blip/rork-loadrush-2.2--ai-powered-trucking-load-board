import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Users, Truck, Clock, ChevronLeft, ChevronRight, LayoutDashboard, TrendingUp, AlertTriangle, Menu, X } from 'lucide-react-native';

type RouteData = {
  route: string;
  totalBooking: number;
  avgDisPerTrip: number;
  avgTripLeadHrs: number;
  avgETADays: number;
  avgNetTripDays: number;
};

type DriverData = {
  name: string;
  booking: number;
  avgOrderCycle: number;
  avgDistance: number;
  ontime: number;
  late: number;
  ontimePercent: number;
  latePercent: number;
};

type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

export default function RouteAnalytics() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [routeType, setRouteType] = useState<'city' | 'state'>('state');
  const [filterType, setFilterType] = useState<'all' | 'customer' | 'driver' | 'ops' | 'material' | 'shipment' | 'supplier'>('driver');
  const [stateType, setStateType] = useState<'inter' | 'intra'>('intra');
  const [chartMetric, setChartMetric] = useState<'booking' | 'eta'>('eta');

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  const navItems: NavItem[] = [
    { id: 'overall', label: 'Overall', icon: <LayoutDashboard size={20} color="#FFFFFF" /> },
    { id: 'route', label: 'Route', icon: <TrendingUp size={20} color="#FFFFFF" /> },
    { id: 'delay', label: 'Delay', icon: <AlertTriangle size={20} color="#FFFFFF" /> },
  ];

  const stateRoutes: RouteData[] = [
    { route: 'Texas-To-Texas', totalBooking: 487, avgDisPerTrip: 285.50, avgTripLeadHrs: 2.15, avgETADays: 1.85, avgNetTripDays: 1.82 },
    { route: 'California-To-California', totalBooking: 354, avgDisPerTrip: 420.75, avgTripLeadHrs: 3.20, avgETADays: 2.45, avgNetTripDays: 2.40 },
    { route: 'Florida-To-Florida', totalBooking: 298, avgDisPerTrip: 195.30, avgTripLeadHrs: 1.85, avgETADays: 1.50, avgNetTripDays: 1.48 },
    { route: 'Illinois-To-Illinois', totalBooking: 187, avgDisPerTrip: 165.80, avgTripLeadHrs: 1.60, avgETADays: 1.25, avgNetTripDays: 1.23 },
    { route: 'Georgia-To-Georgia', totalBooking: 156, avgDisPerTrip: 145.25, avgTripLeadHrs: 1.40, avgETADays: 1.10, avgNetTripDays: 1.08 },
  ];

  const cityRoutes: RouteData[] = [
    { route: 'Dallas-To-Houston', totalBooking: 245, avgDisPerTrip: 240.50, avgTripLeadHrs: 2.10, avgETADays: 0.85, avgNetTripDays: 0.83 },
    { route: 'Los Angeles-To-Phoenix', totalBooking: 198, avgDisPerTrip: 372.80, avgTripLeadHrs: 2.85, avgETADays: 1.45, avgNetTripDays: 1.42 },
    { route: 'Chicago-To-Atlanta', totalBooking: 176, avgDisPerTrip: 715.20, avgTripLeadHrs: 4.50, avgETADays: 2.20, avgNetTripDays: 2.18 },
    { route: 'Miami-To-Orlando', totalBooking: 154, avgDisPerTrip: 235.60, avgTripLeadHrs: 2.05, avgETADays: 0.90, avgNetTripDays: 0.88 },
    { route: 'Seattle-To-Portland', totalBooking: 132, avgDisPerTrip: 173.40, avgTripLeadHrs: 1.75, avgETADays: 0.70, avgNetTripDays: 0.68 },
  ];

  const allDriverData: DriverData[] = [
    { name: 'Jake Miller', booking: 145, avgOrderCycle: 2.8, avgDistance: 1250, ontime: 132, late: 13, ontimePercent: 91.03, latePercent: 8.97 },
    { name: 'Sarah Lopez', booking: 128, avgOrderCycle: 2.5, avgDistance: 1180, ontime: 118, late: 10, ontimePercent: 92.19, latePercent: 7.81 },
    { name: 'Tony Reed', booking: 112, avgOrderCycle: 3.1, avgDistance: 1320, ontime: 98, late: 14, ontimePercent: 87.50, latePercent: 12.50 },
    { name: 'John Davis', booking: 98, avgOrderCycle: 2.7, avgDistance: 1095, ontime: 89, late: 9, ontimePercent: 90.82, latePercent: 9.18 },
    { name: 'Rachel Carter', booking: 87, avgOrderCycle: 2.9, avgDistance: 1240, ontime: 78, late: 9, ontimePercent: 89.66, latePercent: 10.34 },
    { name: 'Mike Johnson', booking: 76, avgOrderCycle: 3.2, avgDistance: 1380, ontime: 65, late: 11, ontimePercent: 85.53, latePercent: 14.47 },
  ];

  const customerData: DriverData[] = [
    { name: 'FedEx Logistics', booking: 156, avgOrderCycle: 2.4, avgDistance: 1180, ontime: 142, late: 14, ontimePercent: 91.03, latePercent: 8.97 },
    { name: 'Tesla Parts Supply', booking: 132, avgOrderCycle: 2.8, avgDistance: 1320, ontime: 118, late: 14, ontimePercent: 89.39, latePercent: 10.61 },
    { name: 'Kroger Distribution', booking: 98, avgOrderCycle: 2.6, avgDistance: 1095, ontime: 87, late: 11, ontimePercent: 88.78, latePercent: 11.22 },
  ];

  const opsData: DriverData[] = [
    { name: 'North Zone', booking: 156, avgOrderCycle: 2.5, avgDistance: 875, ontime: 132, late: 24, ontimePercent: 84.62, latePercent: 15.38 },
    { name: 'South Zone', booking: 203, avgOrderCycle: 3.1, avgDistance: 1120, ontime: 178, late: 25, ontimePercent: 87.68, latePercent: 12.32 },
    { name: 'East Zone', booking: 98, avgOrderCycle: 2.9, avgDistance: 950, ontime: 81, late: 17, ontimePercent: 82.65, latePercent: 17.35 },
  ];

  const materialData: DriverData[] = [
    { name: 'Electronics', booking: 89, avgOrderCycle: 1.8, avgDistance: 650, ontime: 78, late: 11, ontimePercent: 87.64, latePercent: 12.36 },
    { name: 'Textiles', booking: 124, avgOrderCycle: 2.4, avgDistance: 890, ontime: 105, late: 19, ontimePercent: 84.68, latePercent: 15.32 },
    { name: 'Food & Beverage', booking: 67, avgOrderCycle: 1.2, avgDistance: 420, ontime: 62, late: 5, ontimePercent: 92.54, latePercent: 7.46 },
  ];

  const shipmentData: DriverData[] = [
    { name: 'Express', booking: 178, avgOrderCycle: 1.5, avgDistance: 580, ontime: 165, late: 13, ontimePercent: 92.70, latePercent: 7.30 },
    { name: 'Standard', booking: 245, avgOrderCycle: 3.2, avgDistance: 1050, ontime: 198, late: 47, ontimePercent: 80.82, latePercent: 19.18 },
    { name: 'Economy', booking: 134, avgOrderCycle: 4.8, avgDistance: 1380, ontime: 102, late: 32, ontimePercent: 76.12, latePercent: 23.88 },
  ];

  const supplierData: DriverData[] = [
    { name: 'Supplier A', booking: 92, avgOrderCycle: 2.7, avgDistance: 920, ontime: 79, late: 13, ontimePercent: 85.87, latePercent: 14.13 },
    { name: 'Supplier B', booking: 156, avgOrderCycle: 3.4, avgDistance: 1180, ontime: 128, late: 28, ontimePercent: 82.05, latePercent: 17.95 },
    { name: 'Supplier C', booking: 73, avgOrderCycle: 2.1, avgDistance: 780, ontime: 65, late: 8, ontimePercent: 89.04, latePercent: 10.96 },
  ];

  const interStateDriversBooking = [
    { name: 'Jake Miller', value: 145 },
    { name: 'Sarah Lopez', value: 128 },
    { name: 'Tony Reed', value: 112 },
    { name: 'John Davis', value: 98 },
    { name: 'Rachel Carter', value: 87 },
  ];

  const interStateDriversETA = [
    { name: 'Jake Miller', value: 2.8 },
    { name: 'Sarah Lopez', value: 2.5 },
    { name: 'Tony Reed', value: 3.1 },
    { name: 'John Davis', value: 2.7 },
    { name: 'Rachel Carter', value: 2.9 },
  ];

  const intraStateDriversBooking = [
    { name: 'Jake Miller', value: 245 },
    { name: 'Sarah Lopez', value: 198 },
    { name: 'Tony Reed', value: 176 },
    { name: 'John Davis', value: 154 },
    { name: 'Rachel Carter', value: 132 },
  ];

  const intraStateDriversETA = [
    { name: 'Jake Miller', value: 2.1 },
    { name: 'Sarah Lopez', value: 2.8 },
    { name: 'Tony Reed', value: 4.5 },
    { name: 'John Davis', value: 2.0 },
    { name: 'Rachel Carter', value: 1.7 },
  ];

  const filteredRoutes = useMemo(() => {
    return routeType === 'state' ? stateRoutes : cityRoutes;
  }, [routeType]);

  const filteredAnalysisData = useMemo(() => {
    switch (filterType) {
      case 'all':
        return [...allDriverData, ...customerData, ...opsData].slice(0, 6);
      case 'customer':
        return customerData;
      case 'driver':
        return allDriverData;
      case 'ops':
        return opsData;
      case 'material':
        return materialData;
      case 'shipment':
        return shipmentData;
      case 'supplier':
        return supplierData;
      default:
        return allDriverData;
    }
  }, [filterType]);

  const totalStats = useMemo(() => {
    const data = filteredAnalysisData;
    const totalBooking = data.reduce((sum, item) => sum + item.booking, 0);
    const totalOntime = data.reduce((sum, item) => sum + item.ontime, 0);
    const totalLate = data.reduce((sum, item) => sum + item.late, 0);
    const ontimePercent = totalBooking > 0 ? (totalOntime / totalBooking) * 100 : 0;
    const latePercent = totalBooking > 0 ? (totalLate / totalBooking) * 100 : 0;
    const avgOrderCycle = data.length > 0 ? data.reduce((sum, item) => sum + item.avgOrderCycle, 0) / data.length : 0;
    const avgDistance = data.length > 0 ? data.reduce((sum, item) => sum + item.avgDistance, 0) / data.length : 0;

    return {
      totalBooking,
      totalOntime,
      totalLate,
      ontimePercent,
      latePercent,
      avgOrderCycle,
      avgDistance,
    };
  }, [filteredAnalysisData]);

  const chartDrivers = useMemo(() => {
    if (stateType === 'inter') {
      return chartMetric === 'booking' ? interStateDriversBooking : interStateDriversETA;
    } else {
      return chartMetric === 'booking' ? intraStateDriversBooking : intraStateDriversETA;
    }
  }, [stateType, chartMetric]);

  const chartData = useMemo(() => {
    const maxValue = Math.max(...chartDrivers.map(d => d.value));
    return chartDrivers.map(driver => ({
      ...driver,
      percentage: (driver.value / maxValue) * 100,
    }));
  }, [chartDrivers]);

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
                item.id === 'route' && styles.navItemActive,
              ]}
              onPress={() => {
                if (isMobile) setSidebarOpen(false);
                if (item.id === 'overall') {
                  router.push('/(admin)/dashboard');
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
        <View style={[styles.metricsRow, isMobile && styles.metricsColumn]}>
          <View style={[styles.metricCard, isMobile && styles.metricCardMobile]}>
            <View style={styles.metricContent}>
              <Text style={styles.metricTitle}>Booking Count</Text>
              <Text style={styles.metricValue}>3,366</Text>
            </View>
            <View style={[styles.metricIconContainer, { backgroundColor: '#E0EDFF' }]}>
              <Truck size={37} color="#2F66F5" />
            </View>
            <View style={[styles.progressBar, { backgroundColor: '#1E3A8A' }]} />
          </View>

          <View style={[styles.metricCard, isMobile && styles.metricCardMobile]}>
            <View style={styles.metricContent}>
              <Text style={styles.metricTitle}>Avg Trip Lead Hours</Text>
              <Text style={styles.metricValue}>3.24</Text>
            </View>
            <View style={[styles.metricIconContainer, { backgroundColor: '#EDE7FE' }]}>
              <Clock size={37} color="#7066F0" />
            </View>
            <View style={[styles.progressBar, { backgroundColor: '#7066F0' }]} />
          </View>
        </View>

        <View style={styles.aiInsightWidget}>
          <View style={styles.aiInsightHeader}>
            <View style={styles.aiInsightIconContainer}>
              <TrendingUp size={26} color="#2F66F5" />
            </View>
            <Text style={styles.aiInsightTitle}>LoadRush Route Insight</Text>
          </View>
          <Text style={styles.aiInsightContent}>
            Auto-analyzing live driver routes, delays, and optimization patterns…
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top State/City Routes Across Several KPI&apos;s</Text>
            <View style={styles.toggleButtons}>
              <TouchableOpacity
                style={[styles.toggleButton, routeType === 'city' && styles.toggleButtonActive]}
                onPress={() => setRouteType('city')}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleButtonText, routeType === 'city' && styles.toggleButtonTextActive]}>
                  City Route
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, routeType === 'state' && styles.toggleButtonActive]}
                onPress={() => setRouteType('state')}
                activeOpacity={0.7}
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
                <Text style={[styles.tableHeaderCell, styles.routeColumn]}>{routeType === 'state' ? 'State Route' : 'City Route'}</Text>
                <Text style={styles.tableHeaderCell}>Total Booking</Text>
                <Text style={styles.tableHeaderCell}>Avg Dis P/Trip</Text>
                <Text style={styles.tableHeaderCell}>Avg Trip Lead Hrs</Text>
                <Text style={styles.tableHeaderCell}>Avg ETA Days</Text>
                <Text style={styles.tableHeaderCell}>Avg Net Trip Days</Text>
              </View>

              {filteredRoutes.map((route, index) => (
                <View key={index} style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven]}>
                  <Text style={[styles.tableCell, styles.routeColumn]}>{route.route}</Text>
                  <Text style={[styles.tableCell, styles.tableCellHighlight]}>{route.totalBooking}</Text>
                  <Text style={[styles.tableCell, styles.tableCellHighlight]}>{route.avgDisPerTrip.toFixed(2)}</Text>
                  <Text style={[styles.tableCell, styles.tableCellHighlight]}>{route.avgTripLeadHrs.toFixed(2)}</Text>
                  <Text style={[styles.tableCell, styles.tableCellHighlight]}>{route.avgETADays.toFixed(2)}</Text>
                  <Text style={[styles.tableCell, styles.tableCellHighlight]}>{route.avgNetTripDays.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transportation and Logistics Analysis</Text>
            <View style={styles.filterButtons}>
              <TouchableOpacity
                style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
                onPress={() => setFilterType('all')}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterButtonText, filterType === 'all' && styles.filterButtonTextActive]}>
                  Select all
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, filterType === 'customer' && styles.filterButtonActive]}
                onPress={() => setFilterType('customer')}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterButtonText, filterType === 'customer' && styles.filterButtonTextActive]}>
                  Customer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, filterType === 'driver' && styles.filterButtonActive]}
                onPress={() => setFilterType('driver')}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterButtonText, filterType === 'driver' && styles.filterButtonTextActive]}>
                  Driver
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, filterType === 'ops' && styles.filterButtonActive]}
                onPress={() => setFilterType('ops')}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterButtonText, filterType === 'ops' && styles.filterButtonTextActive]}>
                  Ops
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, filterType === 'material' && styles.filterButtonActive]}
                onPress={() => setFilterType('material')}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterButtonText, filterType === 'material' && styles.filterButtonTextActive]}>
                  Material
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, filterType === 'shipment' && styles.filterButtonActive]}
                onPress={() => setFilterType('shipment')}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterButtonText, filterType === 'shipment' && styles.filterButtonTextActive]}>
                  Shipment
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, filterType === 'supplier' && styles.filterButtonActive]}
                onPress={() => setFilterType('supplier')}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterButtonText, filterType === 'supplier' && styles.filterButtonTextActive]}>
                  Supplier
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.driverColumn]}>Driver Name</Text>
                <Text style={styles.tableHeaderCell}>Booking</Text>
                <Text style={styles.tableHeaderCell}>Avg Order Cycle</Text>
                <Text style={styles.tableHeaderCell}>Avg Distance</Text>
                <Text style={styles.tableHeaderCell}>Ontime</Text>
                <Text style={styles.tableHeaderCell}>Late Delivery</Text>
                <Text style={styles.tableHeaderCell}>% Ontime delivery</Text>
                <Text style={styles.tableHeaderCell}>% Late Delivery</Text>
              </View>

              {filteredAnalysisData.map((driver, index) => (
                <View key={index} style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven]}>
                  <Text style={[styles.tableCell, styles.driverColumn]}>{driver.name}</Text>
                  <Text style={styles.tableCell}>{driver.booking}</Text>
                  <Text style={styles.tableCell}>{driver.avgOrderCycle.toFixed(1)}</Text>
                  <Text style={styles.tableCell}>{driver.avgDistance}</Text>
                  <Text style={styles.tableCell}>{driver.ontime}</Text>
                  <Text style={styles.tableCell}>{driver.late}</Text>
                  <Text style={styles.tableCell}>{driver.ontimePercent.toFixed(2)}%</Text>
                  <Text style={styles.tableCell}>{driver.latePercent.toFixed(2)}</Text>
                </View>
              ))}

              <View style={[styles.tableRow, styles.tableRowTotal]}>
                <Text style={[styles.tableCell, styles.driverColumn, styles.tableCellBold]}>Total</Text>
                <Text style={[styles.tableCell, styles.tableCellBold]}>{totalStats.totalBooking}</Text>
                <Text style={[styles.tableCell, styles.tableCellBold]}>{totalStats.avgOrderCycle.toFixed(1)}</Text>
                <Text style={[styles.tableCell, styles.tableCellBold]}>{Math.round(totalStats.avgDistance)}</Text>
                <Text style={[styles.tableCell, styles.tableCellBold]}>{totalStats.totalOntime}</Text>
                <Text style={[styles.tableCell, styles.tableCellBold]}>{totalStats.totalLate}</Text>
                <Text style={[styles.tableCell, styles.tableCellBold]}>{totalStats.ontimePercent.toFixed(2)}%</Text>
                <Text style={[styles.tableCell, styles.tableCellBold]}>{totalStats.latePercent.toFixed(2)}%</Text>
              </View>
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
          <View style={[styles.chartCard, isMobile && styles.chartCardMobile]}>
            <Text style={styles.chartTitle}>Top 5 Most Booked Drivers</Text>
            <View style={styles.statusToggle}>
              <TouchableOpacity
                style={[styles.statusButton, stateType === 'inter' && styles.statusButtonActive]}
                onPress={() => setStateType('inter')}
                activeOpacity={0.7}
              >
                <Text style={[styles.statusButtonText, stateType === 'inter' && styles.statusButtonTextActive]}>Inter State</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusButton, stateType === 'intra' && styles.statusButtonActive]}
                onPress={() => setStateType('intra')}
                activeOpacity={0.7}
              >
                <Text style={[styles.statusButtonText, stateType === 'intra' && styles.statusButtonTextActive]}>Intra State</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.horizontalBarChart}>
              {chartData.map((driver, index) => {
                return (
                  <View key={index} style={styles.horizontalBarItem}>
                    <View style={styles.horizontalBarLabelContainer}>
                      <Text style={styles.horizontalBarLabel}>{driver.name}</Text>
                      <Text style={styles.horizontalBarValue}>{driver.value}</Text>
                    </View>
                    <View style={styles.horizontalBarWrapper}>
                      <Animated.View 
                        style={[
                          styles.horizontalBar,
                          { width: `${driver.percentage}%`, backgroundColor: '#1E3A8A' }
                        ]} 
                      />
                    </View>
                  </View>
                );
              })}
            </View>
            <View style={styles.chartLegend}>
              <TouchableOpacity
                style={[styles.legendButton, chartMetric === 'booking' && styles.legendButtonActive]}
                onPress={() => setChartMetric('booking')}
                activeOpacity={0.7}
              >
                <Text style={[styles.legendButtonText, chartMetric === 'booking' && styles.legendButtonTextActive]}>Total Booking</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.legendButton, chartMetric === 'eta' && styles.legendButtonActive]}
                onPress={() => setChartMetric('eta')}
                activeOpacity={0.7}
              >
                <Text style={[styles.legendButtonText, chartMetric === 'eta' && styles.legendButtonTextActive]}>Avg ETA Days</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.chartCard, isMobile && styles.chartCardMobile]}>
            <Text style={styles.chartTitle}>Top 5 Destinations</Text>
            <View style={styles.horizontalBarChart}>
              {['Houston, TX', 'Phoenix, AZ', 'Atlanta, GA', 'Miami, FL', 'Denver, CO'].map((name, index) => {
                const widths = [100, 88, 75, 68, 55];
                return (
                  <View key={index} style={styles.horizontalBarItem}>
                    <Text style={styles.horizontalBarLabel}>{name}</Text>
                    <View style={styles.horizontalBarWrapper}>
                      <View 
                        style={[
                          styles.horizontalBar,
                          { width: `${widths[index]}%`, backgroundColor: '#1E3A8A' }
                        ]} 
                      />
                    </View>
                  </View>
                );
              })}
            </View>
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
  },
  filterButtonActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
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
  driverColumn: {
    minWidth: 150,
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
  tableRowTotal: {
    backgroundColor: '#DBEAFE',
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
  tableCellBold: {
    fontWeight: '600' as const,
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
  statusToggle: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statusButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  statusButtonActive: {
    backgroundColor: '#1E3A8A',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#6B7280',
  },
  statusButtonTextActive: {
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
  chartLegend: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  legendButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  legendButtonActive: {
    backgroundColor: '#1E3A8A',
  },
  legendButtonText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#6B7280',
  },
  legendButtonTextActive: {
    color: '#FFFFFF',
  },
  lineChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 200,
    paddingTop: 10,
  },
  lineBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  lineBarWrapper: {
    height: 180,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  lineBar: {
    width: 28,
    borderRadius: 4,
  },
  lineBarLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
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
  horizontalBarChart: {
    gap: 16,
  },
  horizontalBarItem: {
    gap: 8,
  },
  horizontalBarLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  horizontalBarLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#111827',
  },
  horizontalBarValue: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#6B7280',
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
});
