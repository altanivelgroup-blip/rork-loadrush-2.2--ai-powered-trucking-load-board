import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import Colors from '@/constants/colors';
import { Package } from 'lucide-react-native';
import type { Load } from '@/types';
import { useShipperLoads, ShipperLoadFilter } from '@/hooks/useShipperLoads';

type SortOption = 'newest' | 'highest';

export default function ShipperLoads() {
  const insets = useSafeAreaInsets();
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [statusFilter, setStatusFilter] = useState<ShipperLoadFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'bulk'>('all');

  const { loads, metrics, loading, error } = useShipperLoads();

  const sortedLoads = [...loads].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'highest') {
      return b.rate - a.rate;
    }
    return 0;
  });

  const filteredLoads = sortedLoads.filter(load => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'active' && load.status !== 'in_transit') return false;
      if (statusFilter === 'pending' && load.status !== 'posted' && load.status !== 'matched') return false;
      if (statusFilter === 'delivered' && load.status !== 'delivered') return false;
      if (statusFilter === 'cancelled' && load.status !== 'cancelled') return false;
    }
    if (sourceFilter === 'bulk' && !load.id.includes('bulk')) return false;
    return true;
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading your loads...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.errorText}>Error loading loads</Text>
        <Text style={styles.errorSubtext}>{error.message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.loadsCount}>
            <Package size={18} color={Colors.light.textSecondary} />
            <Text style={styles.loadsCountText}>{filteredLoads.length} loads found</Text>
          </View>
        </View>

        <View style={styles.statusFilterRow}>
          <TouchableOpacity
            style={[styles.statusFilterButton, statusFilter === 'all' && styles.statusFilterButtonActive]}
            onPress={() => setStatusFilter('all')}
          >
            <Text style={[styles.statusFilterButtonText, statusFilter === 'all' && styles.statusFilterButtonTextActive]}>
              All ({metrics.totalLoads})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusFilterButton, statusFilter === 'active' && styles.statusFilterButtonActive]}
            onPress={() => setStatusFilter('active')}
          >
            <Text style={[styles.statusFilterButtonText, statusFilter === 'active' && styles.statusFilterButtonTextActive]}>
              Active ({metrics.totalActive})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusFilterButton, statusFilter === 'pending' && styles.statusFilterButtonActive]}
            onPress={() => setStatusFilter('pending')}
          >
            <Text style={[styles.statusFilterButtonText, statusFilter === 'pending' && styles.statusFilterButtonTextActive]}>
              Pending ({metrics.totalPending})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusFilterButton, statusFilter === 'delivered' && styles.statusFilterButtonActive]}
            onPress={() => setStatusFilter('delivered')}
          >
            <Text style={[styles.statusFilterButtonText, statusFilter === 'delivered' && styles.statusFilterButtonTextActive]}>
              Delivered ({metrics.totalDelivered})
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterButton, sourceFilter === 'bulk' && styles.filterButtonActive]}
            onPress={() => setSourceFilter(sourceFilter === 'bulk' ? 'all' : 'bulk')}
          >
            <Text style={[styles.filterButtonText, sourceFilter === 'bulk' && styles.filterButtonTextActive]}>
              Bulk Import
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sourceButton}
            disabled
          >
            <Text style={styles.sourceButtonText}>Source: All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sortRow}>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'newest' && styles.sortButtonActive]}
            onPress={() => setSortBy('newest')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'newest' && styles.sortButtonTextActive]}>
              Newest First
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'highest' && styles.sortButtonActive]}
            onPress={() => setSortBy('highest')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'highest' && styles.sortButtonTextActive]}>
              Highest Rate
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {filteredLoads.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={48} color="#BDBDBD" />
            <Text style={styles.emptyStateText}>No Loads Posted Yet</Text>
            <Text style={styles.emptyStateSubtext}>Start by posting your first load</Text>
          </View>
        ) : (
          filteredLoads.map((load) => (
            <LoadCardItem key={load.id} load={load} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function LoadCardItem({ load }: { load: Load }) {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusInfo = () => {
    switch (load.status) {
      case 'posted':
        return { color: '#2563EB', text: 'Pending' };
      case 'matched':
        return { color: '#F97316', text: 'Matched' };
      case 'in_transit':
        return { color: '#10B981', text: 'Active' };
      case 'delivered':
        return { color: '#6B7280', text: 'Delivered' };
      case 'cancelled':
        return { color: '#EF4444', text: 'Cancelled' };
      default:
        return { color: '#2563EB', text: 'Pending' };
    }
  };

  const statusInfo = getStatusInfo();
  const statusColor = statusInfo.color;
  const statusBorderColor = statusInfo.color;
  const statusText = statusInfo.text;

  return (
    <Pressable
      style={styles.loadCard}
      onPress={() => setShowDetails(!showDetails)}
    >
      <View style={[styles.statusBadge, { backgroundColor: statusColor, borderColor: statusBorderColor }]}>
        <Text style={styles.statusBadgeText}>{statusText}</Text>
      </View>

      <View style={styles.loadCardContent}>
        {showDetails ? (
          <>
            <Text style={styles.loadRoute}>
              Route: {load.pickup.city}, {load.pickup.state} → {load.dropoff.city}, {load.dropoff.state}
            </Text>
            <Text style={styles.loadBids}>Bids: 2</Text>
          </>
        ) : (
          <>
            <View style={styles.loadRow}>
              <Text style={styles.loadLabel}>Status:</Text>
              <Text style={styles.loadValue}>{statusText}</Text>
            </View>
            <View style={styles.loadRow}>
              <Text style={styles.loadLabel}>Rate:</Text>
              <Text style={styles.loadValue}>${load.rate?.toLocaleString() ?? 'N/A'}</Text>
            </View>
            <View style={styles.loadRow}>
              <Text style={styles.loadLabel}>Route:</Text>
              <Text style={styles.loadValue}>
                {load.pickup.city}, {load.pickup.state} → {load.dropoff.city}, {load.dropoff.state}
              </Text>
            </View>
            <View style={styles.loadRow}>
              <Text style={styles.loadLabel}>Bids:</Text>
              <Text style={styles.loadValue}>2</Text>
            </View>
          </>
        )}
      </View>

      <TouchableOpacity
        style={styles.tapForDetails}
        onPress={() => setShowDetails(!showDetails)}
      >
        <Text style={styles.tapForDetailsText}>Tap for Details</Text>
      </TouchableOpacity>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTop: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  loadsCount: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  loadsCountText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: '500' as const,
  },
  filterRow: {
    flexDirection: 'row' as const,
    gap: 8,
    marginBottom: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F97316',
    borderWidth: 1.5,
    borderColor: '#F97316',
  },
  filterButtonActive: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  sourceButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
  },
  sourceButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#757575',
  },
  sortRow: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#2563EB',
  },
  sortButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#2563EB',
  },
  sortButtonTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(37, 99, 235, 0.25)',
    marginBottom: 16,
    overflow: 'hidden' as const,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start' as const,
    borderRadius: 12,
    borderWidth: 1.5,
    margin: 12,
    marginBottom: 0,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700' as const,
  },
  loadCardContent: {
    padding: 16,
  },
  loadRoute: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 8,
    fontWeight: '500' as const,
  },
  loadBids: {
    fontSize: 14,
    color: '#424242',
    fontWeight: '500' as const,
  },
  loadRow: {
    flexDirection: 'row' as const,
    marginBottom: 8,
  },
  loadLabel: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500' as const,
    width: 60,
  },
  loadValue: {
    fontSize: 14,
    color: '#212121',
    fontWeight: '600' as const,
    flex: 1,
  },
  tapForDetails: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    paddingVertical: 12,
    alignItems: 'center' as const,
  },
  tapForDetailsText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  centerContent: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#424242',
    fontWeight: '500' as const,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center' as const,
  },
  statusFilterRow: {
    flexDirection: 'row' as const,
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap' as const,
  },
  statusFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statusFilterButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  statusFilterButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#424242',
  },
  statusFilterButtonTextActive: {
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#424242',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#757575',
    marginTop: 8,
  },
});
