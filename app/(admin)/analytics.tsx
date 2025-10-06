/**
 * 💾 SAVE POINT: Overall_Stable_v2.1
 * Perfect iPad Header + Card Layout (Portrait & Landscape)
 * Verified: No overflow, no distortion, all widgets aligned.
 * Date: 2025-10-05
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { dummyAdminAnalytics } from '@/mocks/dummyData';
import Colors from '@/constants/colors';
import AnalyticsCard from '@/components/AnalyticsCard';
import { Users, Package, DollarSign, TrendingUp } from 'lucide-react-native';

export default function AdminAnalytics() {
  const insets = useSafeAreaInsets();
  const analytics = dummyAdminAnalytics;

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
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <AnalyticsCard
              title="Total Revenue"
              value={`$${(analytics.totalRevenue / 1000000).toFixed(1)}M`}
              trend="up"
              trendValue={`+${analytics.revenueGrowth}%`}
              icon={<DollarSign size={18} color={Colors.light.success} />}
              color={Colors.light.success}
            />
          </View>
          <View style={styles.gridItem}>
            <AnalyticsCard
              title="Total Users"
              value={analytics.totalUsers.toLocaleString()}
              icon={<Users size={18} color={Colors.light.primary} />}
              color={Colors.light.primary}
            />
          </View>
          <View style={styles.gridItem}>
            <AnalyticsCard
              title="Active Loads"
              value={analytics.activeLoads}
              icon={<Package size={18} color={Colors.light.accent} />}
              color={Colors.light.accent}
            />
          </View>
          <View style={styles.gridItem}>
            <AnalyticsCard
              title="Completed"
              value={analytics.completedLoads.toLocaleString()}
              subtitle="total loads"
              color={Colors.light.success}
            />
          </View>
          <View style={styles.gridItem}>
            <AnalyticsCard
              title="Drivers"
              value={analytics.totalDrivers}
              subtitle="registered"
              color={Colors.light.secondary}
            />
          </View>
          <View style={styles.gridItem}>
            <AnalyticsCard
              title="Shippers"
              value={analytics.totalShippers}
              subtitle="registered"
              color={Colors.light.primary}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Routes by Revenue</Text>
            <TrendingUp size={20} color={Colors.light.success} />
          </View>
          {analytics.topRoutes.map((route, index) => (
            <View key={index} style={styles.routeCard}>
              <View style={styles.routeRank}>
                <Text style={styles.routeRankText}>#{index + 1}</Text>
              </View>
              <View style={styles.routeContent}>
                <Text style={styles.routeName}>{route.route}</Text>
                <View style={styles.routeStats}>
                  <Text style={styles.routeStat}>{route.volume} loads</Text>
                  <Text style={styles.routeDot}>•</Text>
                  <Text style={styles.routeStat}>${route.revenue.toLocaleString()}</Text>
                </View>
              </View>
            </View>
          ))}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  gridItem: {
    width: '48%',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  routeCard: {
    flexDirection: 'row',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    gap: 12,
  },
  routeRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeRankText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.light.primary,
  },
  routeContent: {
    flex: 1,
  },
  routeName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  routeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeStat: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  routeDot: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
});
