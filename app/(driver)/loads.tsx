import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDriverLoads } from '@/hooks/useDriverLoads';
import { Load } from '@/types';
import { Flame, DollarSign, TrendingUp, Clock, Package } from 'lucide-react-native';

export default function DriverLoads() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedVehicleType, setSelectedVehicleType] = useState('Cargo Van');
  const [selectedSort, setSelectedSort] = useState('Near me');

  const { activeLoads, loading } = useDriverLoads();

  const vehicleTypes = ['Cargo Van', 'Flatbed', 'Reefer', 'Box Truck'];
  const sortOptions = ['Highest $/mi', 'Near me', 'Lightest'];

  const filteredLoads = useMemo(() => {
    let filtered = [...activeLoads];

    if (selectedSort === 'Highest $/mi') {
      filtered.sort((a, b) => (b.ratePerMile || 0) - (a.ratePerMile || 0));
    } else if (selectedSort === 'Lightest') {
      filtered.sort((a, b) => (a?.cargo?.weight || 0) - (b?.cargo?.weight || 0));
    }

    return filtered;
  }, [activeLoads, selectedSort]);

  const handleLoadPress = (loadId: string) => {
    console.log('[Driver Loads] Load pressed:', loadId);
    router.push(`/(driver)/load-details?id=${loadId}`);
  };

  const calculateFuelCost = (load: Load) => {
    const mpg = 7.1;
    const fuelPrice = 3.85;
    const gallons = (load.distance || 0) / mpg;
    return (gallons * fuelPrice).toFixed(0);
  };

  const calculateNetProfit = (load: Load) => {
    const fuelCost = parseFloat(calculateFuelCost(load));
    const rate = load.rate || 0;
    return (rate - fuelCost).toFixed(0);
  };

  const calculateProfitPerMile = (load: Load) => {
    const netProfit = parseFloat(calculateNetProfit(load));
    return load.distance ? (netProfit / load.distance).toFixed(2) : '0.00';
  };

  const calculateETA = (load: Load) => {
    try {
      const avgSpeed = 55;
      const hours = (load.distance || 0) / avgSpeed;
      const pickupDate = new Date(load?.pickup?.date || Date.now());
      pickupDate.setHours(pickupDate.getHours() + hours);
      return pickupDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Stack.Screen options={{ title: 'Loads', headerShown: false }} />
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading loads...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Loads', headerShown: false }} />
      
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View style={styles.loadsFoundContainer}>
            <Package size={18} color="#F97316" />
            <Text style={styles.loadsFoundText}>{filteredLoads.length} loads found</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterRowContent}
        >
          {vehicleTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterPill,
                selectedVehicleType === type && styles.filterPillActive,
              ]}
              onPress={() => setSelectedVehicleType(type)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  selectedVehicleType === type && styles.filterPillTextActive,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.sortRow}
          contentContainerStyle={styles.sortRowContent}
        >
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.sortPill,
                selectedSort === option && styles.sortPillActive,
              ]}
              onPress={() => setSelectedSort(option)}
            >
              <Text
                style={[
                  styles.sortPillText,
                  selectedSort === option && styles.sortPillTextActive,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {filteredLoads.length > 0 ? (
          filteredLoads.map((load) => {
            // ✅ Safe fallback for any missing fields
            const rate = load?.rate ?? 0;
            const pickup = load?.pickup || {};
            const dropoff = load?.dropoff || {};

            return (
              <TouchableOpacity
                key={load.id}
                style={styles.loadCard}
                onPress={() => handleLoadPress(load.id)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>Active</Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.statusLabel}>Status: {load.status || 'Pending'}</Text>
                  <Text style={styles.rateText}>Rate: ${rate.toLocaleString()}</Text>
                  <Text style={styles.routeText}>
                    Route: {pickup.city || '—'}, {pickup.state || ''} → {dropoff.city || '—'}, {dropoff.state || ''}
                  </Text>
                  <Text style={styles.bidsText}>Bids: {load?.bids || 0}</Text>

                  <View style={styles.analyticsRow}>
                    <View style={styles.analyticsItem}>
                      <Flame size={14} color="#F97316" />
                      <Text style={styles.analyticsLabel}>Live Analytics (web)</Text>
                    </View>
                  </View>

                  <View style={styles.metricsGrid}>
                    <View style={styles.metricItem}>
                      <DollarSign size={14} color="#F59E0B" />
                      <Text style={styles.metricLabel}>Fuel Cost</Text>
                      <Text style={styles.metricValue}>${calculateFuelCost(load)}</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <TrendingUp size={14} color="#10B981" />
                      <Text style={styles.metricLabel}>Net Profit</Text>
                      <Text style={styles.metricValue}>${calculateNetProfit(load)}</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <DollarSign size={14} color="#3B82F6" />
                      <Text style={styles.metricLabel}>Profit/Mile</Text>
                      <Text style={styles.metricValue}>${calculateProfitPerMile(load)}</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Clock size={14} color="#6366F1" />
                      <Text style={styles.metricLabel}>ETA</Text>
                      <Text style={styles.metricValue}>{calculateETA(load)}</Text>
                    </View>
                  </View>

                  <View style={styles.ratingRow}>
                    <Text style={styles.ratingText}>Rating • No Spill • Rating</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.detailsButton}>
                  <Text style={styles.detailsButtonText}>Tap for Details</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Package size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>No Loads Available</Text>
            <Text style={styles.emptyStateText}>Check back later for new loads</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centerContent: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  header: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  loadsFoundContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  loadsFoundText: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  filterRow: { marginBottom: 8 },
  filterRowContent: { paddingRight: 16, gap: 8 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  filterPillActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  filterPillText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  filterPillTextActive: { color: '#FFFFFF' },
  sortRow: { marginBottom: 4 },
  sortRowContent: { paddingRight: 16, gap: 8 },
  sortPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  sortPillActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  sortPillText: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
  sortPillTextActive: { color: '#FFFFFF' },
  scrollView: { flex: 1 },
  content: { padding: 16 },
  loadCard: { backgroundColor: '#EFF6FF', borderRadius: 12, borderWidth: 2, borderColor: '#3B82F6', marginBottom: 16, overflow: 'hidden' },
  cardHeader: { padding: 12, paddingBottom: 8 },
  statusBadge: { backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  statusBadgeText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  cardBody: { padding: 12, paddingTop: 4 },
  statusLabel: { fontSize: 13, color: '#4B5563', marginBottom: 4 },
  rateText: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  routeText: { fontSize: 13, color: '#4B5563', marginBottom: 4 },
  bidsText: { fontSize: 13, color: '#4B5563', marginBottom: 8 },
  analyticsRow: { marginBottom: 12 },
  analyticsItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  analyticsLabel: { fontSize: 12, color: '#F97316', fontWeight: '500' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  metricItem: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFFFF', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, minWidth: '48%' },
  metricLabel: { fontSize: 11, color: '#6B7280', marginRight: 4 },
  metricValue: { fontSize: 12, fontWeight: '600', color: '#1F2937' },
  ratingRow: { marginTop: 4 },
  ratingText: { fontSize: 11, color: '#9CA3AF', textAlign: 'center' },
  detailsButton: { backgroundColor: '#3B82F6', paddingVertical: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#93C5FD' },
  detailsButtonText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyStateTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937', marginTop: 16 },
  emptyStateText: { fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center' },
});

