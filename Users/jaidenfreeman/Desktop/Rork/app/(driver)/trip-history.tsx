import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTripHistory } from '../../hooks/useTripHistory';
import { History } from 'lucide-react-native';

export default function TripHistoryScreen() {
  const insets = useSafeAreaInsets();
  const driverId = 'driver-001';
  const { trips, loading, error } = useTripHistory(driverId);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDistance = (miles: number) => {
    return `${miles.toFixed(1)} mi`;
  };

  const getDestinationText = (destination: { lat: number; lng: number; address?: string }) => {
    if (destination.address) {
      return destination.address;
    }
    return `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`;
  };

  const renderTripCard = ({ item }: { item: any; index: number }) => {
    return (
      <View style={styles.tripCard}>
        <View style={styles.cardHeader}>
          <View style={styles.loadIdContainer}>
            <Text style={styles.loadIdLabel}>🗺️</Text>
            <Text style={styles.loadId}>{item.loadId}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>🟣 Completed</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📍 Destination</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {getDestinationText(item.destination)}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>⏱️ Duration</Text>
              <Text style={styles.statValue}>{formatDuration(item.durationMinutes)}</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statLabel}>🛣️ Distance</Text>
              <Text style={styles.statValue}>{formatDistance(item.totalDistance)}</Text>
            </View>
          </View>

          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>📆 Completed</Text>
            <Text style={styles.dateValue}>{formatDate(item.completedAt)}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen
          options={{
            title: 'Trip History',
            headerStyle: { backgroundColor: '#0F172A' },
            headerTintColor: '#FFFFFF',
          }}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading trip history...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen
          options={{
            title: 'Trip History',
            headerStyle: { backgroundColor: '#0F172A' },
            headerTintColor: '#FFFFFF',
          }}
        />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          title: 'Trip History',
          headerStyle: { backgroundColor: '#0F172A' },
          headerTintColor: '#FFFFFF',
        }}
      />

      {trips.length === 0 ? (
        <View style={styles.centerContainer}>
          <History size={64} color="#64748B" />
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.emptySubtitle}>
            Your completed trips will appear here
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Your Completed Trips</Text>
            <Text style={styles.headerSubtitle}>{trips.length} total trips</Text>
          </View>

          <FlatList
            data={trips}
            renderItem={renderTripCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#94A3B8',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#E2E8F0',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
  },
  tripCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadIdLabel: {
    fontSize: 18,
  },
  loadId: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#2563EB',
  },
  statusBadge: {
    backgroundColor: 'rgba(192, 132, 252, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#C084FC',
  },
  cardBody: {
    gap: 12,
  },
  infoRow: {
    gap: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500' as const,
  },
  infoValue: {
    fontSize: 15,
    color: '#E2E8F0',
    fontWeight: '600' as const,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  statItem: {
    flex: 1,
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 12,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500' as const,
  },
  statValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  dateLabel: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500' as const,
  },
  dateValue: {
    fontSize: 13,
    color: '#E2E8F0',
    fontWeight: '600' as const,
  },
});
