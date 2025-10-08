import { Tabs } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutDashboard, Package, BarChart3, User, PlusCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';

const CustomHeader = ({ title, tagline }: { title: string; tagline?: string }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.headerContainer, { paddingTop: insets.top + 4 }]}>
      <View style={styles.badgeContainer}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>DRIVER</Text>
        </View>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      {tagline ? (
        <Text style={styles.headerTagline}>{tagline}</Text>
      ) : (
        <Text style={styles.headerSubtitle}>Driver Portal</Text>
      )}
    </View>
  );
};

export default function DriverLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTransparent: false, // ✅ restores solid header base (fixes overlap)
        headerTitle: () => null,
        headerStyle: {
          backgroundColor: '#FFFFFF',
          height: 90,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarStyle: {
          backgroundColor: Colors.light.cardBackground,
          borderTopColor: Colors.light.border,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom - 2 : 6,
        },
        tabBarActiveTintColor: Colors.light.primary,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          header: () => <CustomHeader title="Dashboard" />,
          tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tabs.Screen
        name="loads"
        options={{
          header: () => <CustomHeader title="Available Loads" />,
          tabBarIcon: ({ color }) => <Package size={24} color={color} />,
          tabBarLabel: 'Loads',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          header: () => <CustomHeader title="Profile" />,
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
          tabBarLabel: 'Profile',
        }}
      />
      <Tabs.Screen name="service-finder" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="maintenance" options={{ href: null }} />
      <Tabs.Screen name="wallet" options={{ href: null }} />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="analytics" options={{ href: null }} />
      <Tabs.Screen name="add-vehicle" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="membership" options={{ href: null }} />
      <Tabs.Screen name="documents" options={{ href: null }} />
      <Tabs.Screen name="privacy" options={{ href: null }} />
      <Tabs.Screen name="payment-methods" options={{ href: null }} />
      <Tabs.Screen name="terms-of-service" options={{ href: null }} />
      <Tabs.Screen name="how-we-use-data" options={{ href: null }} />
      <Tabs.Screen name="help-support" options={{ href: null }} />
      <Tabs.Screen name="load-details" options={{ href: null }} />
      <Tabs.Screen name="ai-tools" options={{ href: null }} />
      <Tabs.Screen name="increase-revenue" options={{ href: null }} />
      <Tabs.Screen name="advanced-security" options={{ href: null }} />
      <Tabs.Screen name="navigation-screen" options={{ href: null }} />
      <Tabs.Screen name="map-screen" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0A0A0A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 2,
  },
  headerTagline: {
    fontSize: 15,
    fontWeight: '400',
    color: '#6B7280',
    marginTop: 4,
    marginLeft: 2,
  },
});

