import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { ChevronLeft, DollarSign, Truck, TrendingUp, CheckCircle } from 'lucide-react-native';

export default function IncreaseRevenue() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Increase Revenue</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Grow Revenue With Better Lanes</Text>
          <Text style={styles.heroSubtitle}>
            Real trucking market data + tools that boost rate per mile, reduce deadhead, and lift acceptance.
          </Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#EFF6FF' }]}>
                <DollarSign size={20} color="#3B82F6" />
              </View>
              <Text style={styles.statValue}>+6–12%</Text>
              <Text style={styles.statLabel}>Avg RPM Lift</Text>
              <Text style={styles.statSubtext}>vs. regional averages</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#EFF6FF' }]}>
                <Truck size={20} color="#3B82F6" />
              </View>
              <Text style={styles.statValue}>18–30%</Text>
              <Text style={styles.statLabel}>Deadhead Reduced</Text>
              <Text style={styles.statSubtext}>with backhaul pairing</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#EFF6FF' }]}>
                <TrendingUp size={20} color="#3B82F6" />
              </View>
              <Text style={styles.statValue}>2.4x</Text>
              <Text style={styles.statLabel}>Faster Tender —</Text>
              <Text style={styles.statSubtext}>Book</Text>
              <Text style={styles.statSubtext}>with instant alerts</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#EFF6FF' }]}>
                <CheckCircle size={20} color="#3B82F6" />
              </View>
              <Text style={styles.statValue}>+15–25%</Text>
              <Text style={styles.statLabel}>Carrier Acceptance</Text>
              <Text style={styles.statSubtext}>from verified badge</Text>
            </View>
          </View>
        </View>

        <View style={styles.marketSection}>
          <Text style={styles.sectionTitle}>Market Snapshot</Text>
          
          <View style={styles.marketRow}>
            <Text style={styles.marketLabel}>National load-to-truck ratio (dry van)</Text>
            <Text style={styles.marketValue}>3.1x</Text>
          </View>

          <View style={styles.marketRow}>
            <Text style={styles.marketLabel}>Seasonal uplift Q4 vs Q2 (auto moves)</Text>
            <Text style={styles.marketValue}>1.18x</Text>
          </View>

          <View style={[styles.marketRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.marketLabel}>Top 10 lanes premium vs avg</Text>
            <Text style={styles.marketValue}>1.12x</Text>
          </View>
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  heroSection: {
    marginBottom: 32,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 36,
  },
  heroSubtitle: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  marketSection: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 20,
  },
  marketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  marketLabel: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
    marginRight: 16,
    lineHeight: 20,
  },
  marketValue: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#3B82F6',
  },
});
