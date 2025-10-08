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
      {/* 🚫 Remove automatic header space */}
      <Stack.Screen
        options={{
          headerShown: false,
          title: '',
          headerTitle: '',
          headerTransparent: true,
          contentStyle: { paddingTop: 0, marginTop: 0 },
        }}
      />

      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.light.primary,
          headerShown: true,
          headerTransparent: true,
          headerStyle: {
            height: 64, // tightened header height
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
          headerTitle: () => null,
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
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 0, // removed extra top padding
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
