import { Tabs } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutDashboard, Package, BarChart3, User, PlusCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';

const CustomHeader = ({ title, tagline }: { title: string; tagline?: string }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.headerContainer, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.headerTitle}>{title}</Text>
      {tagline && (
        <Text style={styles.headerTagline}>{tagline}</Text>
      )}
    </View>
  );
};

export default function ShipperLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTransparent: false, // solid header background
        headerTitle: () => null,
        headerStyle: {
          backgroundColor: '#FFFFFF',
          height: 100,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
          elevation: 0,
          shadowOpacity: 0,
          position: 'relative', // ✅ ensures layout spacing is respected
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
          header: () => <CustomHeader title="Dashboard Overview" />,
          tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tabs.Screen
        name="loads"
        options={{
          header: () => <CustomHeader title="My Loads" />,
          tabBarIcon: ({ color }) => <Package size={24} color={color} />,
          tabBarLabel: 'My Loads',
        }}
      />
      <Tabs.Screen
        name="post-loads"
        options={{
          header: () => <CustomHeader title="Post & Manage Loads" />,
          tabBarIcon: ({ color }) => <PlusCircle size={24} color={color} />,
          tabBarLabel: 'Post Loads',
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          header: () => (
            <CustomHeader
              title="Analytics Dashboard"
              tagline="Track performance, optimize spend, and improve delivery reliability."
            />
          ),
          tabBarIcon: ({ color }) => <BarChart3 size={24} color={color} />,
          tabBarLabel: 'Analytics',
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

      <Tabs.Screen name="post-single-load" options={{ href: null }} />
      <Tabs.Screen name="bulk-upload" options={{ href: null }} />
      <Tabs.Screen name="load-templates" options={{ href: null }} />
      <Tabs.Screen name="secure-docs-shipper" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="ai-tools" options={{ href: null }} />
      <Tabs.Screen name="increase-revenue" options={{ href: null }} />
      <Tabs.Screen name="advanced-security" options={{ href: null }} />
      <Tabs.Screen name="membership" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0A0A0A',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  headerTagline: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    marginTop: 2,
  },
});
