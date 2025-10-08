import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { dummyLoads, dummyDriverAnalytics } from '@/mocks/dummyData';
import Colors from '@/constants/colors';
import AnalyticsCard from '@/components/AnalyticsCard';
import LoadCard from '@/components/LoadCard';
import { DollarSign, TrendingUp, Truck, Fuel, LogOut, Settings, LineChart, Shield, Award, AlertCircle, Clock, MapPin, Radio } from 'lucide-react-native';
import { DriverProfile } from '@/types';
import { useDriverProfile, useDriverStats, useDriverLoads, useDriverAnalytics, useAvailableLoads } from '@/hooks/useDriverData';
import { useDriverGPS } from '@/hooks/useDriverGPS';
import { useFuelPrices } from '@/hooks/useFuelPrices';

export default function DriverDashboard() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const router = useRouter();
  
  const { profile: firestoreProfile, loading: profileLoading } = useDriverProfile();
  const { stats, loading: statsLoading } = useDriverStats();
  const { activeLoads: firestoreActiveLoads, loading: loadsLoading } = useDriverLoads();
  const { analytics: firestoreAnalytics, loading: analyticsLoading } = useDriverAnalytics();
  const { matchedLoads: firestoreMatchedLoads, loading: availableLoading } = useAvailableLoads();
  
  const { location, isTracking } = useDriverGPS(user?.id);
  
  const profile = firestoreProfile || (user?.profile as DriverProfile);
  const driverState = profile?.truckInfo?.state;
  const { dieselPrice, loading: fuelLoading, error: fuelError, lastFetch } = useFuelPrices(driverState);
  const analytics = firestoreAnalytics || dummyDriverAnalytics;
  const activeLoads = firestoreActiveLoads.length > 0 ? firestoreActiveLoads : dummyLoads.filter(
    (load) => load.status === 'matched' || load.status === 'in_transit'
  );
  const matchedLoads = firestoreMatchedLoads.length > 0 ? firestoreMatchedLoads : dummyLoads.filter(
    (load) => load.status === 'posted' && load.aiScore && load.aiScore > 80
  );
  
  const isLoading = profileLoading || statsLoading || loadsLoading || analyticsLoading || availableLoading;

  const getStatusColor = (status?: 'active' | 'offline' | 'banned') => {
    switch (status) {
      case 'active':
        return Colors.light.success;
      case 'offline':
        return Colors.light.textSecondary;
      case 'banned':
        return Colors.light.danger;
      default:
        return Colors.light.textSecondary;
    }
  };

  const getStatusLabel = (status?: 'active' | 'offline' | 'banned') => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'offline':
        return 'Offline';
      case 'banned':
        return 'Banned';
      default:
        return 'Unknown';
    }
  };

  const formatLastActive = (lastActive?: string) => {
    if (!lastActive) return 'Never';
    const date = new Date(lastActive);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading && !profile) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Stack.Screen options={{ title: 'Dashboard', headerShown: false }} />
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading Driver Data...</Text>
      </View>
    );
  }

  if (!profileLoading && !firestoreProfile && user?.id && !user.id.startsWith('test-') && !user.id.startsWith('DRIVER_TEST_')) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Stack.Screen options={{ title: 'Dashboard', headerShown: false }} />
        <AlertCircle size={64} color={Colors.light.danger} />
        <Text style={styles.errorTitle}>No Profile Found</Text>
        <Text style={styles.errorText}>Please contact admin to set up your driver profile.</Text>
        <Text style={styles.errorSubtext}>UID: {user.id}</Text>
        <TouchableOpacity style={styles.logoutButtonError} onPress={signOut}>
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Dashboard', headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>
              {firestoreProfile?.name || `${profile?.firstName ?? 'Driver'} ${profile?.lastName ?? ''}`}
            </Text>
            {firestoreProfile?.email && (
              <Text style={styles.email}>{firestoreProfile.email}</Text>
            )}
          </View>
          {firestoreProfile?.status && (
            <View style={[styles.statusPill, { backgroundColor: getStatusColor(firestoreProfile.status) + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(firestoreProfile.status) }]} />
              <Text style={[styles.statusText, { color: getStatusColor(firestoreProfile.status) }]}>
                {getStatusLabel(firestoreProfile.status)}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <LogOut size={20} color={Colors.light.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <Text style={styles.walletLabel}>Current Balance</Text>
            <DollarSign size={24} color={Colors.light.success} />
          </View>
          <Text style={styles.walletAmount}>${(stats?.availableBalance ?? profile?.wallet ?? 0).toLocaleString()}</Text>
          <Text style={styles.walletSubtext}>Available for withdrawal</Text>
          {firestoreProfile?.lastActive && (
            <View style={styles.lastActiveContainer}>
              <Clock size={12} color="#FFFFFF" style={{ opacity: 0.8 }} />
              <Text style={styles.lastActiveText}>Last active: {formatLastActive(firestoreProfile.lastActive)}</Text>
            </View>
          )}
        </View>

        <View style={styles.gpsCard}>
          <View style={styles.gpsHeader}>
            <View style={styles.gpsHeaderLeft}>
              <MapPin size={20} color={isTracking ? '#22C55E' : '#EF4444'} />
              <Text style={styles.gpsTitle}>GPS Tracking</Text>
            </View>
            <View style={[styles.gpsStatusBadge, { backgroundColor: isTracking ? '#ECFDF5' : '#FEE2E2' }]}>
              <View style={[styles.gpsStatusDot, { backgroundColor: isTracking ? '#22C55E' : '#EF4444' }]} />
              <Text style={[styles.gpsStatusText, { color: isTracking ? '#059669' : '#DC2626' }]}>
                {isTracking ? 'Tracking Active' : 'Tracking Paused'}
              </Text>
            </View>
          </View>
          {location && (
            <View style={styles.gpsLocationInfo}>
              <View style={styles.gpsLocationRow}>
                <Text style={styles.gpsLocationLabel}>Latitude:</Text>
                <Text style={styles.gpsLocationValue}>{location.latitude.toFixed(4)}°N</Text>
              </View>
              <View style={styles.gpsLocationRow}>
                <Text style={styles.gpsLocationLabel}>Longitude:</Text>
                <Text style={styles.gpsLocationValue}>{location.longitude.toFixed(4)}°W</Text>
              </View>
              <View style={styles.gpsLocationRow}>
                <Text style={styles.gpsLocationLabel}>Last Update:</Text>
                <Text style={styles.gpsLocationValue}>{location.updatedAt.toLocaleTimeString()}</Text>
              </View>
            </View>
          )}
          <View style={styles.gpsFooter}>
            <Radio size={14} color="#6B7280" />
            <Text style={styles.gpsFooterText}>
              Your location is synced to Command Center every 10 seconds
            </Text>
          </View>
        </View>

        <View style={styles.fuelPriceCard}>
          <View style={styles.fuelPriceHeader}>
            <Fuel size={20} color={Colors.light.accent} />
            <Text style={styles.fuelPriceTitle}>💧 Current Diesel Price (Auto-Updated)</Text>
          </View>
          {fuelLoading && dieselPrice === null ? (
            <View style={styles.fuelPriceLoading}>
              <ActivityIndicator size="small" color={Colors.light.accent} />
              <Text style={styles.fuelPriceLoadingText}>Fetching live prices...</Text>
            </View>
          ) : fuelError ? (
            <View style={styles.fuelPriceError}>
              <AlertCircle size={16} color={Colors.light.danger} />
              <Text style={styles.fuelPriceErrorText}>No fuel data found for your region.</Text>
            </View>
          ) : dieselPrice !== null ? (
            <>
              <Text style={styles.fuelPriceValue}>${dieselPrice.toFixed(2)}</Text>
              <Text style={styles.fuelPriceSubtext}>per gallon • Diesel</Text>
              {driverState && (
                <View style={styles.fuelPriceLocationContainer}>
                  <MapPin size={14} color={Colors.light.textSecondary} />
                  <Text style={styles.fuelPriceLocation}>{driverState}</Text>
                </View>
              )}
              {lastFetch && (
                <View style={styles.fuelPriceTimestamp}>
                  <Clock size={12} color={Colors.light.textSecondary} />
                  <Text style={styles.fuelPriceTimestampText}>
                    Updated {formatLastActive(lastFetch.toISOString())}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.fuelPriceError}>
              <AlertCircle size={16} color={Colors.light.danger} />
              <Text style={styles.fuelPriceErrorText}>No fuel data found for your region.</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Overview</Text>
          <View style={styles.analyticsGrid}>
            <View style={styles.analyticsRow}>
              <View style={styles.analyticsCardWrapper}>
                <AnalyticsCard
                  title="Total Earnings"
                  value={`${analytics.totalEarnings.toLocaleString()}`}
                  trend={analytics.trend}
                  trendValue={`+${analytics.trendPercentage}%`}
                  color={Colors.light.success}
                />
              </View>
              <View style={styles.analyticsCardWrapper}>
                <AnalyticsCard
                  title="Avg Rate/Mile"
                  value={`${analytics.avgRatePerMile.toFixed(2)}`}
                  subtitle="per mile"
                  color={Colors.light.primary}
                />
              </View>
            </View>
            <View style={styles.analyticsRow}>
              <View style={styles.analyticsCardWrapper}>
                <AnalyticsCard
                  title="Loads Completed"
                  value={firestoreProfile?.completedLoads ?? analytics.loadsCompleted}
                  icon={<Truck size={18} color={Colors.light.primary} />}
                  color={Colors.light.primary}
                />
              </View>
              <View style={styles.analyticsCardWrapper}>
                <AnalyticsCard
                  title="Avg MPG"
                  value={(firestoreProfile?.avgMPG ?? analytics.avgMpg).toFixed(1)}
                  icon={<Fuel size={18} color={Colors.light.accent} />}
                  color={Colors.light.accent}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => router.push('/(driver)/ai-tools')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: Colors.light.primary + '15' }]}>
                <Settings size={24} color={Colors.light.primary} />
              </View>
              <Text style={styles.quickActionTitle}>AI Tools</Text>
              <Text style={styles.quickActionSubtitle}>Listing Assistant &{"\n"}MatchMaker</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => router.push('/(driver)/increase-revenue')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: Colors.light.success + '15' }]}>
                <LineChart size={24} color={Colors.light.success} />
              </View>
              <Text style={styles.quickActionTitle}>Increase Revenue</Text>
              <Text style={styles.quickActionSubtitle}>Market insights &{"\n"}pricing</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => router.push('/(driver)/advanced-security')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: Colors.light.accent + '15' }]}>
                <Shield size={24} color={Colors.light.accent} />
              </View>
              <Text style={styles.quickActionTitle}>Advanced Security</Text>
              <Text style={styles.quickActionSubtitle}>Protect loads &{"\n"}documents</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => router.push('/(driver)/membership')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: Colors.light.primary + '15' }]}>
                <Award size={24} color={Colors.light.primary} />
              </View>
              <Text style={styles.quickActionTitle}>Membership</Text>
              <Text style={styles.quickActionSubtitle}>Upgrade your plan</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Loads</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeLoads.length}</Text>
            </View>
          </View>
          {activeLoads.length > 0 ? (
            activeLoads.map((load) => <LoadCard key={load.id} load={load} />)
          ) : (
            <View style={styles.emptyState}>
              <Truck size={48} color={Colors.light.textSecondary} />
              <Text style={styles.emptyStateText}>No active loads</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI-Matched Loads</Text>
            <View style={[styles.badge, { backgroundColor: Colors.light.success + '20' }]}>
              <TrendingUp size={12} color={Colors.light.success} />
              <Text style={[styles.badgeText, { color: Colors.light.success }]}>
                {matchedLoads.length}
              </Text>
            </View>
          </View>
          {matchedLoads.slice(0, 3).map((load) => (
            <LoadCard key={load.id} load={load} showAIScore />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    gap: 8,
  },
  headerTextContainer: {
    gap: 2,
  },
  greeting: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  name: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  email: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  logoutButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  walletCard: {
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  walletLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  walletAmount: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  walletSubtext: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  lastActiveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF',
    opacity: 0.6,
  },
  lastActiveText: {
    fontSize: 11,
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  badge: {
    backgroundColor: Colors.light.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.primary,
  },
  analyticsGrid: {
    gap: 12,
  },
  analyticsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  analyticsCardWrapper: {
    flex: 1,
  },
  emptyState: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  errorSubtext: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 8,
    fontFamily: 'monospace' as const,
  },
  logoutButtonError: {
    marginTop: 24,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  gpsCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gpsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  gpsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gpsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  gpsStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  gpsStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  gpsStatusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  gpsLocationInfo: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 10,
  },
  gpsLocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gpsLocationLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: '500' as const,
  },
  gpsLocationValue: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '600' as const,
    fontFamily: 'monospace' as const,
  },
  gpsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  gpsFooterText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  fuelPriceCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.light.accent + '30',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  fuelPriceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  fuelPriceTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
    flex: 1,
  },
  fuelPriceValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.light.accent,
    marginBottom: 4,
  },
  fuelPriceSubtext: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  fuelPriceLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  fuelPriceLocation: {
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: '600' as const,
  },
  fuelPriceTimestamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  fuelPriceTimestampText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  fuelPriceLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  fuelPriceLoadingText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  fuelPriceError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  fuelPriceErrorText: {
    fontSize: 14,
    color: Colors.light.danger,
    flex: 1,
  },
});
