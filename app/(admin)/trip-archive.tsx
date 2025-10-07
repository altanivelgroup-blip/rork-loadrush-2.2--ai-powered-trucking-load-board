import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Stack } from 'expo-router';
import useTripArchive from '@/hooks/useTripArchive';
import { MapPin, Clock, Navigation, ChevronDown } from 'lucide-react-native';

type FilterType = 'all' | 'last7' | 'last30' | 'topDrivers';
type SortType = 'recent' | 'distance' | 'fastest';

export default function TripArchiveScreen() {
  const { trips, loading, error } = useTripArchive();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('recent');
  const [showSortMenu, setShowSortMenu] = useState(false);

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

  const filteredAndSortedTrips = useMemo(() => {
    let filtered = [...trips];
    const now = new Date();

    switch (activeFilter) {
      case 'last7':
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((trip) => {
          const tripDate = trip.completedAt.toDate ? trip.completedAt.toDate() : trip.completedAt;
          const date = tripDate instanceof Date ? tripDate : new Date(tripDate as any);
          return date >= sevenDaysAgo;
        });
        break;
      case 'last30':
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((trip) => {
          const tripDate = trip.completedAt.toDate ? trip.completedAt.toDate() : trip.completedAt;
          const date = tripDate instanceof Date ? tripDate : new Date(tripDate as any);
          return date >= thirtyDaysAgo;
        });
        break;
      case 'topDrivers':
        const driverStats = new Map<string, { count: number; totalDistance: number }>();
        trips.forEach((trip) => {
          const stats = driverStats.get(trip.driverId) || { count: 0, totalDistance: 0 };
          stats.count++;
          stats.totalDistance += trip.totalDistance;
          driverStats.set(trip.driverId, stats);
        });
        const topDriverIds = Array.from(driverStats.entries())
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 5)
          .map(([driverId]) => driverId);
        filtered = filtered.filter((trip) => topDriverIds.includes(trip.driverId));
        break;
    }

    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => {
          const dateA = a.completedAt.toDate ? a.completedAt.toDate() : a.completedAt;
          const dateB = b.completedAt.toDate ? b.completedAt.toDate() : b.completedAt;
          const timeA = dateA instanceof Date ? dateA.getTime() : new Date(dateA as any).getTime();
          const timeB = dateB instanceof Date ? dateB.getTime() : new Date(dateB as any).getTime();
          return timeB - timeA;
        });
        break;
      case 'distance':
        filtered.sort((a, b) => b.totalDistance - a.totalDistance);
        break;
      case 'fastest':
        filtered.sort((a, b) => a.durationMinutes - b.durationMinutes);
        break;
    }

    return filtered;
  }, [trips, activeFilter, sortBy]);

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
          {filteredAndSortedTrips.length} {filteredAndSortedTrips.length === 1 ? 'trip' : 'trips'} shown
        </Text>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
          <TouchableOpacity
            style={[styles.filterButton, activeFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.filterButtonText, activeFilter === 'all' && styles.filterButtonTextActive]}>
              All Trips
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, activeFilter === 'last7' && styles.filterButtonActive]}
            onPress={() => setActiveFilter('last7')}
          >
            <Text style={[styles.filterButtonText, activeFilter === 'last7' && styles.filterButtonTextActive]}>
              Last 7 Days
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, activeFilter === 'last30' && styles.filterButtonActive]}
            onPress={() => setActiveFilter('last30')}
          >
            <Text style={[styles.filterButtonText, activeFilter === 'last30' && styles.filterButtonTextActive]}>
              Last 30 Days
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, activeFilter === 'topDrivers' && styles.filterButtonActive]}
            onPress={() => setActiveFilter('topDrivers')}
          >
            <Text style={[styles.filterButtonText, activeFilter === 'topDrivers' && styles.filterButtonTextActive]}>
              Top Drivers
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.sortContainer}>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setShowSortMenu(!showSortMenu)}
          >
            <Text style={styles.sortButtonText}>
              {sortBy === 'recent' ? 'Most Recent' : sortBy === 'distance' ? 'Longest Distance' : 'Fastest Delivery'}
            </Text>
            <ChevronDown size={16} color="#94A3B8" />
          </TouchableOpacity>

          {showSortMenu && (
            <View style={styles.sortMenu}>
              <TouchableOpacity
                style={styles.sortMenuItem}
                onPress={() => {
                  setSortBy('recent');
                  setShowSortMenu(false);
                }}
              >
                <Text style={[styles.sortMenuText, sortBy === 'recent' && styles.sortMenuTextActive]}>
                  Most Recent
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sortMenuItem}
                onPress={() => {
                  setSortBy('distance');
                  setShowSortMenu(false);
                }}
              >
                <Text style={[styles.sortMenuText, sortBy === 'distance' && styles.sortMenuTextActive]}>
                  Longest Distance
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sortMenuItem}
                onPress={() => {
                  setSortBy('fastest');
                  setShowSortMenu(false);
                }}
              >
                <Text style={[styles.sortMenuText, sortBy === 'fastest' && styles.sortMenuTextActive]}>
                  Fastest Delivery
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <FlatList
        data={filteredAndSortedTrips}
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
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterScrollContent: {
    paddingRight: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#94A3B8',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  sortContainer: {
    marginTop: 12,
    position: 'relative',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#E2E8F0',
  },
  sortMenu: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  sortMenuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sortMenuText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  sortMenuTextActive: {
    color: '#2563EB',
    fontWeight: '600' as const,
  },
});
