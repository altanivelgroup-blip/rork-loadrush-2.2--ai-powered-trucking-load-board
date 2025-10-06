import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { 
  DollarSign, 
  TrendingUp, 
  Truck, 
  Fuel, 
  Wrench,
  Package,
  Target,
  Activity,
  BarChart3,
  Zap,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react-native';



type TimeRange = '7d' | '30d' | '90d' | 'ytd';

interface AnalyticsData {
  earnings: {
    total: number;
    pending: number;
    avgRatePerMile: number;
    withdrawable: number;
    trend: number;
    recentTransactions: {
      amount: number;
      date: string;
      description: string;
    }[];
  };
  performance: {
    loadsCompleted: number;
    totalMilesDriven: number;
    completionRate: number;
    activeLoads: number;
    avgLoadValue: number;
    onTimeDeliveryRate: number;
  };
  fuel: {
    averageMpg: number;
    fuelTankSize: number;
    estimatedRange: number;
    currentOdometer: number;
    fuelCostTrend: number;
    totalFuelCost: number;
  };
  trailer: {
    capacity: number;
    avgLoadWeight: number;
    utilizationPercent: number;
    totalLoadsHauled: number;
  };
  maintenance: {
    overdue: number;
    dueSoon: number;
    scheduled: number;
    costsYTD: number;
    netEarnings: number;
    upcomingServices: {
      name: string;
      dueDate: string;
      cost: number;
    }[];
  };
}

const DUMMY_ANALYTICS: AnalyticsData = {
  earnings: {
    total: 30607.27,
    pending: 3847.50,
    avgRatePerMile: 2.45,
    withdrawable: 20463.24,
    trend: 12.5,
    recentTransactions: [
      { amount: 2450.00, date: '2025-10-01', description: 'Load Payment - Chicago to Dallas' },
      { amount: 3200.00, date: '2025-09-28', description: 'Load Payment - New York to Miami' },
      { amount: 2800.00, date: '2025-09-24', description: 'Load Payment - LA to Seattle' },
    ],
  },
  performance: {
    loadsCompleted: 47,
    totalMilesDriven: 12485,
    completionRate: 98.5,
    activeLoads: 2,
    avgLoadValue: 2650,
    onTimeDeliveryRate: 96.8,
  },
  fuel: {
    averageMpg: 8.5,
    fuelTankSize: 100,
    estimatedRange: 850,
    currentOdometer: 125000,
    fuelCostTrend: -3.2,
    totalFuelCost: 4250,
  },
  trailer: {
    capacity: 48000,
    avgLoadWeight: 38400,
    utilizationPercent: 80,
    totalLoadsHauled: 47,
  },
  maintenance: {
    overdue: 2,
    dueSoon: 2,
    scheduled: 4,
    costsYTD: 3850,
    netEarnings: 26757.27,
    upcomingServices: [
      { name: 'Oil Change', dueDate: '2025-09-15', cost: 250 },
      { name: 'Brake Inspection', dueDate: '2025-10-10', cost: 450 },
      { name: 'Tire Rotation', dueDate: '2025-10-20', cost: 180 },
    ],
  },
};

export default function DriverAnalyticsScreen() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const analytics = DUMMY_ANALYTICS;

  const timeRanges: { key: TimeRange; label: string }[] = [
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '90d', label: '90 Days' },
    { key: 'ytd', label: 'YTD' },
  ];

  const renderMetricCard = (
    title: string,
    value: string | number,
    subtitle?: string,
    icon?: React.ReactNode,
    trend?: number,
    color: string = '#3B82F6'
  ) => (
    <View style={[styles.metricCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={styles.metricHeader}>
        <View style={styles.metricTitleContainer}>
          <Text style={styles.metricTitle}>{title}</Text>
          {trend !== undefined && (
            <View style={[styles.trendBadge, { backgroundColor: trend >= 0 ? '#ECFDF5' : '#FEF2F2' }]}>
              {trend >= 0 ? (
                <ArrowUpRight size={12} color="#10B981" />
              ) : (
                <ArrowDownRight size={12} color="#EF4444" />
              )}
              <Text style={[styles.trendText, { color: trend >= 0 ? '#10B981' : '#EF4444' }]}>
                {Math.abs(trend)}%
              </Text>
            </View>
          )}
        </View>
        {icon && (
          <View style={[styles.metricIcon, { backgroundColor: color + '15' }]}>
            {icon}
          </View>
        )}
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderEarningsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <DollarSign size={20} color="#10B981" />
          <Text style={styles.sectionTitle}>Earnings Overview</Text>
        </View>
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View Wallet</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.metricsGrid}>
        {renderMetricCard(
          'Total Earnings',
          `$${analytics.earnings.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          'All-time earnings',
          <DollarSign size={18} color="#10B981" />,
          analytics.earnings.trend,
          '#10B981'
        )}
        {renderMetricCard(
          'Pending Earnings',
          `$${analytics.earnings.pending.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          'In transit loads',
          <TrendingUp size={18} color="#F59E0B" />,
          undefined,
          '#F59E0B'
        )}
      </View>

      <View style={styles.metricsGrid}>
        {renderMetricCard(
          'Avg Rate per Mile',
          `$${analytics.earnings.avgRatePerMile.toFixed(2)}`,
          'Per mile average',
          <Target size={18} color="#3B82F6" />,
          undefined,
          '#3B82F6'
        )}
        {renderMetricCard(
          'Withdrawable Balance',
          `$${analytics.earnings.withdrawable.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          'Ready to withdraw',
          <CheckCircle2 size={18} color="#10B981" />,
          undefined,
          '#10B981'
        )}
      </View>

      <View style={styles.transactionsPreview}>
        <Text style={styles.subsectionTitle}>Recent Transactions</Text>
        {analytics.earnings.recentTransactions.map((transaction, index) => (
          <View key={index} style={styles.transactionItem}>
            <View style={styles.transactionIcon}>
              <ArrowDownRight size={16} color="#10B981" />
            </View>
            <View style={styles.transactionContent}>
              <Text style={styles.transactionDescription}>{transaction.description}</Text>
              <Text style={styles.transactionDate}>
                {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
            <Text style={styles.transactionAmount}>
              +${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderPerformanceSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Activity size={20} color="#3B82F6" />
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        {renderMetricCard(
          'Loads Completed',
          analytics.performance.loadsCompleted,
          `${analytics.performance.activeLoads} active`,
          <Package size={18} color="#3B82F6" />,
          undefined,
          '#3B82F6'
        )}
        {renderMetricCard(
          'Total Miles Driven',
          analytics.performance.totalMilesDriven.toLocaleString(),
          'This period',
          <Truck size={18} color="#8B5CF6" />,
          undefined,
          '#8B5CF6'
        )}
      </View>

      <View style={styles.metricsGrid}>
        {renderMetricCard(
          'Completion Rate',
          `${analytics.performance.completionRate}%`,
          'On-time delivery',
          <CheckCircle2 size={18} color="#10B981" />,
          undefined,
          '#10B981'
        )}
        {renderMetricCard(
          'Avg Load Value',
          `$${analytics.performance.avgLoadValue.toLocaleString()}`,
          'Per load average',
          <DollarSign size={18} color="#F59E0B" />,
          undefined,
          '#F59E0B'
        )}
      </View>

      <View style={styles.performanceBar}>
        <View style={styles.performanceBarHeader}>
          <Text style={styles.performanceBarTitle}>On-Time Delivery Rate</Text>
          <Text style={styles.performanceBarValue}>{analytics.performance.onTimeDeliveryRate}%</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                width: `${analytics.performance.onTimeDeliveryRate}%`,
                backgroundColor: analytics.performance.onTimeDeliveryRate >= 95 ? '#10B981' : '#F59E0B'
              }
            ]} 
          />
        </View>
      </View>
    </View>
  );

  const renderFuelSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Fuel size={20} color="#F59E0B" />
          <Text style={styles.sectionTitle}>Fuel & Efficiency</Text>
        </View>
        <View style={styles.analyticsSourceBadge}>
          <Text style={styles.analyticsSourceText}>From Profile</Text>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        {renderMetricCard(
          'Average MPG',
          analytics.fuel.averageMpg.toFixed(1),
          'Miles per gallon',
          <Fuel size={18} color="#F59E0B" />,
          undefined,
          '#F59E0B'
        )}
        {renderMetricCard(
          'Fuel Tank Size',
          `${analytics.fuel.fuelTankSize} gal`,
          'Tank capacity',
          <Zap size={18} color="#3B82F6" />,
          undefined,
          '#3B82F6'
        )}
      </View>

      <View style={styles.metricsGrid}>
        {renderMetricCard(
          'Estimated Range',
          `${analytics.fuel.estimatedRange} mi`,
          'Tank size × MPG',
          <Target size={18} color="#10B981" />,
          undefined,
          '#10B981'
        )}
        {renderMetricCard(
          'Current Odometer',
          analytics.fuel.currentOdometer.toLocaleString(),
          'Total miles',
          <Activity size={18} color="#8B5CF6" />,
          undefined,
          '#8B5CF6'
        )}
      </View>

      <View style={styles.fuelCostCard}>
        <View style={styles.fuelCostHeader}>
          <Text style={styles.fuelCostTitle}>Total Fuel Cost (YTD)</Text>
          <View style={[styles.trendBadge, { backgroundColor: analytics.fuel.fuelCostTrend < 0 ? '#ECFDF5' : '#FEF2F2' }]}>
            {analytics.fuel.fuelCostTrend < 0 ? (
              <ArrowDownRight size={12} color="#10B981" />
            ) : (
              <ArrowUpRight size={12} color="#EF4444" />
            )}
            <Text style={[styles.trendText, { color: analytics.fuel.fuelCostTrend < 0 ? '#10B981' : '#EF4444' }]}>
              {Math.abs(analytics.fuel.fuelCostTrend)}%
            </Text>
          </View>
        </View>
        <Text style={styles.fuelCostValue}>${analytics.fuel.totalFuelCost.toLocaleString()}</Text>
        <Text style={styles.fuelCostSubtext}>Trending {analytics.fuel.fuelCostTrend < 0 ? 'down' : 'up'} vs last period</Text>
      </View>
    </View>
  );

  const renderTrailerSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Package size={20} color="#8B5CF6" />
          <Text style={styles.sectionTitle}>Trailer Utilization</Text>
        </View>
        <View style={styles.analyticsSourceBadge}>
          <Text style={styles.analyticsSourceText}>From Profile</Text>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        {renderMetricCard(
          'Trailer Capacity',
          `${analytics.trailer.capacity.toLocaleString()} lbs`,
          'Max capacity',
          <Package size={18} color="#8B5CF6" />,
          undefined,
          '#8B5CF6'
        )}
        {renderMetricCard(
          'Avg Load Weight',
          `${analytics.trailer.avgLoadWeight.toLocaleString()} lbs`,
          'Per load average',
          <BarChart3 size={18} color="#3B82F6" />,
          undefined,
          '#3B82F6'
        )}
      </View>

      <View style={styles.utilizationCard}>
        <View style={styles.utilizationHeader}>
          <Text style={styles.utilizationTitle}>Capacity Utilization</Text>
          <Text style={styles.utilizationValue}>{analytics.trailer.utilizationPercent}%</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                width: `${analytics.trailer.utilizationPercent}%`,
                backgroundColor: analytics.trailer.utilizationPercent >= 75 ? '#10B981' : '#F59E0B'
              }
            ]} 
          />
        </View>
        <Text style={styles.utilizationSubtext}>
          {analytics.trailer.avgLoadWeight.toLocaleString()} / {analytics.trailer.capacity.toLocaleString()} lbs average
        </Text>
      </View>

      <View style={styles.infoBox}>
        <Target size={16} color="#8B5CF6" />
        <Text style={styles.infoBoxText}>
          Higher utilization means better revenue per trip. Aim for 80%+ for optimal efficiency.
        </Text>
      </View>
    </View>
  );

  const renderMaintenanceSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Wrench size={20} color="#EF4444" />
          <Text style={styles.sectionTitle}>Maintenance & Expenses</Text>
        </View>
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.maintenanceStatusRow}>
        <View style={[styles.maintenanceStatusCard, { backgroundColor: '#FEE2E2' }]}>
          <AlertCircle size={20} color="#EF4444" />
          <Text style={[styles.maintenanceStatusValue, { color: '#EF4444' }]}>{analytics.maintenance.overdue}</Text>
          <Text style={styles.maintenanceStatusLabel}>Overdue</Text>
        </View>
        <View style={[styles.maintenanceStatusCard, { backgroundColor: '#FEF3C7' }]}>
          <AlertCircle size={20} color="#F59E0B" />
          <Text style={[styles.maintenanceStatusValue, { color: '#F59E0B' }]}>{analytics.maintenance.dueSoon}</Text>
          <Text style={styles.maintenanceStatusLabel}>Due Soon</Text>
        </View>
        <View style={[styles.maintenanceStatusCard, { backgroundColor: '#DBEAFE' }]}>
          <CheckCircle2 size={20} color="#3B82F6" />
          <Text style={[styles.maintenanceStatusValue, { color: '#3B82F6' }]}>{analytics.maintenance.scheduled}</Text>
          <Text style={styles.maintenanceStatusLabel}>Scheduled</Text>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        {renderMetricCard(
          'Maintenance Costs (YTD)',
          `$${analytics.maintenance.costsYTD.toLocaleString()}`,
          'Total maintenance spend',
          <Wrench size={18} color="#EF4444" />,
          undefined,
          '#EF4444'
        )}
        {renderMetricCard(
          'Net Earnings',
          `$${analytics.maintenance.netEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          'After maintenance costs',
          <DollarSign size={18} color="#10B981" />,
          undefined,
          '#10B981'
        )}
      </View>

      <View style={styles.upcomingServicesCard}>
        <Text style={styles.subsectionTitle}>Upcoming Services</Text>
        {analytics.maintenance.upcomingServices.map((service, index) => (
          <View key={index} style={styles.serviceItem}>
            <View style={styles.serviceIcon}>
              <Wrench size={16} color="#6B7280" />
            </View>
            <View style={styles.serviceContent}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceDueDate}>Due: {service.dueDate}</Text>
            </View>
            <Text style={styles.serviceCost}>${service.cost}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Analytics',
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#1F2937',
          headerShadowVisible: false,
        }}
      />

      <View style={styles.timeRangeContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.timeRangeScroll}
        >
          {timeRanges.map((range) => (
            <TouchableOpacity
              key={range.key}
              style={[styles.timeRangeButton, timeRange === range.key && styles.timeRangeButtonActive]}
              onPress={() => setTimeRange(range.key)}
            >
              <Text style={[styles.timeRangeText, timeRange === range.key && styles.timeRangeTextActive]}>
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderEarningsSection()}
        {renderPerformanceSection()}
        {renderFuelSection()}
        {renderTrailerSection()}
        {renderMaintenanceSection()}

        <View style={styles.footerNote}>
          <Activity size={16} color="#6B7280" />
          <Text style={styles.footerNoteText}>
            Analytics data is pulled from your Profile, Wallet, Loads, and Maintenance records. No duplicate data entry required.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  timeRangeContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  timeRangeScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeRangeButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  timeRangeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  timeRangeTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1F2937',
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#3B82F6',
  },
  analyticsSourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  analyticsSourceText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  metricTitleContainer: {
    flex: 1,
    gap: 6,
  },
  metricTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  transactionsPreview: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionContent: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#10B981',
  },
  performanceBar: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  performanceBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  performanceBarTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  performanceBarValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1F2937',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  fuelCostCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  fuelCostHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fuelCostTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  fuelCostValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 4,
  },
  fuelCostSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  utilizationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  utilizationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  utilizationTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  utilizationValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1F2937',
  },
  utilizationSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#C4B5FD',
    borderRadius: 10,
    padding: 12,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 12,
    color: '#5B21B6',
    lineHeight: 18,
  },
  maintenanceStatusRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  maintenanceStatusCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  maintenanceStatusValue: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  maintenanceStatusLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  upcomingServicesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  serviceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceContent: {
    flex: 1,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 2,
  },
  serviceDueDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  serviceCost: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#EF4444',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  footerNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
});
