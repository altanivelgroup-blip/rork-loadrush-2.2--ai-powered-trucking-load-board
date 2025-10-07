import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import AnalyticsCard from '@/components/AnalyticsCard';
import { Users, Package, DollarSign, Truck, Building2, Clock, TrendingUp, TrendingDown, Minus, Lightbulb, RefreshCw, ArrowUp, ArrowDown } from 'lucide-react-native';
import { usePlatformRevenue } from '@/hooks/usePlatformRevenue';
import { useSubscriptionAnalytics } from '@/hooks/useSubscriptionAnalytics';
import { useUsageAnalytics } from '@/hooks/useUsageAnalytics';
import { useAdminLoads } from '@/hooks/useAdminLoads';
import { useTrendAnalytics } from '@/hooks/useTrendAnalytics';
import { useInsightSummary } from '@/hooks/useInsightSummary';
import { useTripPerformance } from '@/hooks/useTripPerformance';

export default function AdminAnalytics() {
  const insets = useSafeAreaInsets();
  const [chartMode, setChartMode] = useState<'drivers' | 'shippers'>('drivers');
  const [fadeAnim] = useState(new Animated.Value(1));
  const [trendFadeAnim] = useState(new Animated.Value(0));
  const [insightFadeAnim] = useState(new Animated.Value(0));

  const revenue = usePlatformRevenue();
  const subscriptions = useSubscriptionAnalytics();
  const usage = useUsageAnalytics();
  const { metrics } = useAdminLoads();
  const trends = useTrendAnalytics();
  const insights = useInsightSummary();
  const tripPerformance = useTripPerformance();

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

  useEffect(() => {
    if (!trends.isLoading) {
      Animated.timing(trendFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [trends.isLoading]);

  useEffect(() => {
    if (!insights.isLoading && insights.insights.length > 0) {
      Animated.timing(insightFadeAnim, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [insights.isLoading, insights.insights.length]);

  const handleRefreshInsights = () => {
    console.log('[Analytics] Manual insight refresh triggered');
    Animated.sequence([
      Animated.timing(insightFadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(insightFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const trendMetrics = [
    { label: 'Revenue', metric: trends.revenue },
    { label: 'Loads', metric: trends.activeLoads },
    { label: 'Drivers', metric: trends.driverCount },
    { label: 'Shippers', metric: trends.shipperCount },
  ];

  const renderTrendIndicator = (metric: typeof trends.revenue) => {
    if (trends.isLoading) return null;

    const getTrendColor = () => {
      if (metric.direction === 'up') return '#16A34A';
      if (metric.direction === 'down') return '#DC2626';
      return '#94A3B8';
    };

    const getTrendIcon = () => {
      if (metric.direction === 'up') return <TrendingUp size={12} color={getTrendColor()} />;
      if (metric.direction === 'down') return <TrendingDown size={12} color={getTrendColor()} />;
      return <Minus size={12} color={getTrendColor()} />;
    };

    return (
      <View style={[styles.trendBadge, { backgroundColor: `${getTrendColor()}15` }]}>
        {getTrendIcon()}
        <Text style={[styles.trendText, { color: getTrendColor() }]}>
          {metric.percentChange.toFixed(1)}%
        </Text>
      </View>
    );
  };

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
        {insights.insights.length > 0 && (
          <View style={styles.insightsSection}>
            <View style={styles.insightHeader}>
              <Lightbulb size={20} color="#F59E0B" />
              <Text style={styles.insightTitle}>AI Insights</Text>
            </View>
            {insights.insights.map((insight) => (
              <View
                key={insight.id}
                style={[
                  styles.insightCard,
                  insight.type === 'positive' && styles.insightPositive,
                  insight.type === 'negative' && styles.insightNegative,
                  insight.type === 'warning' && styles.insightWarning,
                ]}
              >
                <Text style={styles.insightIcon}>{insight.icon}</Text>
                <Text style={styles.insightText}>{insight.text}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionLabel}>Overview</Text>
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <View style={styles.cardWithTrend}>
              <AnalyticsCard
                title="Total Revenue"
                value={revenue.formattedRevenue}
                icon={<DollarSign size={18} color={Colors.light.success} />}
                color={Colors.light.success}
              />
              {renderTrendIndicator(trends.revenue)}
            </View>
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
            <View style={styles.cardWithTrend}>
              <AnalyticsCard
                title="Active Loads"
                value={metrics.totalActive}
                icon={<Package size={18} color={Colors.light.accent} />}
                color={Colors.light.accent}
              />
              {renderTrendIndicator(trends.activeLoads)}
            </View>
          </View>
          <View style={styles.gridItem}>
            <View style={styles.cardWithTrend}>
              <AnalyticsCard
                title="Completed Loads"
                value={metrics.totalDelivered.toLocaleString()}
                color={Colors.light.success}
              />
              {renderTrendIndicator(trends.completedLoads)}
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Roles</Text>
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <View style={styles.cardWithTrend}>
              <AnalyticsCard
                title="Drivers"
                value={subscriptions.driverCount}
                subtitle="registered"
                icon={<Truck size={18} color='#2563EB' />}
                color='#2563EB'
              />
              {renderTrendIndicator(trends.driverCount)}
            </View>
          </View>
          <View style={styles.gridItem}>
            <View style={styles.cardWithTrend}>
              <AnalyticsCard
                title="Shippers"
                value={subscriptions.shipperCount}
                subtitle="registered"
                icon={<Building2 size={18} color='#4F46E5' />}
                color='#4F46E5'
              />
              {renderTrendIndicator(trends.shipperCount)}
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Trip Performance</Text>
        <View style={styles.tripPerformanceContainer}>
          <View style={styles.tripPerformanceCard}>
            <View style={styles.tripPerformanceGradient}>
              <Text style={styles.tripPerformanceValue}>
                {tripPerformance.isLoading ? '...' : tripPerformance.avgDistance.toFixed(1)}
              </Text>
              <Text style={styles.tripPerformanceUnit}>mi</Text>
            </View>
            <Text style={styles.tripPerformanceLabel}>Avg Distance</Text>
            <Text style={styles.tripPerformanceSubtext}>updated live</Text>
          </View>
          <View style={styles.tripPerformanceCard}>
            <View style={styles.tripPerformanceGradient}>
              <Text style={styles.tripPerformanceValue}>
                {tripPerformance.isLoading ? '...' : tripPerformance.avgDuration.toFixed(0)}
              </Text>
              <Text style={styles.tripPerformanceUnit}>min</Text>
            </View>
            <Text style={styles.tripPerformanceLabel}>Avg Duration</Text>
            <Text style={styles.tripPerformanceSubtext}>updated live</Text>
          </View>
          <View style={styles.tripPerformanceCard}>
            <View style={styles.tripPerformanceGradient}>
              <Text style={styles.tripPerformanceValue}>
                {tripPerformance.isLoading ? '...' : tripPerformance.onTimeRate.toFixed(1)}
              </Text>
              <Text style={styles.tripPerformanceUnit}>%</Text>
            </View>
            <Text style={styles.tripPerformanceLabel}>On-Time Rate</Text>
            <Text style={styles.tripPerformanceSubtext}>updated live</Text>
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

        <Text style={styles.sectionLabel}>Growth & Insights</Text>
        
        <Animated.View style={[styles.trendCardsContainer, { opacity: trendFadeAnim }]}>
          {!trends.isLoading && trendMetrics.map((item, index) => {
            const { metric } = item;
            const getTrendColor = () => {
              if (metric.direction === 'up') return '#16A34A';
              if (metric.direction === 'down') return '#DC2626';
              return '#94A3B8';
            };

            const getTrendIcon = () => {
              if (metric.direction === 'up') return <ArrowUp size={14} color={getTrendColor()} />;
              if (metric.direction === 'down') return <ArrowDown size={14} color={getTrendColor()} />;
              return <Minus size={14} color={getTrendColor()} />;
            };

            return (
              <View key={item.label} style={styles.trendMiniCard}>
                <View style={[styles.trendIconContainer, { backgroundColor: `${getTrendColor()}20` }]}>
                  {getTrendIcon()}
                </View>
                <View style={styles.trendMiniContent}>
                  <Text style={[styles.trendMiniPercent, { color: getTrendColor() }]}>
                    {metric.direction === 'up' ? '+' : metric.direction === 'down' ? '-' : ''}{metric.percentChange.toFixed(1)}%
                  </Text>
                  <Text style={styles.trendMiniLabel}>{item.label}</Text>
                </View>
              </View>
            );
          })}
        </Animated.View>

        <Animated.View style={[styles.insightsPanelContainer, { opacity: insightFadeAnim }]}>
          <View style={styles.insightsPanelHeader}>
            <View style={styles.insightsPanelTitleRow}>
              <Lightbulb size={22} color="#F59E0B" />
              <Text style={styles.insightsPanelTitle}>Weekly Intelligence Summary</Text>
            </View>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={handleRefreshInsights}
              activeOpacity={0.7}
            >
              <RefreshCw size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>
          <Text style={styles.insightsPanelSubheader}>Auto-generated insights based on real-time analytics</Text>
          
          {insights.isLoading ? (
            <View style={styles.insightLoadingContainer}>
              <Text style={styles.insightLoadingText}>Analyzing platform data...</Text>
            </View>
          ) : insights.insights.length > 0 ? (
            <View style={styles.insightsList}>
              {insights.insights.map((insight, index) => (
                <Animated.View
                  key={insight.id}
                  style={[
                    styles.insightBullet,
                    {
                      opacity: insightFadeAnim,
                      transform: [
                        {
                          translateY: insightFadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [10, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Text style={styles.insightBulletIcon}>{insight.icon}</Text>
                  <Text style={styles.insightBulletText}>{insight.text}</Text>
                </Animated.View>
              ))}
            </View>
          ) : (
            <View style={styles.insightLoadingContainer}>
              <Text style={styles.insightLoadingText}>No insights available yet</Text>
            </View>
          )}
        </Animated.View>
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
  insightsSection: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#94A3B8',
  },
  insightPositive: {
    borderLeftColor: '#16A34A',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
  },
  insightNegative: {
    borderLeftColor: '#DC2626',
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
  },
  insightWarning: {
    borderLeftColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  insightIcon: {
    fontSize: 18,
    marginTop: 2,
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.text,
  },
  cardWithTrend: {
    position: 'relative',
  },
  trendBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  trendCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  trendMiniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    minWidth: '48%',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  trendIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendMiniContent: {
    flex: 1,
  },
  trendMiniPercent: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  trendMiniLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '600' as const,
  },
  insightsPanelContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  insightsPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  insightsPanelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  insightsPanelTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  insightsPanelSubheader: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 16,
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightsList: {
    gap: 12,
  },
  insightBullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
  },
  insightBulletIcon: {
    fontSize: 20,
    marginTop: 2,
  },
  insightBulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#E2E8F0',
  },
  insightLoadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  insightLoadingText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic' as const,
  },
  tripPerformanceContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  tripPerformanceCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tripPerformanceGradient: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  tripPerformanceValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#2563EB',
  },
  tripPerformanceUnit: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#4F46E5',
    marginLeft: 4,
  },
  tripPerformanceLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  tripPerformanceSubtext: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic' as const,
  },
});
