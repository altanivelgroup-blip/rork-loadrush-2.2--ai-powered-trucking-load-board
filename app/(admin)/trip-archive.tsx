import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import useTripArchive from '@/hooks/useTripArchive';
import { MapPin, Clock, Navigation } from 'lucide-react-native';

export default function TripArchiveScreen() {
  const { trips, loading, error } = useTripArchive();

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Completed Trips Archive',
            headerStyle: { backgroundColor: '#0F172A' },
            headerTintColor: '#FFFFFF',
          }}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading trip archive...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Completed Trips Archive',
            headerStyle: { backgroundColor: '#0F172A' },
            headerTintColor: '#FFFFFF',
          }}
        />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Completed Trips Archive',
          headerStyle: { backgroundColor: '#0F172A' },
          headerTintColor: '#FFFFFF',
          headerShown: true,
        }}
      />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Completed Trips Archive</Text>
        <Text style={styles.headerSubtitle}>
          {trips.length} {trips.length === 1 ? 'trip' : 'trips'} completed
        </Text>
      </View>

      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.tripCard}>
            <View style={styles.cardHeader}>
              <View style={styles.driverInfo}>
                <Text style={styles.driverLabel}>Driver ID</Text>
                <Text style={styles.driverId}>{item.driverId}</Text>
              </View>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Completed</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardBody}>
              {item.loadId && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Load ID:</Text>
                  <Text style={styles.infoValue}>{item.loadId}</Text>
                </View>
              )}

              <View style={styles.infoRow}>
                <MapPin size={16} color="#94A3B8" style={styles.icon} />
                <Text style={styles.infoLabel}>Destination:</Text>
                <Text style={styles.infoValue}>
                  {item.destination.lat.toFixed(4)}, {item.destination.lng.toFixed(4)}
                </Text>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Navigation size={16} color="#2563EB" style={styles.icon} />
                  <Text style={styles.statLabel}>Distance</Text>
                  <Text style={styles.statValue}>{item.totalDistance.toFixed(1)} mi</Text>
                </View>

                <View style={styles.statItem}>
                  <Clock size={16} color="#2563EB" style={styles.icon} />
                  <Text style={styles.statLabel}>Duration</Text>
                  <Text style={styles.statValue}>{formatDuration(item.durationMinutes)}</Text>
                </View>
              </View>

              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>Completed:</Text>
                <Text style={styles.dateValue}>{formatDate(item.completedAt)}</Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No completed trips yet</Text>
          </View>
        }
      />
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#E2E8F0',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  listContainer: {
    padding: 16,
  },
  tripCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
    marginBottom: 12,
  },
  driverInfo: {
    flex: 1,
  },
  driverLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 2,
  },
  driverId: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C084FC',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#C084FC',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  cardBody: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  icon: {
    marginRight: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginRight: 8,
  },
  infoValue: {
    fontSize: 14,
    color: '#E2E8F0',
    fontWeight: '500' as const,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#2563EB',
    marginTop: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dateLabel: {
    fontSize: 13,
    color: '#94A3B8',
    marginRight: 8,
  },
  dateValue: {
    fontSize: 13,
    color: '#E2E8F0',
    fontWeight: '500' as const,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#94A3B8',
  },
});
