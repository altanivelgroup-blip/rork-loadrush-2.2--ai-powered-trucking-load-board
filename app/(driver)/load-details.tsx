import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, MapPin, Clock, Navigation, CheckCircle, Truck, Package, DollarSign, Fuel, Zap, Volume2 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useDocumentData } from '@/hooks/useDocumentData';
import { Load, DriverProfile } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { generateText } from '@rork/toolkit-sdk';
	
interface BackhaulLoad {
  origin: string;
  destination: string;
  miles: number;
  rate: number;
  profitPerMile: number;
  eta: string;
  deadheadMiles: number;
}

export default function LoadDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [loadAccepted, setLoadAccepted] = useState(false);
  const [showBackhaulModal, setShowBackhaulModal] = useState(false);
  const [backhaulLoads, setBackhaulLoads] = useState<BackhaulLoad[]>([]);
  const [loadingBackhaul, setLoadingBackhaul] = useState(false);
  const [voiceGuidanceOn, setVoiceGuidanceOn] = useState(false);
  const [showPhotosModal, setShowPhotosModal] = useState(false);

  const { data: load, loading } = useDocumentData<Load>(`loads/${id}`);

  const analytics = useMemo(() => {
    if (!load) return null;
    
    const driverProfile = user?.role === 'driver' ? (user.profile as DriverProfile) : null;
    const mpg = driverProfile?.truckInfo?.mpg || 7.1;
    const fuelType = driverProfile?.truckInfo?.fuelType || 'Diesel';
    const fuelPrice = 3.85;
    const miles = load?.distance || 0;
    const rate = load?.rate || 0;

    if (!miles || !rate) {
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
  }, [load, user]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading load details...</Text>
      </View>
    );
  }

  if (!load) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.errorText}>Load not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleAcceptLoad = () => {
    setLoadAccepted(true);
    console.log('Load accepted:', load.id);
  };

  const handleNavigateToPickup = () => {
    console.log('Navigate to pickup');
    router.push({
      pathname: '/(driver)/navigation-screen',
      params: {
        destinationLat: load.pickup?.coordinates?.lat || 32.7767,
        destinationLng: load.pickup?.coordinates?.lng || -96.7970,
        destinationName: `${load.pickup?.city || 'Pickup'}, ${load.pickup?.state || ''}`,
      },
    });
  };

  const handleConfirmPickup = () => {
    console.log('Confirm pickup with photos');
  };

  const handleBackhaul = async () => {
    const driverProfile = user?.role === 'driver' ? (user.profile as DriverProfile) : null;
    
    if (!driverProfile?.truckInfo?.mpg || !load) {
      return;
    }

    setShowBackhaulModal(true);
    setLoadingBackhaul(true);

    try {
      const deliveryLocation = `${load.dropoff.city}, ${load.dropoff.state}`;
      const vehicleType = driverProfile.truckInfo?.make + ' ' + driverProfile.truckInfo?.model || 'Semi Truck';
      const trailerType = driverProfile.trailerInfo?.type || 'Dry Van';
      const mpg = driverProfile.truckInfo?.mpg || 8.5;

      const prompt = `You are a logistics AI assistant. Generate 5 realistic backhaul load opportunities for a truck driver.

Driver Profile:
- Vehicle: ${vehicleType}
- Trailer: ${trailerType}
- MPG: ${mpg}
- Current Delivery Location: ${deliveryLocation}

Find backhaul loads within 50 miles of ${deliveryLocation}.

For each load, provide:
1. Origin city and state (within 50 miles of ${deliveryLocation})
2. Destination city and state (realistic long-haul destination)
3. Miles (realistic distance)
4. Rate (realistic rate based on miles, typically $1.50-$3.00 per mile)
5. Deadhead miles (distance from ${deliveryLocation} to pickup)

Calculate:
- Fuel cost using ${mpg} MPG and $3.85/gallon
- Net profit (rate - fuel cost)
- Profit per mile (net profit / miles)
- ETA (assume 55 mph average speed)

Rank by best profit per mile.

Return ONLY valid JSON array with this exact structure:
[
  {
    "origin": "City, ST",
    "destination": "City, ST",
    "miles": 450,
    "rate": 1350,
    "profitPerMile": 2.15,
    "eta": "Fri 3:45 PM",
    "deadheadMiles": 12
  }
]

No markdown, no explanation, just the JSON array.`;

      const response = await generateText(prompt);
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
      }
      
      const parsedLoads = JSON.parse(cleanedResponse);
      
      if (Array.isArray(parsedLoads) && parsedLoads.length > 0) {
        setBackhaulLoads(parsedLoads);
      }
    } catch (error) {
      console.error('Error fetching backhaul loads:', error);
    } finally {
      setLoadingBackhaul(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Load Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.vehicleTypeBadge}>
          <Truck size={14} color="#FFFFFF" />
          <Text style={styles.vehicleTypeText}>{load.cargo?.type || 'FLATBED'}</Text>
        </View>

        <View style={styles.shipperSection}>
          <Text style={styles.shipperLabel}>Unknown Shipper</Text>
          <Text style={styles.routeText}>{load.pickup?.city || 'N/A'} to {load.dropoff?.city || 'N/A'}</Text>
        </View>

        <View style={styles.rateCard}>
          <Text style={styles.rateLabel}>Total Rate</Text>
          <Text style={styles.rateAmount}>${(load.rate || 0).toLocaleString()}</Text>
          <Text style={styles.ratePerMile}>${(load.ratePerMile || 0).toFixed(2)} per mile</Text>
        </View>

        {analytics && (
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsTitle}>Live Analytics</Text>
            
            <View style={styles.analyticsRow}>
              <View style={styles.analyticsItem}>
                <Fuel size={16} color="#F59E0B" />
                <Text style={styles.analyticsLabel}>Fuel Cost</Text>
                <Text style={styles.analyticsCost}>${analytics.fuelCost}</Text>
                <Text style={styles.analyticsSubtext}>{analytics.gallonsNeeded} gal @ {analytics.mpg} mpg (Driver)</Text>
              </View>
            </View>

            <View style={styles.analyticsRow}>
              <View style={styles.analyticsItem}>
                <DollarSign size={16} color="#10B981" />
                <Text style={styles.analyticsLabel}>Net After Fuel</Text>
                <Text style={styles.analyticsProfit}>${analytics.netProfit}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>{load.distance || 0} miles</Text>
          
          <View style={styles.detailRow}>
            <Clock size={16} color="#6B7280" />
            <Text style={styles.detailLabel}>ETA</Text>
            <Text style={styles.detailValue}>—</Text>
          </View>

          <View style={styles.detailRow}>
            <MapPin size={16} color="#EF4444" />
            <Text style={styles.detailLabel}>Delivery Location</Text>
          </View>
          <Text style={styles.detailLocationValue}>{load.dropoff?.city || 'N/A'}, {load.dropoff?.state || ''}</Text>
          <View style={styles.detailRow}>
            <Clock size={14} color="#6B7280" />
            <Text style={styles.detailDateText}>{load.dropoff?.date || 'TBD'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.backhaulBanner} onPress={handleBackhaul}>
          <View style={styles.backhaulIconContainer}>
            <Zap size={20} color="#FFFFFF" />
          </View>
          <View style={styles.backhaulTextContainer}>
            <Text style={styles.backhaulTitle}>Smart Backhaul (560mi, 1492)</Text>
            <Text style={styles.backhaulSubtitle}>5 smart matches found</Text>
          </View>
          <Zap size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.loadInfoCard}>
          <Text style={styles.loadInfoTitle}>Load Information</Text>
          
          <View style={styles.loadInfoRow}>
            <Package size={16} color="#6B7280" />
            <Text style={styles.loadInfoLabel}>Weight</Text>
            <Text style={styles.loadInfoValue}>{load.cargo?.weight ? `${(load.cargo.weight / 1000).toFixed(1)}k` : '0.0k'} lbs</Text>
          </View>

          <View style={styles.loadInfoRow}>
            <Fuel size={16} color="#6B7280" />
            <Text style={styles.loadInfoLabel}>Estimated Fuel</Text>
            <Text style={styles.loadInfoValue}>—</Text>
          </View>
        </View>

        <View style={styles.driverMetricsCard}>
          <Text style={styles.driverMetricsTitle}>Driver Metrics</Text>
        </View>

        <TouchableOpacity 
          style={styles.photosButton}
          onPress={() => setShowPhotosModal(true)}
        >
          <Text style={styles.photosButtonText}>Pickup/Delivery Photos</Text>
        </TouchableOpacity>

        {loadAccepted && (
          <View style={styles.navigationCard}>
            <View style={styles.navigationHeader}>
              <View style={styles.navigationIconBadge}>
                <Text style={styles.navigationIconText}>⭕</Text>
              </View>
              <Text style={styles.navigationTitle}>Navigate to Pickup</Text>
            </View>

            <View style={styles.pickupLocationCard}>
              <Text style={styles.pickupLocationLabel}>Pickup Location:</Text>
              <Text style={styles.pickupLocationValue}>{load.pickup?.city || 'N/A'}, {load.pickup?.state || ''}</Text>
            </View>

            <TouchableOpacity style={styles.navigateButton} onPress={handleNavigateToPickup}>
              <Navigation size={20} color="#FFFFFF" />
              <Text style={styles.navigateButtonText}>Navigate to Pickup</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmPickup}>
              <CheckCircle size={20} color="#FFFFFF" />
              <Text style={styles.confirmButtonText}>Confirm Pickup</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.voiceButton}
              onPress={() => setVoiceGuidanceOn(!voiceGuidanceOn)}
            >
              <Volume2 size={18} color="#6B7280" />
              <Text style={styles.voiceButtonText}>Voice Guidance {voiceGuidanceOn ? 'On' : 'Off'}</Text>
            </TouchableOpacity>

            <View style={styles.enhancedNavCard}>
              <Clock size={14} color="#6B7280" />
              <Text style={styles.enhancedNavText}>Enhanced navigation ready - tap to start pickup route</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showBackhaulModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBackhaulModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Smart Backhaul Matches</Text>
            <TouchableOpacity onPress={() => setShowBackhaulModal(false)}>
              <X size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {loadingBackhaul ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF9500" />
                <Text style={styles.loadingModalText}>Finding backhaul loads...</Text>
              </View>
            ) : backhaulLoads.length > 0 ? (
              <>
                <View style={styles.backhaulInfoBanner}>
                  <Text style={styles.backhaulInfoText}>
                    Showing loads within 50 miles of {load.dropoff.city}, {load.dropoff.state}
                  </Text>
                </View>
                {backhaulLoads.map((backhaulLoad, index) => (
                  <View key={index} style={styles.backhaulLoadCard}>
                    <View style={styles.backhaulLoadHeader}>
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
                      <View style={styles.backhaulStatItem}>
                        <Text style={styles.backhaulStatLabel}>ETA</Text>
                        <Text style={styles.backhaulStatValue}>{backhaulLoad.eta}</Text>
                      </View>
                    </View>

                    <TouchableOpacity style={styles.backhaulViewButton}>
                      <Text style={styles.backhaulViewButtonText}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            ) : null}
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={showPhotosModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPhotosModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pickup/Delivery Photos</Text>
            <TouchableOpacity onPress={() => setShowPhotosModal(false)}>
              <X size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <Text style={styles.photosPlaceholder}>Photo upload feature coming soon</Text>
          </View>
        </View>
      </Modal>

      {!loadAccepted && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={styles.acceptButton} onPress={handleAcceptLoad}>
            <Text style={styles.acceptButtonText}>Accept Load</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  vehicleTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E40AF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  vehicleTypeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  shipperSection: {
    marginBottom: 20,
  },
  shipperLabel: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E40AF',
    marginBottom: 4,
  },
  routeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  rateCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  rateLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  rateAmount: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: '#10B981',
    marginBottom: 4,
  },
  ratePerMile: {
    fontSize: 14,
    color: '#6B7280',
  },
  analyticsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  analyticsRow: {
    marginBottom: 12,
  },
  analyticsItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  analyticsCost: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#EF4444',
    marginBottom: 4,
  },
  analyticsProfit: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#10B981',
  },
  analyticsSubtext: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1F2937',
  },
  detailLocationValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginLeft: 24,
    marginBottom: 4,
  },
  detailDateText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  backhaulBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FF9500',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  backhaulIconContainer: {
    marginRight: 12,
  },
  backhaulTextContainer: {
    flex: 1,
  },
  backhaulTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  backhaulSubtitle: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.95,
  },
  loadInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loadInfoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 12,
  },
  loadInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  loadInfoLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  loadInfoValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1F2937',
  },
  driverMetricsCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  driverMetricsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1F2937',
  },
  photosButton: {
    backgroundColor: '#E0E7FF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  photosButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#3730A3',
  },
  navigationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FF9500',
  },
  navigationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  navigationIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigationIconText: {
    fontSize: 18,
  },
  navigationTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1F2937',
  },
  pickupLocationCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  pickupLocationLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  pickupLocationValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1F2937',
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
  },
  navigateButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  voiceButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  enhancedNavCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
  },
  enhancedNavText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  footer: {
    backgroundColor: Colors.light.cardBackground,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  acceptButton: {
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.light.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingModalText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
    marginTop: 16,
  },
  backhaulInfoBanner: {
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#7DD3FC',
  },
  backhaulInfoText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#0369A1',
    textAlign: 'center',
  },
  backhaulLoadCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FF9500',
  },
  backhaulLoadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backhaulRankBadge: {
    backgroundColor: '#FF9500',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  backhaulRankText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  backhaulRateContainer: {
    alignItems: 'flex-end',
  },
  backhaulRate: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#10B981',
  },
  backhaulProfitPerMile: {
    fontSize: 13,
    fontWeight: '600' as const,
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
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  backhaulArrow: {
    alignItems: 'center',
    marginVertical: 4,
  },
  backhaulArrowText: {
    fontSize: 18,
    color: Colors.light.textSecondary,
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
    fontWeight: '600' as const,
    color: '#64748B',
    marginBottom: 4,
  },
  backhaulStatValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  backhaulViewButton: {
    backgroundColor: '#FF9500',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  backhaulViewButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  photosPlaceholder: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 40,
  },
});
