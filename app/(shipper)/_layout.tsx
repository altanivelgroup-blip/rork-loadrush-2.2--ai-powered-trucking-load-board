import { Stack } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';

const CustomHeader = ({ title, tagline }: { title: string; tagline?: string }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.headerContainer, { paddingTop: insets.top + 6 }]}>
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
};

export default function ShipperLayout() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          title: '',
          headerTransparent: true,
          contentStyle: { paddingTop: 0, marginTop: 0 },
        }}
      />

      <Stack
        screenOptions={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: () => null,
          headerStyle: {
            backgroundColor: '#FFFFFF',
            height: 80,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
          },
        }}
      >
        <Stack.Screen
          name="dashboard"
          options={{
            header: () => <CustomHeader title="Dashboard Overview" />,
          }}
        />
        <Stack.Screen
          name="loads"
          options={{
            header: () => <CustomHeader title="My Loads" />,
          }}
        />
        <Stack.Screen
          name="post-loads"
          options={{
            header: () => <CustomHeader title="Post & Manage Loads" />,
          }}
        />
        <Stack.Screen
          name="analytics"
          options={{
            header: () => (
              <CustomHeader
                title="Analytics Dashboard"
                tagline="Track performance, optimize spend, and improve delivery reliability."
              />
            ),
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            header: () => <CustomHeader title="Profile" />,
          }}
        />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flex: 1,
    justifyContent: 'center',
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
