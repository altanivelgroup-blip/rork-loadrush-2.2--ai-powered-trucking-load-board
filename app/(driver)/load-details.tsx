import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, MapPin, Clock, Navigation, CheckCircle, Truck, Package, DollarSign, Fuel, Zap, Volume2, Phone, MessageCircle, AlertCircle, Camera } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useDocumentData } from '@/hooks/useDocumentData';
import { Load, DriverProfile } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { generateText } from '@rork/toolkit-sdk';
import { db } from '@/config/firebase';
import { doc, updateDoc } from 'firebase/firestore';

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
  const [accepting, setAccepting] = useState(false);

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
        <AlertCircle size={64} color="#EF4444" />
        <Text style={styles.errorText}>Load not found</Text>
        <Text style={styles.errorSubtext}>This load may have been removed or is no longer available</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleAcceptLoad = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to accept loads');
      return;
    }

    setAccepting(true);
    try {
      const loadRef = doc(db, 'loads', load.id);
      await updateDoc(loadRef, {
        status: 'matched',
        matchedDriverId: user.id,
        matchedDriverName: user.role === 'driver' && user.profile 
          ? `${(user.profile as DriverProfile).firstName} ${(user.profile as DriverProfile).lastName}`
          : user.email,
        updatedAt: new Date().toISOString(),
      });
      
      setLoadAccepted(true);
      Alert.alert('Success', 'Load accepted! Navigate to pickup location to begin.');
      console.log('[Load Details] Load accepted:', load.id);
    } catch (error) {
      console.error('[Load Details] Error accepting load:', error);
      Alert.alert('Error', 'Failed to accept load. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  const handleNavigateToPickup = () => {
    console.log('[Load Details] Navigate to pickup');
    router.push({
      pathname: '/(driver)/navigation-screen',
      params: {
        destinationLat: load.pickup?.coordinates?.lat || 36.1699,
        destinationLng: load.pickup?.coordinates?.lng || -115.1398,
        destinationName: `${load.pickup?.city || 'Pickup'}, ${load.pickup?.state || ''}`,
      },
    });
  };

  const handleConfirmPickup = () => {
    Alert.alert(
      'Confirm Pickup',
      'Have you picked up the load? Please upload photos to confirm.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Upload Photos', 
          onPress: () => setShowPhotosModal(true)
        },
      ]
    );
  };

  const handleBackhaul = async () => {
    const driverProfile = user?.role === 'driver' ? (user.profile as DriverProfile) : null;
    
    if (!driverProfile?.truckInfo?.mpg || !load) {
      Alert.alert('Setup Required', 'Add MPG in your Vehicle Profile to unlock Backhaul analytics.');
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
      console.error('[Load Details] Error fetching backhaul loads:', error);
      Alert.alert('Error', 'Failed to load backhaul options. Please try again.');
    } finally {
      setLoadingBackhaul(false);
    }
  };

  const handleCallShipper = () => {
    Alert.alert('Call Shipper', 'Contact shipper at: (555) 123-4567');
  };

  const handleMessageShipper = () => {
    Alert.alert('Message Shipper', 'Messaging feature coming soon');
  };

  const isLoadAccepted = loadAccepted || load.status === 'matched' || load.status === 'in_transit';

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
        <View style={styles.statusHeader}>
          <View style={styles.vehicleTypeBadge}>
            <Truck size={14} color="#FFFFFF" />
            <Text style={styles.vehicleTypeText}>{load.cargo?.type || 'FLATBED'}</Text>
          </View>
          
          {isLoadAccepted && (
            <View style={styles.acceptedBadge}>
              <CheckCircle size={14} color="#FFFFFF" />
              <Text style={styles.acceptedBadgeText}>ACCEPTED</Text>
            </View>
          )}
        </View>

        <View style={styles.shipperSection}>
          <Text style={styles.shipperLabel}>{load.shipperName || 'Unknown Shipper'}</Text>
          <Text style={styles.routeText}>
            {load.pickup?.city || 'N/A'}, {load.pickup?.state || ''} → {load.dropoff?.city || 'N/A'}, {load.dropoff?.state || ''}
          </Text>
          <Text style={styles.loadIdText}>Load ID: {load.id}</Text>
        </View>

        <View style={styles.rateCard}>
          <Text style={styles.rateLabel}>Total Rate</Text>
          <Text style={styles.rateAmount}>${(load.rate || 0).toLocaleString()}</Text>
          <Text style={styles.ratePerMile}>${(load.ratePerMile || 0).toFixed(2)} per mile</Text>
          <Text style={styles.distanceText}>{load.distance || 0} miles</Text>
        </View>

        {analytics && (
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsTitle}>💰 Live Fuel Analytics</Text>
            
            <View style={styles.analyticsGrid}>
              <View style={styles.analyticsItem}>
                <Fuel size={18} color="#F59E0B" />
                <Text style={styles.analyticsLabel}>Fuel Cost</Text>
                <Text style={styles.analyticsCost}>${analytics.fuelCost}</Text>
                <Text style={styles.analyticsSubtext}>{analytics.gallonsNeeded} gal @ {analytics.mpg} mpg</Text>
              </View>

              <View style={styles.analyticsItem}>
                <DollarSign size={18} color="#10B981" />
                <Text style={styles.analyticsLabel}>Net Profit</Text>
                <Text style={styles.analyticsProfit}>${analytics.netProfit}</Text>
                <Text style={styles.analyticsSubtext}>After fuel costs</Text>
              </View>

              <View style={styles.analyticsItem}>
                <Zap size={18} color="#3B82F6" />
                <Text style={styles.analyticsLabel}>Profit/Mile</Text>
                <Text style={styles.analyticsValue}>${analytics.profitPerMile}</Text>
                <Text style={styles.analyticsSubtext}>Per mile driven</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>📍 Pickup Location</Text>
          
          <View style={styles.locationRow}>
            <MapPin size={16} color="#10B981" />
            <View style={styles.locationInfo}>
              <Text style={styles.locationCity}>{load.pickup?.city || 'N/A'}, {load.pickup?.state || ''}</Text>
              <Text style={styles.locationAddress}>{load.pickup?.location || 'Address not provided'}</Text>
            </View>
          </View>

          <View style={styles.timeRow}>
            <Clock size={14} color="#6B7280" />
            <Text style={styles.timeText}>
              {load.pickup?.date || 'TBD'} at {load.pickup?.time || 'TBD'}
            </Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>🎯 Delivery Location</Text>
          
          <View style={styles.locationRow}>
            <MapPin size={16} color="#EF4444" />
            <View style={styles.locationInfo}>
              <Text style={styles.locationCity}>{load.dropoff?.city || 'N/A'}, {load.dropoff?.state || ''}</Text>
              <Text style={styles.locationAddress}>{load.dropoff?.location || 'Address not provided'}</Text>
            </View>
          </View>

          <View style={styles.timeRow}>
            <Clock size={14} color="#6B7280" />
            <Text style={styles.timeText}>
              {load.dropoff?.date || 'TBD'} at {load.dropoff?.time || 'TBD'}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.backhaulBanner} onPress={handleBackhaul}>
          <View style={styles.backhaulIconContainer}>
            <Zap size={20} color="#FFFFFF" />
          </View>
          <View style={styles.backhaulTextContainer}>
            <Text style={styles.backhaulTitle}>🚀 Smart Backhaul Finder</Text>
            <Text style={styles.backhaulSubtitle}>Find your next load after delivery</Text>
          </View>
          <Zap size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.loadInfoCard}>
          <Text style={styles.loadInfoTitle}>📦 Cargo Information</Text>
          
          <View style={styles.loadInfoRow}>
            <Package size={16} color="#6B7280" />
            <Text style={styles.loadInfoLabel}>Type</Text>
            <Text style={styles.loadInfoValue}>{load.cargo?.type || 'N/A'}</Text>
          </View>

          <View style={styles.loadInfoRow}>
            <Package size={16} color="#6B7280" />
            <Text style={styles.loadInfoLabel}>Weight</Text>
            <Text style={styles.loadInfoValue}>
              {load.cargo?.weight ? `${(load.cargo.weight / 1000).toFixed(1)}k lbs` : 'N/A'}
            </Text>
          </View>

          <View style={styles.loadInfoRow}>
            <Package size={16} color="#6B7280" />
            <Text style={styles.loadInfoLabel}>Description</Text>
          </View>
          <Text style={styles.loadInfoDescription}>
            {load.cargo?.description || 'No description provided'}
          </Text>
        </View>

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>📞 Contact Shipper</Text>
          
          <View style={styles.contactButtons}>
            <TouchableOpacity style={styles.contactButton} onPress={handleCallShipper}>
              <Phone size={18} color="#FFFFFF" />
              <Text style={styles.contactButtonText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactButton} onPress={handleMessageShipper}>
              <MessageCircle size={18} color="#FFFFFF" />
              <Text style={styles.contactButtonText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {isLoadAccepted && (
          <View style={styles.navigationCard}>
            <View style={styles.navigationHeader}>
              <View style={styles.navigationIconBadge}>
                <Navigation size={20} color="#1E40AF" />
              </View>
              <Text style={styles.navigationTitle}>Navigation & Tracking</Text>
            </View>

            <View style={styles.pickupLocationCard}>
              <Text style={styles.pickupLocationLabel}>Next Stop: Pickup Location</Text>
              <Text style={styles.pickupLocationValue}>
                {load.pickup?.city || 'N/A'}, {load.pickup?.state || ''}
              </Text>
            </View>

            <TouchableOpacity style={styles.navigateButton} onPress={handleNavigateToPickup}>
              <Navigation size={20} color="#FFFFFF" />
              <Text style={styles.navigateButtonText}>Start Navigation</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmPickup}>
              <Camera size={20} color="#FFFFFF" />
              <Text style={styles.confirmButtonText}>Confirm Pickup (Upload Photos)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.voiceButton}
              onPress={() => setVoiceGuidanceOn(!voiceGuidanceOn)}
            >
              <Volume2 size={18} color="#6B7280" />
              <Text style={styles.voiceButtonText}>
                Voice Guidance {voiceGuidanceOn ? 'On' : 'Off'}
              </Text>
            </TouchableOpacity>
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
            <Text style={styles.modalTitle}>Upload Pickup Photos</Text>
            <TouchableOpacity onPress={() => setShowPhotosModal(false)}>
              <X size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <View style={styles.photoUploadPlaceholder}>
              <Camera size={64} color="#9CA3AF" />
              <Text style={styles.photosPlaceholder}>Photo upload feature coming soon</Text>
              <Text style={styles.photosSubtext}>Take photos of the cargo and BOL</Text>
            </View>
          </View>
        </View>
      </Modal>

      {!isLoadAccepted && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity 
            style={[styles.acceptButton, accepting && styles.acceptButtonDisabled]} 
            onPress={handleAcceptLoad}
            disabled={accepting}
          >
            {accepting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <CheckCircle size={20} color="#FFFFFF" />
                <Text style={styles.acceptButtonText}>Accept Load</Text>
              </>
            )}
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
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 15,
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
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  vehicleTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E40AF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  vehicleTypeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  acceptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  acceptedBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  shipperSection: {
    marginBottom: 20,
  },
  shipperLabel: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1E40AF',
    marginBottom: 4,
  },
  routeText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#4B5563',
    marginBottom: 4,
  },
  loadIdText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  rateCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  rateLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  rateAmount: {
    fontSize: 40,
    fontWeight: '700' as const,
    color: '#10B981',
    marginBottom: 4,
  },
  ratePerMile: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#059669',
    marginBottom: 4,
  },
  distanceText: {
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
  analyticsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  analyticsItem: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  analyticsLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  analyticsCost: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#EF4444',
    marginBottom: 4,
  },
  analyticsProfit: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#10B981',
    marginBottom: 4,
  },
  analyticsValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#3B82F6',
    marginBottom: 4,
  },
  analyticsSubtext: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  locationInfo: {
    flex: 1,
  },
  locationCity: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 13,
    color: '#6B7280',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  timeText: {
    fontSize: 13,
    color: '#6B7280',
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
  loadInfoDescription: {
    fontSize: 13,
    color: '#4B5563',
    marginLeft: 24,
    marginTop: 4,
  },
  contactCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 15,
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
  },
  voiceButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  footer: {
    backgroundColor: Colors.light.cardBackground,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    paddingVertical: 16,
  },
  acceptButtonDisabled: {
    backgroundColor: '#9CA3AF',
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
  photoUploadPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  photosPlaceholder: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
  },
  photosSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
});
