import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import Colors from '@/constants/colors';
import { Zap, DollarSign, Settings, Crown, TrendingUp, Package, CheckCircle, ChevronRight, Truck } from 'lucide-react-native';
import { dummyLoads, dummyShipperAnalytics } from '@/mocks/dummyData';

export default function ShipperDashboard() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  const activeLoads = dummyLoads.filter(load => 
    load.status === 'posted' || load.status === 'matched' || load.status === 'in_transit'
  );

  const stats = [
    {
      id: 'active',
      value: dummyShipperAnalytics.activeLoads,
      label: 'Active\nLoads',
      icon: Package,
    },
    {
      id: 'spend',
      value: `${(dummyShipperAnalytics.totalSpent / 1000).toFixed(1)}k`,
      label: 'Total Spend\n(This Month)',
      icon: DollarSign,
    },
    {
      id: 'completed',
      value: dummyShipperAnalytics.completedLoads,
      label: 'Loads\nCompleted',
      icon: CheckCircle,
    },
  ];

  const toolsFeatures = [
    {
      id: 'ai-tools',
      title: 'AI Posting Assistant',
      description: 'Draft posts, quotes and more',
      icon: Zap,
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
    },
    {
      id: 'increase-revenue',
      title: 'Optimize Posting',
      description: 'Tips and premium placement',
      icon: TrendingUp,
      iconColor: '#10B981',
      iconBg: '#ECFDF5',
    },
    {
      id: 'advanced-security',
      title: 'Secure Documents',
      description: 'Protect posts and payments',
      icon: Settings,
      iconColor: '#6366F1',
      iconBg: '#EEF2FF',
    },
    {
      id: 'membership',
      title: 'Membership Upgrade',
      description: 'Upgrade for more features',
      icon: Crown,
      iconColor: '#F59E0B',
      iconBg: '#FFFBEB',
    },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: 8, paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeBack}>Welcome back,</Text>
            <Text style={styles.welcomeTitle}>SHIPPER</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.statusText}>Live Analytics Active</Text>
              </View>
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.statusText}>Wallet Tracking</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Profile Secured</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Describe your ideal load"
            placeholderTextColor={Colors.light.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.statsContainer}>
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <View key={stat.id} style={styles.statCard}>
                <Icon size={24} color={Colors.light.primary} />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI Recommended Loads</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/(shipper)/loads')}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRight size={16} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.loadsContainer}>
            {activeLoads.slice(0, 2).map((load) => (
              <TouchableOpacity
                key={load.id}
                style={styles.loadCard}
                activeOpacity={0.7}
                onPress={() => {
                  router.push({
                    pathname: '/(shipper)/loads',
                    params: { loadId: load.id }
                  });
                }}
              >
                <View style={styles.loadHeader}>
                  <View style={[styles.statusBadgeSmall, { 
                    backgroundColor: load.status === 'posted' ? '#10B981' : 
                                   load.status === 'matched' ? '#3B82F6' : '#F59E0B' 
                  }]}>
                    <Text style={styles.statusBadgeText}>
                      {load.status === 'posted' ? 'Pending' : 
                       load.status === 'matched' ? 'Matched' : 'In-Transit'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.loadRate}>Suggested Rate: ${load.rate.toLocaleString()}</Text>
                <Text style={styles.loadRoute}>
                  {load.pickup.city}, {load.pickup.state} → {load.dropoff.city}, {load.dropoff.state}
                </Text>
                <View style={styles.driverAvailability}>
                  <Truck size={14} color={Colors.light.textSecondary} />
                  <Text style={styles.driverAvailabilityText}>
                    {load.status === 'matched' || load.status === 'in_transit' ? 'Driver Assigned' : 'Best Match Driver Available'}
                  </Text>
                </View>

                <TouchableOpacity style={styles.detailsButton}>
                  <Text style={styles.detailsButtonText}>Tap for Details</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Loads</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/(shipper)/loads')}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRight size={16} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.loadsContainer}>
            {activeLoads.slice(0, 3).map((load) => (
              <TouchableOpacity
                key={load.id}
                style={styles.loadCard}
                activeOpacity={0.7}
                onPress={() => {
                  router.push({
                    pathname: '/(shipper)/loads',
                    params: { loadId: load.id }
                  });
                }}
              >
                <View style={styles.loadHeader}>
                  <View style={[styles.statusBadgeSmall, { 
                    backgroundColor: load.status === 'posted' ? '#10B981' : 
                                   load.status === 'matched' ? '#3B82F6' : '#F59E0B' 
                  }]}>
                    <Text style={styles.statusBadgeText}>
                      {load.status === 'posted' ? 'Active' : 
                       load.status === 'matched' ? 'Matched' : 'In Transit'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.loadStatus}>Status: {
                  load.status === 'posted' ? 'Pending' :
                  load.status === 'matched' ? 'Matched' :
                  load.status === 'in_transit' ? 'In-Transit' :
                  load.status === 'delivered' ? 'Delivered' : 'Pending'
                }</Text>
                <Text style={styles.loadRate}>Suggested Rate: ${load.rate.toLocaleString()}</Text>
                <Text style={styles.loadRoute}>
                  {load.pickup.city}, {load.pickup.state} → {load.dropoff.city}, {load.dropoff.state}
                </Text>
                <View style={styles.driverAvailability}>
                  <Truck size={14} color={Colors.light.textSecondary} />
                  <Text style={styles.driverAvailabilityText}>
                    {load.status === 'matched' || load.status === 'in_transit' ? 'Driver Assigned' : 'Best Match Driver Available'}
                  </Text>
                </View>

                <TouchableOpacity style={styles.detailsButton}>
                  <Text style={styles.detailsButtonText}>Tap for Details</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tools & Features</Text>
          
          <View style={styles.toolsGrid}>
            {toolsFeatures.map((tool) => {
              const Icon = tool.icon;
              return (
                <TouchableOpacity
                  key={tool.id}
                  style={styles.toolCard}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (tool.id === 'ai-tools') {
                      router.push('/(shipper)/ai-tools');
                    } else if (tool.id === 'increase-revenue') {
                      router.push('/(shipper)/increase-revenue');
                    } else if (tool.id === 'advanced-security') {
                      router.push('/(shipper)/secure-docs-shipper');
                    } else if (tool.id === 'membership') {
                      router.push('/(shipper)/membership');
                    }
                  }}
                >
                  <View style={[styles.toolIconContainer, { backgroundColor: tool.iconBg }]}>
                    <Icon size={24} color={tool.iconColor} />
                  </View>
                  <View style={styles.toolContent}>
                    <Text style={styles.toolTitle}>{tool.title}</Text>
                    <Text style={styles.toolDescription}>{tool.description}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 16,
  },
  welcomeBack: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontWeight: '500' as const,
  },

  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.primary,
  },
  loadsContainer: {
    gap: 12,
  },
  loadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  loadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadgeSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  loadStatus: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 4,
    fontWeight: '500' as const,
  },
  loadRate: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  loadRoute: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 4,
  },
  driverAvailability: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  driverAvailabilityText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '500' as const,
  },
  detailsButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.primary,
  },
  toolsGrid: {
    gap: 12,
  },
  toolCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  toolIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolContent: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 2,
  },
  toolDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
});
