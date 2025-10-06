import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Stack } from 'expo-router';
import { useAdminAnalytics, RecentLoad } from '@/hooks/useAdminAnalytics';
import {
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Package,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 768;

export default function AdminDashboard() {
  const analytics = useAdminAnalytics();

  if (analytics.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Admin Dashboard' }} />
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading Analytics...</Text>
      </View>
    );
  }

  if (analytics.error) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ title: 'Admin Dashboard' }} />
        <XCircle size={48} color="#EF4444" />
        <Text style={styles.errorText}>Error loading analytics</Text>
        <Text style={styles.errorSubtext}>{analytics.error}</Text>
      </View>
    );
  }

  const maxLoadCount = Math.max(...analytics.loadsByDay.map((d: { count: number }) => d.count), 1);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Admin Dashboard' }} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.overviewSection}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon={<TrendingUp size={24} color="#3B82F6" />}
              label="Active Loads"
              value={analytics.loadCounts.active}
              color="#3B82F6"
            />
            <StatCard
              icon={<Clock size={24} color="#F59E0B" />}
              label="Pending Loads"
              value={analytics.loadCounts.pending}
              color="#F59E0B"
            />
            <StatCard
              icon={<CheckCircle size={24} color="#10B981" />}
              label="Delivered"
              value={analytics.loadCounts.delivered}
              color="#10B981"
            />
            <StatCard
              icon={<XCircle size={24} color="#EF4444" />}
              label="Cancelled"
              value={analytics.loadCounts.cancelled}
              color="#EF4444"
            />
            <StatCard
              icon={<Users size={24} color="#8B5CF6" />}
              label="Total Drivers"
              value={analytics.driverCount}
              color="#8B5CF6"
            />
            <StatCard
              icon={<Package size={24} color="#EC4899" />}
              label="Total Shippers"
              value={analytics.shipperCount}
              color="#EC4899"
            />
          </View>
        </View>

        <View style={styles.chartsSection}>
          <Text style={styles.sectionTitle}>Load Status Distribution</Text>
          <View style={styles.chartCard}>
            <View style={styles.barChart}>
              <BarChartItem
                label="Active"
                value={analytics.loadCounts.active}
                max={analytics.loadCounts.total}
                color="#3B82F6"
              />
              <BarChartItem
                label="Pending"
                value={analytics.loadCounts.pending}
                max={analytics.loadCounts.total}
                color="#F59E0B"
              />
              <BarChartItem
                label="Delivered"
                value={analytics.loadCounts.delivered}
                max={analytics.loadCounts.total}
                color="#10B981"
              />
              <BarChartItem
                label="Cancelled"
                value={analytics.loadCounts.cancelled}
                max={analytics.loadCounts.total}
                color="#EF4444"
              />
            </View>
          </View>
        </View>

        <View style={styles.chartsSection}>
          <Text style={styles.sectionTitle}>Loads Created (Last 7 Days)</Text>
          <View style={styles.chartCard}>
            {analytics.loadsByDay.length > 0 ? (
              <View style={styles.lineChart}>
                {analytics.loadsByDay.map((day: { date: string; count: number }, index: number) => (
                  <View key={day.date} style={styles.lineChartBar}>
                    <View
                      style={[
                        styles.lineChartBarFill,
                        {
                          height: `${(day.count / maxLoadCount) * 100}%`,
                          backgroundColor: '#3B82F6',
                        },
                      ]}
                    />
                    <Text style={styles.lineChartLabel}>
                      {new Date(day.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                    <Text style={styles.lineChartValue}>{day.count}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No load data available</Text>
            )}
          </View>
        </View>

        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {analytics.recentLoads.length > 0 ? (
            <View style={styles.tableCard}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.colId]}>Load ID</Text>
                <Text style={[styles.tableHeaderText, styles.colRoute]}>Route</Text>
                <Text style={[styles.tableHeaderText, styles.colStatus]}>Status</Text>
                <Text style={[styles.tableHeaderText, styles.colRate]}>Rate</Text>
              </View>
              {analytics.recentLoads.map((load: RecentLoad) => (
                <View key={load.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colId]} numberOfLines={1}>
                    {load.id.substring(0, 8)}...
                  </Text>
                  <Text style={[styles.tableCell, styles.colRoute]} numberOfLines={1}>
                    {load.originCity} → {load.destinationCity}
                  </Text>
                  <View style={[styles.colStatus, styles.statusPillContainer]}>
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: getStatusColor(load.status) },
                      ]}
                    >
                      <Text style={styles.statusText}>{load.status}</Text>
                    </View>
                  </View>
                  <Text style={[styles.tableCell, styles.colRate]}>
                    ${load.rate?.toLocaleString() || '0'}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Package size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No load data available</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

interface BarChartItemProps {
  label: string;
  value: number;
  max: number;
  color: string;
}

function BarChartItem({ label, value, max, color }: BarChartItemProps) {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  return (
    <View style={styles.barChartItem}>
      <Text style={styles.barChartLabel}>{label}</Text>
      <View style={styles.barChartBarContainer}>
        <View
          style={[
            styles.barChartBarFill,
            { width: `${percentage}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={styles.barChartValue}>{value}</Text>
    </View>
  );
}

function getStatusColor(status: string): string {
  const statusLower = status?.toLowerCase() || '';
  switch (statusLower) {
    case 'active':
      return '#3B82F6';
    case 'pending':
      return '#F59E0B';
    case 'delivered':
      return '#10B981';
    case 'cancelled':
      return '#EF4444';
    default:
      return '#6B7280';
  }
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  overviewSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: isSmallScreen ? '48%' : '31%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  chartsSection: {
    marginBottom: 24,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  barChart: {
    gap: 16,
  },
  barChartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  barChartLabel: {
    width: 80,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500' as const,
  },
  barChartBarContainer: {
    flex: 1,
    height: 24,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barChartBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  barChartValue: {
    width: 40,
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
    textAlign: 'right',
  },
  lineChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 200,
    paddingTop: 20,
  },
  lineChartBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 4,
  },
  lineChartBarFill: {
    width: '100%',
    minHeight: 4,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    marginBottom: 8,
  },
  lineChartLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  lineChartValue: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 4,
  },
  recentSection: {
    marginBottom: 24,
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 14,
    color: '#374151',
  },
  colId: {
    width: '20%',
  },
  colRoute: {
    width: '35%',
  },
  colStatus: {
    width: '25%',
  },
  colRate: {
    width: '20%',
    textAlign: 'right',
  },
  statusPillContainer: {
    alignItems: 'flex-start',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    textTransform: 'capitalize',
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
