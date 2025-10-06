import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { DriverProfile } from '@/types';
import { useRouter } from 'expo-router';
import { useDriverProfile, useDriverStats } from '@/hooks/useDriverData';

import { 
  User, 
  Truck, 
  Wrench, 
  Wallet, 
  Crown, 
  Bell, 
  FileText, 
  Settings, 
  LogOut,
  ChevronRight,
  Edit,
  CreditCard
} from 'lucide-react-native';

function DriverProfileScreenInner() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const router = useRouter();
  
  const { profile: firestoreProfile, loading: profileLoading } = useDriverProfile();
  const { stats, loading: statsLoading } = useDriverStats();
  
  const profile = firestoreProfile || (user?.profile as DriverProfile | undefined);
  const availableBalance = stats?.availableBalance ?? 20463.24;
  const totalEarnings = stats?.totalEarnings ?? 30607.27;
  
  const isLoading = profileLoading || statsLoading;

  const truckType = useMemo(() => {
    const make = profile?.truckInfo?.make ?? 'TRUCK';
    try {
      return String(make).toUpperCase();
    } catch (e) {
      console.log('[DriverProfile] truckType uppercase error', e);
      return 'TRUCK';
    }
  }, [profile?.truckInfo?.make]);

  const yearsExperience = useMemo(() => {
    const year = profile?.truckInfo?.year;
    const now = new Date().getFullYear();
    if (typeof year === 'number' && year > 1900 && year <= now) {
      return Math.max(0, now - year);
    }
    return 0;
  }, [profile?.truckInfo?.year]);

  const onItemPress = useCallback((key: string) => {
    console.log(`[DriverProfile] menu press: ${key}`);
    if (key === 'Edit Profile') {
      try {
        router.push('/(driver)/edit-profile');
        return;
      } catch (e) {
        console.log('[DriverProfile] navigation error', e);
      }
    }
    if (key === 'Add Vehicle') {
      try {
        router.push('/(driver)/add-vehicle');
        return;
      } catch (e) {
        console.log('[DriverProfile] navigation error', e);
      }
    }
    if (key === 'Wallet') {
      try {
        router.push('/(driver)/wallet');
        return;
      } catch (e) {
        console.log('[DriverProfile] navigation error', e);
      }
    }
    if (key === 'Equipment & Maintenance') {
      try {
        router.push('/(driver)/maintenance');
        return;
      } catch (e) {
        console.log('[DriverProfile] navigation error', e);
      }
    }
    if (key === 'Notifications') {
      try {
        router.push('/(driver)/notifications');
        return;
      } catch (e) {
        console.log('[DriverProfile] navigation error', e);
      }
    }
    if (key === 'Documents') {
      try {
        router.push('/(driver)/documents');
        return;
      } catch (e) {
        console.log('[DriverProfile] navigation error', e);
      }
    }
    if (key === 'Settings') {
      try {
        router.push('/(driver)/settings');
        return;
      } catch (e) {
        console.log('[DriverProfile] navigation error', e);
      }
    }
    if (key === 'Payment Methods') {
      try {
        router.push('/(driver)/payment-methods');
        return;
      } catch (e) {
        console.log('[DriverProfile] navigation error', e);
      }
    }
    if (key === 'Membership') {
      try {
        router.push('/(driver)/membership');
        return;
      } catch (e) {
        console.log('[DriverProfile] navigation error', e);
      }
    }
    Alert.alert(key, 'This screen will be wired to the form or feature next.');
  }, [router]);

  const onSignOut = useCallback(() => {
    console.log('[DriverProfile] sign out pressed');
    signOut?.();
  }, [signOut]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="driverProfileContainer">
      <View style={[styles.topHeader, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.topHeaderTitle}>DRIVER PROFILE</Text>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        testID="driverProfileScroll"
      >
        <View style={styles.headerSection} testID="profileHeader">
          <View style={styles.avatarContainer} accessibilityLabel="Avatar">
            <User size={32} color="#fff" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileRole}>{profile?.firstName ?? 'DRIVER'} {profile?.lastName ?? ''}</Text>
            <Text style={styles.profileEmail}>{user?.email ?? 'driver@example.com'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{stats?.status?.toUpperCase() ?? 'ACTIVE'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.dashboardSection} testID="liveDashboard">
          <View style={styles.dashboardHeader}>
            <Text style={styles.dashboardTitle}>Live Dashboard</Text>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard} testID="stat-available-balance">
              <Text style={styles.statValue}>{availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              <Text style={styles.statLabel}>Available{'\n'}Balance</Text>
            </View>
            <View style={styles.statCard} testID="stat-total-earnings">
              <Text style={styles.statValue}>{totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              <Text style={styles.statLabel}>Total Earnings</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard} testID="stat-truck-type">
              <Text style={styles.statValueBlue}>{truckType}</Text>
              <Text style={styles.statLabel}>Truck Type</Text>
            </View>
            <View style={styles.statCard} testID="stat-years-exp">
              <Text style={styles.statValue}>{yearsExperience}</Text>
              <Text style={styles.statLabel}>Years{'\n'}Experience</Text>
            </View>
          </View>
        </View>

        <View style={styles.menuSection} testID="menuSection">
          <TouchableOpacity style={styles.menuItem} onPress={() => onItemPress('Edit Profile')} testID="menu-edit-profile" accessibilityRole="button">
            <View style={[styles.menuIconContainer, { backgroundColor: '#E8F0FE' }]}>
              <Edit size={20} color="#4285F4" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Edit Profile</Text>
              <Text style={styles.menuSubtitle}>Personal info, vehicle, MPG, VIN, plate</Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => onItemPress('Add Vehicle')} testID="menu-add-vehicle" accessibilityRole="button">
            <View style={[styles.menuIconContainer, { backgroundColor: '#E3F2FD' }]}>
              <Truck size={20} color="#2196F3" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Add Vehicle</Text>
              <Text style={styles.menuSubtitle}>Set MPG and details</Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => onItemPress('Equipment & Maintenance')} testID="menu-maintenance" accessibilityRole="button">
            <View style={[styles.menuIconContainer, { backgroundColor: '#FFF3E0' }]}>
              <Wrench size={20} color="#FF9800" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Equipment & Maintenance</Text>
              <Text style={styles.menuSubtitle}>Trucks, trailers, service schedule</Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => onItemPress('Wallet')} testID="menu-wallet" accessibilityRole="button">
            <View style={[styles.menuIconContainer, { backgroundColor: '#E8F5E9' }]}>
              <Wallet size={20} color="#4CAF50" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Wallet</Text>
              <Text style={styles.menuSubtitle}>Balance, earnings, and payouts</Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => onItemPress('Membership')} testID="menu-membership" accessibilityRole="button">
            <View style={[styles.menuIconContainer, { backgroundColor: '#FFF8E1' }]}>
              <Crown size={20} color="#FFC107" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Membership</Text>
              <Text style={styles.menuSubtitle}>Upgrade for AI features</Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => onItemPress('Notifications')} testID="menu-notifications" accessibilityRole="button">
            <View style={[styles.menuIconContainer, { backgroundColor: '#E3F2FD' }]}>
              <Bell size={20} color="#2196F3" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Notifications</Text>
              <Text style={styles.menuSubtitle}>Manage your preferences</Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => onItemPress('Documents')} testID="menu-documents" accessibilityRole="button">
            <View style={[styles.menuIconContainer, { backgroundColor: '#F3E5F5' }]}>
              <FileText size={20} color="#9C27B0" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Documents</Text>
              <Text style={styles.menuSubtitle}>Manage your documents</Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => onItemPress('Payment Methods')} testID="menu-payment-methods" accessibilityRole="button">
            <View style={[styles.menuIconContainer, { backgroundColor: '#E8F5E9' }]}>
              <CreditCard size={20} color="#4CAF50" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Payment Methods</Text>
              <Text style={styles.menuSubtitle}>Manage cards, bank accounts, and services</Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => onItemPress('Settings')} testID="menu-settings" accessibilityRole="button">
            <View style={[styles.menuIconContainer, { backgroundColor: '#ECEFF1' }]}>
              <Settings size={20} color="#607D8B" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Settings</Text>
              <Text style={styles.menuSubtitle}>App preferences and more</Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItemLast} onPress={onSignOut} testID="menu-sign-out" accessibilityRole="button">
            <View style={[styles.menuIconContainer, { backgroundColor: '#FFEBEE' }]}>
              <LogOut size={20} color="#F44336" />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: '#F44336' }]}>Sign Out</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText} accessibilityLabel={`Version ${'LoadRush v1.0.0'}`}>LoadRush v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const DriverProfileScreen = React.memo(DriverProfileScreenInner);
export default DriverProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  topHeaderTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileRole: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  roleBadge: {
    backgroundColor: '#2563EB',
    borderWidth: 1.5,
    borderColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 0.5,
  },
  dashboardSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  dashboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dashboardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1F2937',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#10B981',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 6,
  },
  statValueBlue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#2563EB',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 14,
  },
  menuSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  versionText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
});
