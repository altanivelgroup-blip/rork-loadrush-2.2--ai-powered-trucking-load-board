import { Tabs } from 'expo-router';
import React from 'react';
import { LayoutDashboard, Truck, User } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function DriverLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.primary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.light.cardBackground,
          borderTopColor: Colors.light.border,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="loads"
        options={{
          title: 'Loads',
          tabBarIcon: ({ color }) => <Truck size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="service-finder"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="maintenance"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="edit-profile"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="add-vehicle"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="membership"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="privacy"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="payment-methods"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="terms-of-service"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="how-we-use-data"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="help-support"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="load-details"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="advanced-security"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="ai-tools"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="increase-revenue"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
