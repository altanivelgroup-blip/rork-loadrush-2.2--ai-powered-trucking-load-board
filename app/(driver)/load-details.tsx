import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDriverLoads } from '@/hooks/useDriverLoads';
import { useAuth } from '@/contexts/AuthContext';
import { DriverProfile } from '@/types';
import { X, MapPin, Clock, DollarSign, TrendingUp, Fuel } from 'lucide-react-native';
import { useFuelPrices } from '@/hooks/useFuelPrices';

export default function LoadDetails() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeLoads, loading } = useDriverLoads();
  const { user } = useAuth();
  const [isAccepting, setIsAccepting] = useState(false);

  const load = useMemo(() => {
    return activeLoads.find((l) => l.id === id);
  }, [activeLoads, id]);

  const driverProfile = user?.role === 'driver' ? (user.profile as DriverProfile) : null;
  const mpg = driverProfile?.truckInfo?.mpg || 7.1;
  const fuelType = driverProfile?.truckInfo?.fuelType || 'Diesel';

  const { price: fuelPrice } = useFuelPrices(
    fuelType.toLowerCase() === 'diesel' ? 'diesel' : 'gasoline',
    {
      state: load?.pickup?.state || null,
      city: load?.pickup?.city || null,
      enabled: !!load,
    }
  );

  const analytics = useMemo(() => {
    if (!load) return null;

    const miles = load.distance || 0;
    const rate = load.rate || 0;

    if (!mpg || mpg <= 0 || !miles || !rate) {
      return null;
    }

    const gallonsNeeded = miles / mpg;
    const fuelCost = gallonsNeeded * fuelPrice;
    const netProfit = rate - fuelCost;
    const profitPerMile = netProfit / miles;

    return {
      miles,
      mpg,
      fuelType,
      fuelPrice,
      gallonsNeeded: gallonsNeeded.toFixed(1),
      fuelCost: fuelCost.toFixed(0),
      gross: rate,
      netProfit: netProfit.toFixed(0),
      profitPerMile: profitPerMile.toFixed(2),
    };
  }, [load, mpg, fuelType, fuelPrice]);

  const handleAcceptLoad = async () => {
    setIsAccepting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsAccepting(false);
    router.back();
  };

  if (loading || !load) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading load details...</Text>
      </View>
    );
  }

  const getStatusInfo = () => {
    const status = (load.status as string) ?? 'posted';
    const statusMap: Record<string, { color: string; text: string; bgColor: string }> = {
      posted: { color: '#2563EB', text: 'FLATBED', bgColor: '#DBEAFE' },
      matched: { color: '#10B981', text: 'ACCEPTED', bgColor: '#D1FAE5' },
      in_transit: { color: '#F59E0B', text: 'IN TRANSIT', bgColor: '#FEF3C7' },
      delivered: { color: '#6B7280', text: 'DELIVERED', bgColor: '#F3F4F6' },
      cancelled: { color: '#EF4444', text: 'CANCELLED', bgColor: '#FEE2E2' },
    };
    return statusMap[status] ?? statusMap.posted;
  };

  const statusInfo = getStatusInfo();
  const rate = load?.rate ?? 0;
  const miles = load?.distance ?? 0;
  const ratePerMile = miles > 0 ? (rate / miles).toFixed(2) : '0.00';

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Load Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusBadgeContainer}>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
            <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
          </View>
        </View>

        <Text style={styles.shipperName}>Unknown Shipper</Text>
        <Text style={styles.routeText}>
          {load.pickup?.city || 'N/A'}, {load.pickup?.state || 'N/A'} → {load.dropoff?.city || 'N/A'},{' '}
          {load.dropoff?.state || 'N/A'}
        </Text>
        <Text style={styles.loadIdText}>Load ID: {load.id.substring(0, 16)}</Text>

        <View style={styles.rateCard}>
          <Text style={styles.rateLabel}>Total Rate</Text>
          <Text style={styles.rateAmount}>${rate.toLocaleString()}</Text>
          <Text style={styles.ratePerMile}>${ratePerMile} per mile</Text>
          <Text style={styles.milesText}>{miles} miles</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.locationHeader}>
            <MapPin size={18} color="#10B981" />
            <Text style={styles.sectionTitle}>Pickup Location</Text>
          </View>
          <View style={styles.locationCard}>
            <Text style={styles.locationCity}>
              {load.pickup?.city || 'N/A'}, {load.pickup?.state || 'N/A'}
            </Text>
            <Text style={styles.locationAddress}>{load.pickup?.location || 'Address not provided'}</Text>
            <View style={styles.dateTimeRow}>
              <Clock size={14} color="#6B7280" />
              <Text style={styles.dateTimeText}>
                {load.pickup?.date || 'N/A'} at {load.pickup?.time || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.locationHeader}>
            <MapPin size={18} color="#EF4444" />
            <Text style={styles.sectionTitle}>Delivery Location</Text>
          </View>
          <View style={styles.locationCard}>
            <Text style={styles.locationCity}>
              {load.dropoff?.city || 'N/A'}, {load.dropoff?.state || 'N/A'}
            </Text>
            <Text style={styles.locationAddress}>{load.dropoff?.location || 'Address not provided'}</Text>
            <View style={styles.dateTimeRow}>
              <Clock size={14} color="#6B7280" />
              <Text style={styles.dateTimeText}>
                {load.dropoff?.date || 'N/A'} at {load.dropoff?.time || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {analytics ? (
          <View style={styles.analyticsSection}>
            <Text style={styles.analyticsSectionTitle}>Live Analytics</Text>

            <View style={styles.analyticsGrid}>
              <View style={styles.analyticsCard}>
                <View style={styles.analyticsIconContainer}>
                  <Fuel size={20} color="#F59E0B" />
                </View>
                <Text style={styles.analyticsLabel}>Fuel Cost</Text>
                <Text style={styles.analyticsFuelCost}>${analytics.fuelCost}</Text>
                <Text style={styles.analyticsSubtext}>
                  {analytics.gallonsNeeded} gal @ ${analytics.fuelPrice.toFixed(2)} ({fuelType})
                </Text>
              </View>

              <View style={styles.analyticsCard}>
                <View style={styles.analyticsIconContainer}>
                  <DollarSign size={20} color="#10B981" />
                </View>
                <Text style={styles.analyticsLabel}>Net After Fuel</Text>
                <Text style={styles.analyticsNetProfit}>${analytics.netProfit}</Text>
                <Text style={styles.analyticsSubtext}>Profitable</Text>
              </View>

              <View style={styles.analyticsCard}>
                <View style={styles.analyticsIconContainer}>
                  <TrendingUp size={20} color="#3B82F6" />
                </View>
                <Text style={styles.analyticsLabel}>Profit/Mile</Text>
                <Text style={styles.analyticsProfitPerMile}>${analytics.profitPerMile}</Text>
                <Text style={styles.analyticsSubtext}>Per mile profit</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.analyticsPlaceholder}>
            <Text style={styles.analyticsPlaceholderText}>
              Add MPG in your Vehicle Profile to unlock Live Analytics
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup/Delivery Photos</Text>
          <View style={styles.photosPlaceholder}>
            <Text style={styles.photosPlaceholderText}>Photos will be uploaded during pickup/delivery</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.acceptButton, isAccepting && styles.acceptButtonDisabled]}
          onPress={handleAcceptLoad}
          disabled={isAccepting}
          activeOpacity={0.8}
        >
          {isAccepting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.acceptButtonText}>Accept Load</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centerContent: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  scrollView: { flex: 1 },
  content: { padding: 16 },
  statusBadgeContainer: { alignItems: 'flex-start', marginBottom: 12 },
  statusBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  statusBadgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  shipperName: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  routeText: { fontSize: 15, fontWeight: '500', color: '#4B5563', marginBottom: 4 },
  loadIdText: { fontSize: 12, fontWeight: '400', color: '#9CA3AF', marginBottom: 20 },
  rateCard: {
    backgroundColor: '#D1FAE5',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  rateLabel: { fontSize: 14, fontWeight: '600', color: '#065F46', marginBottom: 8 },
  rateAmount: { fontSize: 36, fontWeight: '700', color: '#10B981', marginBottom: 4 },
  ratePerMile: { fontSize: 16, fontWeight: '600', color: '#059669', marginBottom: 4 },
  milesText: { fontSize: 13, fontWeight: '500', color: '#047857' },
  section: { marginBottom: 24 },
  locationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationCity: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  locationAddress: { fontSize: 14, fontWeight: '400', color: '#6B7280', marginBottom: 10 },
  dateTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateTimeText: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
  analyticsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  analyticsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  analyticsGrid: { gap: 12 },
  analyticsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  analyticsIconContainer: { marginBottom: 8 },
  analyticsLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 8 },
  analyticsFuelCost: { fontSize: 28, fontWeight: '700', color: '#F59E0B', marginBottom: 4 },
  analyticsNetProfit: { fontSize: 28, fontWeight: '700', color: '#10B981', marginBottom: 4 },
  analyticsProfitPerMile: { fontSize: 28, fontWeight: '700', color: '#3B82F6', marginBottom: 4 },
  analyticsSubtext: { fontSize: 11, fontWeight: '500', color: '#9CA3AF' },
  analyticsPlaceholder: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  analyticsPlaceholderText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#92400E',
    textAlign: 'center',
  },
  photosPlaceholder: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  photosPlaceholderText: { fontSize: 13, fontWeight: '500', color: '#9CA3AF', textAlign: 'center' },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  acceptButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonDisabled: { backgroundColor: '#93C5FD' },
  acceptButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
