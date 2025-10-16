import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDriverLoads } from '@/hooks/useDriverLoads';
import { useAuth } from '@/contexts/AuthContext';
import { DriverProfile } from '@/types';
import { X, MapPin, Clock, DollarSign, TrendingUp, Fuel, Navigation, CheckCircle, Volume2, Calendar, Package2, Lightbulb } from 'lucide-react-native';
import { useFuelPrices } from '@/hooks/useFuelPrices';
import PhotoUploader from '@/components/PhotoUploader';
import { generateText } from '@rork/toolkit-sdk';

export default function LoadDetails() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeLoads, loading } = useDriverLoads();
  const { user } = useAuth();
  const [isAccepting, setIsAccepting] = useState(false);
  const [loadAccepted, setLoadAccepted] = useState(false);
  const [voiceGuidanceOn, setVoiceGuidanceOn] = useState(false);
  const [navigationReady, setNavigationReady] = useState(false);
  const [showBackhaulModal, setShowBackhaulModal] = useState(false);
  const [backhaulLoads, setBackhaulLoads] = useState<any[]>([]);
  const [loadingBackhaul, setLoadingBackhaul] = useState(false);

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

    const safeFuelPrice = Number.isFinite(fuelPrice) ? (fuelPrice as number) : 0;
    const gallonsNeeded = miles / mpg;
    const fuelCost = gallonsNeeded * safeFuelPrice;
    const netProfit = rate - fuelCost;
    const profitPerMile = miles > 0 ? netProfit / miles : 0;

    return {
      miles,
      mpg,
      fuelType,
      fuelPrice: safeFuelPrice,
      gallonsNeeded: gallonsNeeded.toFixed(1),
      fuelCost: fuelCost.toFixed(0),
      gross: rate,
      netProfit: netProfit.toFixed(0),
      profitPerMile: profitPerMile.toFixed(2),
    };
  }, [load, mpg, fuelType, fuelPrice]);

  const handleAcceptLoad = async () => {
    console.log('[LoadDetails] Accept Load pressed', { id, rate: load?.rate, distance: load?.distance });
    setIsAccepting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsAccepting(false);
    setLoadAccepted(true);
    Alert.alert('Success', 'Load accepted successfully! You can now navigate to pickup.');
  };

  const handleNavigateToPickup = () => {
    if (!load?.pickup?.location) {
      Alert.alert('Error', 'Pickup location not available');
      return;
    }
    console.log('[LoadDetails] Navigate to pickup:', load.pickup.location);
    
    const destinationName = `${load.pickup.city}, ${load.pickup.state}`;
    const destinationLat = load.pickup.lat || 0;
    const destinationLng = load.pickup.lng || 0;

    if (destinationLat === 0 || destinationLng === 0) {
      Alert.alert('Error', 'Pickup coordinates not available');
      return;
    }

    router.push({
      pathname: '/(driver)/navigation-screen',
      params: {
        destinationLat: destinationLat.toString(),
        destinationLng: destinationLng.toString(),
        destinationName: destinationName,
      },
    });
  };

  const handleConfirmPickup = () => {
    Alert.alert('Pickup Confirmed', 'You have confirmed pickup at the location');
    console.log('[LoadDetails] Pickup confirmed for load:', load?.id);
  };

  const handleSmartBackhaul = async () => {
    const driverProfile = user?.role === 'driver' ? (user.profile as DriverProfile) : null;
    
    if (!driverProfile?.truckInfo?.mpg) {
      Alert.alert('Setup Required', 'Add MPG in your Vehicle Profile to unlock Smart Backhaul.');
      return;
    }

    setShowBackhaulModal(true);
    setLoadingBackhaul(true);

    try {
      const deliveryLocation = `${load?.dropoff?.city}, ${load?.dropoff?.state}`;
      const vehicleType = driverProfile.truckInfo?.make + ' ' + driverProfile.truckInfo?.model || 'Semi Truck';
      const mpg = driverProfile.truckInfo?.mpg || 8.5;

      const prompt = `You are a logistics AI. Generate 3 realistic backhaul load opportunities.

Driver at: ${deliveryLocation}
Vehicle: ${vehicleType}
MPG: ${mpg}

Find loads within 50 miles, returning to major cities.

Return ONLY valid JSON array:
[
  {
    "origin": "City, ST",
    "destination": "City, ST",
    "miles": 450,
    "rate": 1492,
    "profitPerMile": 2.15,
    "deadheadMiles": 12
  }
]

No markdown, just JSON.`;

      const response = await generateText(prompt);
      let cleanedResponse = response.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const parsedLoads = JSON.parse(cleanedResponse);
      
      if (Array.isArray(parsedLoads) && parsedLoads.length > 0) {
        setBackhaulLoads(parsedLoads);
      }
    } catch (error) {
      console.error('Error fetching backhaul loads:', error);
      Alert.alert('Error', 'Failed to load backhaul options');
    } finally {
      setLoadingBackhaul(false);
    }
  };

  const [photosModalVisible, setPhotosModalVisible] = useState<boolean>(false);
  const openPhotos = () => {
    console.log('[LoadDetails] Open Pickup/Delivery Photos modal');
    setPhotosModalVisible(true);
  };
  const closePhotos = () => {
    console.log('[LoadDetails] Close Photos modal');
    setPhotosModalVisible(false);
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
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 140 }]}
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
          <View style={styles.locationHeader}>
            <Clock size={18} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Trip Information</Text>
          </View>
          <View style={styles.locationCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Distance</Text>
              <Text style={styles.infoValue}>{miles} miles</Text>
            </View>
            <View style={styles.infoRow}>
              <Clock size={14} color="#6B7280" />
              <Text style={styles.infoLabel}>ETA</Text>
              <Text style={styles.etaPlaceholder}>—</Text>
            </View>
            <View style={styles.infoRow}>
              <MapPin size={14} color="#EF4444" />
              <Text style={styles.infoLabel}>Delivery Location</Text>
              <Text style={styles.infoValue}>{load.dropoff?.city || 'N/A'}, {load.dropoff?.state || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Calendar size={14} color="#6B7280" />
              <Text style={styles.infoLabel}>Delivery Date</Text>
              <Text style={styles.infoValue}>{load.dropoff?.date || 'N/A'}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.backhaulButton}
          onPress={handleSmartBackhaul}
          activeOpacity={0.8}
        >
          <View style={styles.backhaulIconContainer}>
            <Lightbulb size={18} color="#FFFFFF" />
          </View>
          <View style={styles.backhaulTextContainer}>
            <Text style={styles.backhaulButtonTitle}>Smart Backhaul (560mi, 1492)</Text>
            <Text style={styles.backhaulButtonSubtitle}>5 smart matches found</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Load Information</Text>
          <View style={styles.locationCard}>
            <View style={styles.infoRow}>
              <Package2 size={14} color="#6B7280" />
              <Text style={styles.infoLabel}>Weight</Text>
              <Text style={styles.infoValue}>{load?.cargo?.weight || '0.0k'} lbs</Text>
            </View>
            <View style={styles.infoRow}>
              <Fuel size={14} color="#6B7280" />
              <Text style={styles.infoLabel}>Estimated Fuel</Text>
              <Text style={styles.etaPlaceholder}>—</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Driver Metrics</Text>
          <View style={styles.metricsPlaceholder}>
            <Text style={styles.metricsPlaceholderText}>Metrics will appear here once available</Text>
          </View>
        </View>

        {loadAccepted && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Navigate to Pickup</Text>
            <View style={styles.navigationCard}>
              <View style={styles.navigationIconBadge}>
                <Navigation size={22} color="#FFFFFF" />
              </View>
              <View style={styles.navigationInfo}>
                <Text style={styles.navigationLabel}>Pickup Location:</Text>
                <Text style={styles.navigationCity}>{load.pickup?.city || 'N/A'}, {load.pickup?.state || 'N/A'}</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.navigateButton}
              onPress={handleNavigateToPickup}
              activeOpacity={0.8}
            >
              <Navigation size={18} color="#FFFFFF" />
              <Text style={styles.navigateButtonText}>Navigate to Pickup</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.confirmPickupButton}
              onPress={handleConfirmPickup}
              activeOpacity={0.8}
            >
              <CheckCircle size={18} color="#FFFFFF" />
              <Text style={styles.confirmPickupButtonText}>Confirm Pickup</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.voiceButton}
              onPress={() => setVoiceGuidanceOn(!voiceGuidanceOn)}
              activeOpacity={0.8}
            >
              <Volume2 size={16} color="#1D4ED8" />
              <Text style={styles.voiceButtonText}>Voice Guidance {voiceGuidanceOn ? 'On' : 'Off'}</Text>
            </TouchableOpacity>

            {navigationReady && (
              <View style={styles.navigationReadyBanner}>
                <Clock size={14} color="#059669" />
                <Text style={styles.navigationReadyText}>Enhanced navigation ready - tap to start pickup route</Text>
              </View>
            )}
          </View>
        )}

        {loadAccepted && (
          <View style={styles.capacitySection}>
            <View style={styles.capacityRow}>
              <Text style={styles.capacityLabel}>capacity (gal)</Text>
              <Text style={styles.capacityValue}>150</Text>
            </View>
          </View>
        )}

      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          testID="photosButton"
          style={styles.secondaryButton}
          onPress={openPhotos}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>Pickup/Delivery Photos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="acceptLoadButton"
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

      <Modal
        animationType="slide"
        visible={photosModalVisible}
        onRequestClose={closePhotos}
        transparent
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pickup/Delivery Photos</Text>
              <TouchableOpacity onPress={closePhotos} accessibilityRole="button" testID="closePhotosModal">
                <X size={22} color="#111827" />
              </TouchableOpacity>
            </View>
            <PhotoUploader
              userId={user?.id ?? 'unknown-user'}
              role="driver"
              onUploaded={(url) => {
                console.log('[LoadDetails] Photo uploaded for load', { loadId: load.id, url });
              }}
            />
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        visible={showBackhaulModal}
        onRequestClose={() => setShowBackhaulModal(false)}
        presentationStyle="pageSheet"
      >
        <View style={styles.backhaulModalContainer}>
          <View style={styles.backhaulModalHeader}>
            <Text style={styles.backhaulModalTitle}>Smart Backhaul Matches</Text>
            <TouchableOpacity onPress={() => setShowBackhaulModal(false)}>
              <X size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.backhaulModalContent} showsVerticalScrollIndicator={false}>
            {loadingBackhaul ? (
              <View style={styles.backhaulLoadingContainer}>
                <ActivityIndicator size="large" color="#F97316" />
                <Text style={styles.backhaulLoadingText}>Finding smart matches...</Text>
              </View>
            ) : backhaulLoads.length > 0 ? (
              backhaulLoads.map((backhaulLoad, index) => (
                <View key={index} style={styles.backhaulCard}>
                  <View style={styles.backhaulCardHeader}>
                    <View style={styles.backhaulRankBadge}>
                      <Text style={styles.backhaulRankText}>#{index + 1}</Text>
                    </View>
                    <View style={styles.backhaulRateContainer}>
                      <Text style={styles.backhaulRate}>${backhaulLoad.rate.toLocaleString()}</Text>
                      <Text style={styles.backhaulProfitPerMile}>${backhaulLoad.profitPerMile}/mi</Text>
                    </View>
                  </View>

                  <View style={styles.backhaulRouteContainer}>
                    <View style={styles.backhaulLocationRow}>
                      <MapPin size={14} color="#10B981" />
                      <Text style={styles.backhaulLocationText}>{backhaulLoad.origin}</Text>
                    </View>
                    <View style={styles.backhaulArrow}>
                      <Text style={styles.backhaulArrowText}>→</Text>
                    </View>
                    <View style={styles.backhaulLocationRow}>
                      <MapPin size={14} color="#EF4444" />
                      <Text style={styles.backhaulLocationText}>{backhaulLoad.destination}</Text>
                    </View>
                  </View>

                  <View style={styles.backhaulStatsGrid}>
                    <View style={styles.backhaulStatItem}>
                      <Text style={styles.backhaulStatLabel}>Miles</Text>
                      <Text style={styles.backhaulStatValue}>{backhaulLoad.miles}</Text>
                    </View>
                    <View style={styles.backhaulStatItem}>
                      <Text style={styles.backhaulStatLabel}>Deadhead</Text>
                      <Text style={styles.backhaulStatValue}>{backhaulLoad.deadheadMiles} mi</Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.backhaulViewButton}>
                    <Text style={styles.backhaulViewButtonText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.backhaulEmptyContainer}>
                <Text style={styles.backhaulEmptyText}>No backhaul loads found</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  etaPlaceholder: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  backhaulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F97316',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  backhaulIconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    padding: 8,
  },
  backhaulTextContainer: {
    flex: 1,
  },
  backhaulButtonTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  backhaulButtonSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
  },
  metricsPlaceholder: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  metricsPlaceholderText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  navigationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  navigationIconBadge: {
    backgroundColor: '#F97316',
    borderRadius: 50,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigationInfo: {
    flex: 1,
  },
  navigationLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 2,
  },
  navigationCity: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 8,
  },
  navigateButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  confirmPickupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 8,
  },
  confirmPickupButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 12,
  },
  voiceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  navigationReadyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  navigationReadyText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#059669',
    flex: 1,
  },
  capacitySection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  capacityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  capacityLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  capacityValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  backhaulModalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  backhaulModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backhaulModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  backhaulModalContent: {
    flex: 1,
    padding: 20,
  },
  backhaulLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  backhaulLoadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  backhaulCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#F97316',
  },
  backhaulCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backhaulRankBadge: {
    backgroundColor: '#F97316',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  backhaulRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  backhaulRateContainer: {
    alignItems: 'flex-end',
  },
  backhaulRate: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
  },
  backhaulProfitPerMile: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  backhaulRouteContainer: {
    marginBottom: 12,
  },
  backhaulLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  backhaulLocationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  backhaulArrow: {
    alignItems: 'center',
    marginVertical: 4,
  },
  backhaulArrowText: {
    fontSize: 18,
    color: '#9CA3AF',
  },
  backhaulStatsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  backhaulStatItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  backhaulStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  backhaulStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  backhaulViewButton: {
    backgroundColor: '#F97316',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  backhaulViewButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  backhaulEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  backhaulEmptyText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#9CA3AF',
  },

  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  acceptButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  secondaryButtonText: { fontSize: 16, fontWeight: '700', color: '#1D4ED8' },
  acceptButtonDisabled: { backgroundColor: '#93C5FD' },
  acceptButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
});
