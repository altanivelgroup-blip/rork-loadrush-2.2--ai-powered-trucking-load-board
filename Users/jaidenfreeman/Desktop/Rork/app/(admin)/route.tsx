import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAdminRoutes, RouteData, DriverPerformance } from '@/hooks/useAdminRoutes';
import {
  MapPin,
  TrendingUp,
  Clock,
  Navigation,
  ChevronLeft,
  Activity,
} from 'lucide-react-native';

export default function AdminRoutePage() {
  const router = useRouter();
  const routesData = useAdminRoutes();
  const [selectedView, setSelectedView] = useState<'routes' | 'drivers'>('routes');

  if (routesData.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Route Analytics', headerShown: false }} />
        <ActivityIndicator size="large" color="#1E40AF" />
        <Text style={styles.loadingText}>Loading Route Analytics...</Text>
      </View>
    );
  }

  if (routesData.error) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ title: 'Route Analytics', headerShown: false }} />
        <Activity size={48} color="#EF4444" />
        <Text style={styles.errorText}>Error loading route data</Text>
        <Text style={styles.errorSubtext}>{routesData.error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Route Analytics', headerShown: false }} />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            testID="back-button"
          >
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>LoadRush Admin Analytics Console</Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>System Stable</Text>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>Route Analysis — Transportation & Logistics</Text>
      </View>

      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/(admin)/dashboard')}
        >
          <TrendingUp size={20} color="#9CA3AF" />
          <Text style={styles.navText}>Overall</Text>
        </TouchableOpacity>
        <View style={[styles.navItem, styles.navItemActive]}>
          <MapPin size={20} color="#1E40AF" />
          <Text style={[styles.navText, styles.navTextActive]}>Route</Text>
        </View>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/(admin)/delay')}
        >
          <Clock size={20} color="#9CA3AF" />
          <Text style={styles.navText}>Delay</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, selectedView === 'routes' && styles.toggleButtonActive]}
            onPress={() => setSelectedView('routes')}
          >
            <Text
              style={[
                styles.toggleButtonText,
                selectedView === 'routes' && styles.toggleButtonTextActive,
              ]}
            >
              Top Routes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              selectedView === 'drivers' && styles.toggleButtonActive,
            ]}
            onPress={() => setSelectedView('drivers')}
          >
            <Text
              style={[
                styles.toggleButtonText,
                selectedView === 'drivers' && styles.toggleButtonTextActive,
              ]}
            >
              Driver Performance
            </Text>
          </TouchableOpacity>
        </View>

        {selectedView === 'routes' ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Navigation size={24} color="#1E40AF" />
              <Text style={styles.sectionTitle}>Top State & City Routes</Text>
            </View>

            {routesData.routes.length > 0 ? (
              <View style={styles.tableCard}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, styles.colRoute]}>Route</Text>
                  <Text style={[styles.tableHeaderText, styles.colLoads]}>Loads</Text>
                  <Text style={[styles.tableHeaderText, styles.colRate]}>Avg Rate</Text>
                  <Text style={[styles.tableHeaderText, styles.colETA]}>Avg ETA</Text>
                  <Text style={[styles.tableHeaderText, styles.colDistance]}>Avg Miles</Text>
                </View>

                {routesData.routes.map((route: RouteData, index: number) => (
                  <View
                    key={route.route}
                    style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}
                  >
                    <View style={styles.colRoute}>
                      <Text style={styles.routeText} numberOfLines={2}>
                        {route.originCity}, {route.originState}
                      </Text>
                      <Text style={styles.routeArrow}>→</Text>
                      <Text style={styles.routeText} numberOfLines={2}>
                        {route.destinationCity}, {route.destinationState}
                      </Text>
                    </View>
                    <Text style={[styles.tableCell, styles.colLoads]}>{route.totalLoads}</Text>
                    <Text style={[styles.tableCell, styles.colRate]}>
                      ${route.avgRate.toFixed(2)}
                    </Text>
                    <Text style={[styles.tableCell, styles.colETA]}>
                      {route.avgETA.toFixed(1)} days
                    </Text>
                    <Text style={[styles.tableCell, styles.colDistance]}>
                      {route.avgDistance.toFixed(0)} mi
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <MapPin size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>No route data available</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Activity size={24} color="#1E40AF" />
              <Text style={styles.sectionTitle}>Driver Performance by Route</Text>
            </View>

            {routesData.driverPerformance.length > 0 ? (
              <View style={styles.tableCard}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, styles.colDriverName]}>Driver</Text>
                  <Text style={[styles.tableHeaderText, styles.colLoads]}>Loads</Text>
                  <Text style={[styles.tableHeaderText, styles.colOnTime]}>On-Time %</Text>
                  <Text style={[styles.tableHeaderText, styles.colDistance]}>Avg Miles</Text>
                  <Text style={[styles.tableHeaderText, styles.colRate]}>Avg Rate</Text>
                </View>

                {routesData.driverPerformance.map((driver: DriverPerformance, index: number) => (
                  <View
                    key={driver.driverId}
                    style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}
                  >
                    <Text style={[styles.tableCell, styles.colDriverName]} numberOfLines={1}>
                      {driver.driverName}
                    </Text>
                    <Text style={[styles.tableCell, styles.colLoads]}>{driver.totalLoads}</Text>
                    <View style={styles.colOnTime}>
                      <View style={styles.progressBarContainer}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${Math.min(driver.onTimePercent, 100)}%`,
                              backgroundColor:
                                driver.onTimePercent >= 80
                                  ? '#10B981'
                                  : driver.onTimePercent >= 60
                                    ? '#F59E0B'
                                    : '#EF4444',
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.percentText}>{driver.onTimePercent.toFixed(0)}%</Text>
                    </View>
                    <Text style={[styles.tableCell, styles.colDistance]}>
                      {driver.avgDistance.toFixed(0)} mi
                    </Text>
                    <Text style={[styles.tableCell, styles.colRate]}>
                      ${driver.avgRate.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Activity size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>No driver performance data available</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={24} color="#1E40AF" />
            <Text style={styles.sectionTitle}>Delay Breakdown by Route</Text>
          </View>

          {routesData.routes.length > 0 ? (
            <View style={styles.chartCard}>
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.legendText}>On-Time</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.legendText}>Delayed</Text>
                </View>
              </View>

              <View style={styles.barChart}>
                {routesData.routes.slice(0, 5).map((route: RouteData) => {
                  const totalDeliveries = route.onTimeDeliveries + route.delayedDeliveries;
                  const onTimePercent =
                    totalDeliveries > 0 ? (route.onTimeDeliveries / totalDeliveries) * 100 : 0;
                  const delayPercent =
                    totalDeliveries > 0 ? (route.delayedDeliveries / totalDeliveries) * 100 : 0;

                  return (
                    <View key={route.route} style={styles.barChartItem}>
                      <Text style={styles.barChartLabel} numberOfLines={1}>
                        {route.originCity.substring(0, 3).toUpperCase()}-
                        {route.destinationCity.substring(0, 3).toUpperCase()}
                      </Text>
                      <View style={styles.barChartBars}>
                        <View style={styles.barContainer}>
                          <View
                            style={[
                              styles.bar,
                              { height: `${onTimePercent}%`, backgroundColor: '#10B981' },
                            ]}
                          />
                          <Text style={styles.barLabel}>{onTimePercent.toFixed(0)}%</Text>
                        </View>
                        <View style={styles.barContainer}>
                          <View
                            style={[
                              styles.bar,
                              { height: `${delayPercent}%`, backgroundColor: '#F59E0B' },
                            ]}
                          />
                          <Text style={styles.barLabel}>{delayPercent.toFixed(0)}%</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Clock size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No delay data available</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#EF4444',
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#1E3A8A',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#10B981',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#93C5FD',
    textAlign: 'center',
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 20,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  navItemActive: {
    borderBottomColor: '#1E40AF',
  },
  navText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  navTextActive: {
    color: '#1E40AF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#1E40AF',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#1E40AF',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#374151',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  tableRowAlt: {
    backgroundColor: '#F9FAFB',
  },
  tableCell: {
    fontSize: 14,
    color: '#374151',
  },
  colRoute: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500' as const,
  },
  routeArrow: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '700' as const,
  },
  colLoads: {
    width: 60,
    textAlign: 'center',
  },
  colRate: {
    width: 80,
    textAlign: 'right',
  },
  colETA: {
    width: 80,
    textAlign: 'center',
  },
  colDistance: {
    width: 80,
    textAlign: 'right',
  },
  colDriverName: {
    flex: 1,
  },
  colOnTime: {
    width: 120,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#374151',
    width: 35,
    textAlign: 'right',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 20,
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
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500' as const,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
  },
  barChartItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  barChartLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#6B7280',
    textAlign: 'center',
  },
  barChartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 150,
  },
  barContainer: {
    width: 24,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    minHeight: 4,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 48,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
