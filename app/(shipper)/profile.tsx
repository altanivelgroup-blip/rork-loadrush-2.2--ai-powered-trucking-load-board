import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { ShipperProfile } from '@/types';
import Colors from '@/constants/colors';
import { 
  Building2, 
  LogOut, 
  Settings, 
  TrendingUp, 
  Shield, 
  Crown,
  DollarSign,
  Package,
  CheckCircle,
  ChevronRight,
  BarChart3,
  Star,
  Wallet,
  Map
} from 'lucide-react-native';

export default function ShipperProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut, loading, updateProfile } = useAuth();
  const profile = user?.profile as ShipperProfile | undefined;
  const { width: windowWidth } = useWindowDimensions();
  const isTabletOrLarger = windowWidth >= 768;
  
  const analyticsData = useMemo(() => {
    console.log('[Profile] Calculating analytics data for shipper:', user?.id);
    
    const loadsPosted = 1325;
    const loadsAccepted = 1093;
    const activeLoads = 232;
    const totalSpend = 450278;
    const avgRating = 4.7;

    return {
      totalLoadsPosted: loadsPosted,
      activeLoads: activeLoads,
      completedLoads: loadsAccepted,
      totalSpend: totalSpend,
      averageRating: avgRating,
    };
  }, [user?.id]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<ShipperProfile>({
    companyName: profile?.companyName || '',
    contactName: profile?.contactName || '',
    phone: profile?.phone || '',
    email: profile?.email || user?.email || '',
    address: profile?.address || '',
    paymentMethod: profile?.paymentMethod || 'Net 30',
    creditLimit: profile?.creditLimit || 0,
  });
  
  React.useEffect(() => {
    if (profile) {
      setEditedProfile({
        companyName: profile.companyName || '',
        contactName: profile.contactName || '',
        phone: profile.phone || '',
        email: profile.email || user?.email || '',
        address: profile.address || '',
        paymentMethod: profile.paymentMethod || 'Net 30',
        creditLimit: profile.creditLimit || 0,
      });
    }
  }, [profile, user?.email]);
  
  const handleSave = async () => {
    try {
      await updateProfile(editedProfile);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
      console.error('Profile update error:', error);
    }
  };
  
  const handleCancel = () => {
    setEditedProfile({
      companyName: profile?.companyName || '',
      contactName: profile?.contactName || '',
      phone: profile?.phone || '',
      email: profile?.email || user?.email || '',
      address: profile?.address || '',
      paymentMethod: profile?.paymentMethod || '',
      creditLimit: profile?.creditLimit || 0,
    });
    setIsEditing(false);
  };

  console.log('Edit mode:', isEditing, 'Save handler:', handleSave, 'Cancel handler:', handleCancel);

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (!user || !profile) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Profile not found</Text>
        <TouchableOpacity style={styles.signOutButtonAlt} onPress={signOut}>
          <LogOut size={20} color={Colors.light.danger} />
          <Text style={styles.signOutTextAlt}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Building2 size={32} color="#fff" />
          </View>
          <Text style={styles.roleLabel}>SHIPPER</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>SHIPPER</Text>
            </View>
            <Text style={styles.companyName}>{profile?.companyName || 'Company Name'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Company Information</Text>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Company Name</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={editedProfile.companyName}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, companyName: text })}
                  placeholder="Enter company name"
                  placeholderTextColor="#9CA3AF"
                />
              ) : (
                <View style={styles.inputField}>
                  <Text style={styles.inputValue}>{profile?.companyName || 'Not set'}</Text>
                </View>
              )}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Business Address</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={editedProfile.address}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, address: text })}
                  placeholder="Enter business address"
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
              ) : (
                <View style={styles.inputField}>
                  <Text style={styles.inputValue}>{profile?.address || 'Not set'}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contact Name</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={editedProfile.contactName}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, contactName: text })}
                  placeholder="Enter contact name"
                  placeholderTextColor="#9CA3AF"
                />
              ) : (
                <View style={styles.inputField}>
                  <Text style={styles.inputValue}>{profile?.contactName || 'Not set'}</Text>
                </View>
              )}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputField}>
                <Text style={styles.inputValue}>{user?.email}</Text>
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={editedProfile.phone}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, phone: text })}
                  placeholder="Enter phone number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                />
              ) : (
                <View style={styles.inputField}>
                  <Text style={styles.inputValue}>{profile?.phone || 'Not set'}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => router.push('/(shipper)/ai-tools')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#E3F2FD' }]}>
                <Settings size={24} color="#2196F3" />
              </View>
              <Text style={styles.quickActionTitle}>AI Tools</Text>
              <Text style={styles.quickActionSubtitle}>Listing Assistant &{"\n"}MatchMaker</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => router.push('/(shipper)/increase-revenue')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#E8F5E9' }]}>
                <TrendingUp size={24} color="#4CAF50" />
              </View>
              <Text style={styles.quickActionTitle}>Increase Revenue</Text>
              <Text style={styles.quickActionSubtitle}>Market insights &{"\n"}pricing</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => router.push('/(shipper)/advanced-security')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#FFF3E0' }]}>
                <Shield size={24} color="#FF9800" />
              </View>
              <Text style={styles.quickActionTitle}>Advanced Security</Text>
              <Text style={styles.quickActionSubtitle}>Protect loads &{"\n"}documents</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => router.push('/(shipper)/membership')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#F3E5F5' }]}>
                <Crown size={24} color="#9C27B0" />
              </View>
              <Text style={styles.quickActionTitle}>Membership</Text>
              <Text style={styles.quickActionSubtitle}>Upgrade your plan</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wallet & Expenses</Text>
          <View style={styles.card}>
            <View style={styles.walletHeader}>
              <DollarSign size={20} color="#4CAF50" />
              <Text style={styles.walletLabel}>Available Balance</Text>
            </View>
            <Text style={styles.walletBalance}>$-26.14</Text>
            
            <View style={styles.expenseRow}>
              <Text style={styles.expenseLabel}>Total Spent</Text>
              <Text style={styles.expenseValue}>$1526.14</Text>
            </View>
            <View style={styles.expenseRow}>
              <Text style={styles.expenseLabel}>Load Posting Fees</Text>
              <Text style={[styles.expenseValue, { color: '#f44336' }]}>-$915.68</Text>
            </View>
            <View style={styles.expenseRow}>
              <Text style={styles.expenseLabel}>Platform Fees</Text>
              <Text style={[styles.expenseValue, { color: '#f44336' }]}>-$610.46</Text>
            </View>
            <View style={styles.expenseRow}>
              <Text style={styles.expenseLabel}>Pending Charges</Text>
              <Text style={styles.expenseValue}>$152.61</Text>
            </View>
            
            <View style={styles.walletButtons}>
              <TouchableOpacity style={styles.viewWalletButton}>
                <Text style={styles.viewWalletText}>View Wallet</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.analyticsButton}
                onPress={() => router.push('/(shipper)/analytics')}
              >
                <TrendingUp size={16} color={Colors.light.primary} />
                <Text style={styles.analyticsButtonText}>Analytics</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Posted Loads History</Text>
          <View style={styles.card}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Package size={24} color={Colors.light.primary} />
                <Text style={styles.statValue}>{analyticsData.totalLoadsPosted.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Total Posted</Text>
              </View>
              <View style={styles.statItem}>
                <TrendingUp size={24} color="#4CAF50" />
                <Text style={styles.statValue}>{analyticsData.activeLoads.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
              <View style={styles.statItem}>
                <CheckCircle size={24} color="#FF9800" />
                <Text style={styles.statValue}>{analyticsData.completedLoads.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.card}>
            <Text style={styles.activityText}>Last load posted: 2 hours ago</Text>
            <Text style={styles.activityText}>Average views per load: 34</Text>
            <Text style={styles.activityText}>Success rate: 96%</Text>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.primaryActionButton}
                onPress={() => router.push('/(shipper)/loads')}
              >
                <Text style={styles.primaryActionText}>View My Loads</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryActionButton}>
                <Text style={styles.secondaryActionText}>Post New Load</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <TouchableOpacity 
            style={styles.settingsCard}
            onPress={() => router.push('/(shipper)/settings')}
          >
            <View style={styles.settingsLeft}>
              <View style={[styles.settingsIcon, { backgroundColor: '#F3F4F6' }]}>
                <Settings size={20} color={Colors.light.text} />
              </View>
              <View style={styles.settingsTextContainer}>
                <Text style={styles.settingsLabel}>Settings</Text>
                <Text style={styles.settingsDescription}>App preferences and more</Text>
              </View>
            </View>
            <ChevronRight size={20} color={Colors.light.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Overview</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>{analyticsData.totalLoadsPosted.toLocaleString()}</Text>
              <Text style={styles.overviewLabel}>Total Loads Posted</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>{analyticsData.activeLoads.toLocaleString()}</Text>
              <Text style={styles.overviewLabel}>Active Loads</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>${analyticsData.totalSpend.toLocaleString()}</Text>
              <Text style={styles.overviewLabel}>Total Expenses</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>{analyticsData.averageRating.toFixed(1)}</Text>
              <Text style={styles.overviewLabel}>Average Rating</Text>
            </View>
          </View>
          
          <View style={styles.overviewActionsGrid}>
            <TouchableOpacity
              style={[
                styles.overviewActionButtonWrapper,
                isTabletOrLarger ? styles.overviewActionButtonWrapperTablet : styles.overviewActionButtonWrapperMobile,
              ]}
              onPress={() => {
                console.log('[Profile] Navigating to Analytics - Load Performance');
                router.push('/(shipper)/analytics');
              }}
              activeOpacity={0.7}
            >
              <View style={styles.overviewActionButton}>
                <BarChart3 size={20} color="#fff" />
                <Text style={styles.overviewActionText} numberOfLines={1}>View Load Performance</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.overviewActionButtonWrapper,
                isTabletOrLarger ? styles.overviewActionButtonWrapperTablet : styles.overviewActionButtonWrapperMobile,
              ]}
              onPress={() => {
                console.log('[Profile] Navigating to Analytics - Driver Ratings');
                router.push('/(shipper)/analytics');
              }}
              activeOpacity={0.7}
            >
              <View style={styles.overviewActionButton}>
                <Star size={20} color="#fff" />
                <Text style={styles.overviewActionText} numberOfLines={1}>View Driver Ratings</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.overviewActionButtonWrapper,
                isTabletOrLarger ? styles.overviewActionButtonWrapperTablet : styles.overviewActionButtonWrapperMobile,
              ]}
              onPress={() => {
                console.log('[Profile] Navigating to Analytics - Expense Breakdown');
                router.push('/(shipper)/analytics');
              }}
              activeOpacity={0.7}
            >
              <View style={styles.overviewActionButton}>
                <Wallet size={20} color="#fff" />
                <Text style={styles.overviewActionText} numberOfLines={1}>View Expense Breakdown</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.overviewActionButtonWrapper,
                isTabletOrLarger ? styles.overviewActionButtonWrapperTablet : styles.overviewActionButtonWrapperMobile,
              ]}
              onPress={() => {
                console.log('[Profile] Navigating to Analytics - Route Insights');
                router.push('/(shipper)/analytics');
              }}
              activeOpacity={0.7}
            >
              <View style={styles.overviewActionButton}>
                <Map size={20} color="#fff" />
                <Text style={styles.overviewActionText} numberOfLines={1}>View Route Insights</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.signOutButtonBottom}
            onPress={signOut}
            activeOpacity={0.7}
          >
            <LogOut size={20} color="#fff" />
            <Text style={styles.signOutButtonBottomText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginBottom: 20,
  },

  signOutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#EF4444',
  },
  signOutButtonAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.danger + '40',
  },
  signOutTextAlt: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.danger,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  roleLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 12,
  },
  badgeContainer: {
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#2563EB',
    borderWidth: 1.5,
    borderColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#fff',
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#2563EB',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#2563EB',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#6B7280',
    marginBottom: 8,
  },
  inputField: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputValue: {
    fontSize: 14,
    color: Colors.light.text,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
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
    lineHeight: 16,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  walletLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#6B7280',
  },
  walletBalance: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#4CAF50',
    marginBottom: 16,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  expenseLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  expenseValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  walletButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  viewWalletButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewWalletText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  analyticsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#2563EB',
  },
  analyticsButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#2563EB',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  activityText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  primaryActionButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderWidth: 1.5,
    borderColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  secondaryActionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#2563EB',
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#2563EB',
  },
  settingsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsTextContainer: {
    flex: 1,
  },
  settingsLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 2,
  },
  settingsDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  overviewCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#2563EB',
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  overviewActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  overviewActionButtonWrapper: {
    marginVertical: 6,
    marginHorizontal: 0,
  },
  overviewActionButtonWrapperMobile: {
    flexBasis: '48%',
  },
  overviewActionButtonWrapperTablet: {
    flexBasis: '23%',
  },
  overviewActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 10,
    minHeight: 60,
    maxHeight: 70,
  },
  overviewActionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    textAlign: 'center',
    maxWidth: '95%',
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#6B7280',
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    borderWidth: 1.5,
    borderColor: '#2563EB',
  },
  saveText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#fff',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#2563EB',
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#2563EB',
    fontSize: 14,
    color: Colors.light.text,
  },
  signOutButtonBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  signOutButtonBottomText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
