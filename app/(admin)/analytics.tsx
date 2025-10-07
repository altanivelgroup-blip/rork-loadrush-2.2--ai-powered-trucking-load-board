import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import AnalyticsCard from '@/components/AnalyticsCard';
import { Users, Package, DollarSign, Truck, Building2, Clock } from 'lucide-react-native';
import { usePlatformRevenue } from '@/hooks/usePlatformRevenue';
import { useSubscriptionAnalytics } from '@/hooks/useSubscriptionAnalytics';
import { useUsageAnalytics } from '@/hooks/useUsageAnalytics';
import { useAdminLoads } from '@/hooks/useAdminLoads';

export default function AdminAnalytics() {
  const insets = useSafeAreaInsets();
  const [chartMode, setChartMode] = useState<'drivers' | 'shippers'>('drivers');
  const [fadeAnim] = useState(new Animated.Value(1));

  const revenue = usePlatformRevenue();
  const subscriptions = useSubscriptionAnalytics();
  const usage = useUsageAnalytics();
  const { metrics } = useAdminLoads();

  const handleChartToggle = (mode: 'drivers' | 'shippers') => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    setChartMode(mode);
  };

  const chartData = chartMode === 'drivers' ? usage.driverActivity : usage.shipperActivity;
  const maxValue = Math.max(...chartData, 1);

  const totalUsers = subscriptions.driverCount + subscriptions.shipperCount;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Platform Analytics</Text>
        <Text style={styles.subtitle}>System-wide performance metrics</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Overview</Text>
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <AnalyticsCard
              title="Total Revenue"
              value={revenue.formattedRevenue}
              icon={<DollarSign size={18} color={Colors.light.success} />}
              color={Colors.light.success}
            />
          </View>
          <View style={styles.gridItem}>
            <AnalyticsCard
              title="Total Users"
              value={totalUsers.toLocaleString()}
              icon={<Users size={18} color={Colors.light.primary} />}
              color={Colors.light.primary}
            />
          </View>
          <View style={styles.gridItem}>
            <AnalyticsCard
              title="Active Loads"
              value={metrics.totalActive}
              icon={<Package size={18} color={Colors.light.accent} />}
              color={Colors.light.accent}
            />
          </View>
          <View style={styles.gridItem}>
            <AnalyticsCard
              title="Completed Loads"
              value={metrics.totalDelivered.toLocaleString()}
              color={Colors.light.success}
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>Roles</Text>
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <AnalyticsCard
              title="Drivers"
              value={subscriptions.driverCount}
              subtitle="registered"
              icon={<Truck size={18} color='#2563EB' />}
              color='#2563EB'
            />
          </View>
          <View style={styles.gridItem}>
            <AnalyticsCard
              title="Shippers"
              value={subscriptions.shipperCount}
              subtitle="registered"
              icon={<Building2 size={18} color='#4F46E5' />}
              color='#4F46E5'
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>Financial Insights</Text>
        <View style={styles.glassmorphSection}>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <AnalyticsCard
                title="LoadRush Earnings (5%)"
                value={revenue.formattedCommission}
                icon={<DollarSign size={18} color='#16A34A' />}
                color='#16A34A'
              />
            </View>
            <View style={styles.gridItem}>
              <AnalyticsCard
                title="Driver Subscriptions"
                value={`${subscriptions.driverCount} Active`}
                subtitle={`${subscriptions.formattedDriverMRR} MRR`}
                icon={<Truck size={18} color='#2563EB' />}
                color='#2563EB'
              />
            </View>
            <View style={styles.gridItem}>
              <AnalyticsCard
                title="Shipper Subscriptions"
                value={`${subscriptions.shipperCount} Active`}
                subtitle={`${subscriptions.formattedShipperMRR} MRR`}
                icon={<Building2 size={18} color='#4F46E5' />}
                color='#4F46E5'
              />
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Behavioral Insights</Text>
        <View style={styles.glassmorphSection}>
          <View style={styles.chartHeader}>
            <View style={styles.chartTitleRow}>
              <Clock size={20} color={Colors.light.primary} />
              <Text style={styles.chartTitle}>Platform Activity by Hour</Text>
            </View>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  chartMode === 'drivers' && styles.toggleButtonActive,
                ]}
                onPress={() => handleChartToggle('drivers')}
              >
                <Text
                  style={[
                    styles.toggleText,
                    chartMode === 'drivers' && styles.toggleTextActive,
                  ]}
                >
                  Drivers
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  chartMode === 'shippers' && styles.toggleButtonActive,
                ]}
                onPress={() => handleChartToggle('shippers')}
              >
                <Text
                  style={[
                    styles.toggleText,
                    chartMode === 'shippers' && styles.toggleTextActive,
                  ]}
                >
                  Shippers
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Animated.View style={[styles.chartContainer, { opacity: fadeAnim }]}>
            <View style={styles.chart}>
              {chartData.map((value, hour) => {
                const heightPercent = (value / maxValue) * 100;
                const total = chartData.reduce((sum, v) => sum + v, 0);
                const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                
                return (
                  <View key={hour} style={styles.barContainer}>
                    <View style={styles.barWrapper}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: `${heightPercent}%`,
                            backgroundColor:
                              chartMode === 'drivers' ? '#1E3A8A' : '#F59E0B',
                          },
                        ]}
                      >
                        {value > 0 && (
                          <View style={styles.tooltip}>
                            <Text style={styles.tooltipText}>
                              {value} ({percent}%)
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Text style={styles.barLabel}>
                      {hour === 0 ? '12A' : hour < 12 ? `${hour}A` : hour === 12 ? '12P' : `${hour - 12}P`}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    backgroundColor: Colors.light.cardBackground,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 12,
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  gridItem: {
    width: '48%',
  },
  glassmorphSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  chartHeader: {
    marginBottom: 20,
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: Colors.light.primary,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  chartContainer: {
    marginTop: 16,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 200,
    gap: 4,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barWrapper: {
    width: '100%',
    height: 180,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '80%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 2,
    position: 'relative',
  },
  tooltip: {
    position: 'absolute',
    top: -24,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 40,
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  barLabel: {
    fontSize: 9,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
});
