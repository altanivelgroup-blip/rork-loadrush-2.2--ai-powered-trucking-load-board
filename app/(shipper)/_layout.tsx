import { Stack, Tabs } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LayoutDashboard, Package, BarChart3, User, PlusCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';

const CustomHeader = ({ title, tagline }: { title: string; tagline?: string }) => (
  <View style={styles.headerContainer}>
    <View style={styles.badgeContainer}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>SHIPPER</Text>
      </View>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
    {tagline ? (
      <Text style={styles.headerTagline}>{tagline}</Text>
    ) : (
      <Text style={styles.headerSubtitle}>Shipper Portal</Text>
    )}
  </View>
);

export default function ShipperLayout() {
  return (
    <>
      {/* 🚫 Removes the automatic "(shipper)" label */}
      <Stack.Screen options={{ headerShown: false, title: '', headerTitle: '' }} />

      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.light.primary,
          headerShown: true,
          title: '',
          headerTitle: () => null,
          headerTitleStyle: { opacity: 0 },
          headerStyle: {
            backgroundColor: '#FFFFFF',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
          },
          tabBarStyle: {
            backgroundColor: Colors.light.cardBackground,
            borderTopColor: Colors.light.border,
          },
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

        {/* Hidden / auxiliary routes */}
        <Tabs.Screen
          name="ai-tools"
          options={{
            href: null,
            header: () => <CustomHeader title="AI-Powered Tools" />,
          }}
        />
        <Tabs.Screen
          name="increase-revenue"
          options={{
            href: null,
            header: () => <CustomHeader title="Increase Revenue" />,
          }}
        />
        <Tabs.Screen
          name="advanced-security"
          options={{
            href: null,
            header: () => <CustomHeader title="Advanced Security" />,
          }}
        />
        <Tabs.Screen
          name="membership"
          options={{
            href: null,
            header: () => <CustomHeader title="Membership Plans" />,
          }}
        />
        <Tabs.Screen
          name="post-single-load"
          options={{
            href: null,
            header: () => <CustomHeader title="Post Single Load" />,
          }}
        />
        <Tabs.Screen
          name="bulk-upload"
          options={{
            href: null,
            header: () => <CustomHeader title="Bulk Upload Loads" />,
          }}
        />
        <Tabs.Screen
          name="load-templates"
          options={{
            href: null,
            header: () => <CustomHeader title="Load Templates" />,
          }}
        />
        <Tabs.Screen
          name="secure-docs-shipper"
          options={{
            href: null,
            header: () => <CustomHeader title="Secure Document Manager" />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            href: null,
            header: () => <CustomHeader title="Settings" />,
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    backgroundColor: '#2563EB',
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

