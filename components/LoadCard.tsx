import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Load, DriverProfile } from '@/types';
import Colors from '@/constants/colors';
import { TrendingUp, DollarSign, TrendingDown, Clock, Fuel, Gauge, Package, X, MapPin } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { generateText } from '@rork/toolkit-sdk';

interface LoadAnalytics {
  miles: number;
  mpg: number;
  fuelType: string;
  fuelPrice: number;
  gallonsNeeded: string;
  fuelCost: string;
  gross: number;
  netProfit: string;
  profitPerMile: string;
  eta: string;
}

interface LoadCardProps {
  load: Load & {
    available?: boolean;
    rushDelivery?: boolean;
    analytics?: LoadAnalytics;
  };
  onPress?: () => void;
  showAIScore?: boolean;
  mode?: 'summary' | 'expanded';
}

interface BackhaulLoad {
  origin: string;
  destination: string;
  miles: number;
  rate: number;
  profitPerMile: number;
  eta: string;
  deadheadMiles: number;
}

export default function LoadCard({ load, onPress, showAIScore = false, mode = 'summary' }: LoadCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [showBackhaulModal, setShowBackhaulModal] = useState(false);
  const [backhaulLoads, setBackhaulLoads] = useState<BackhaulLoad[]>([]);
  const [loadingBackhaul, setLoadingBackhaul] = useState(false);
  const [backhaulError, setBackhaulError] = useState<string | null>(null);
  
  const getStatusLabel = (status: Load['status']) => {
    if (status === 'posted') return 'Pending';
    if (status === 'matched') return 'Matched';
    if (status === 'in_transit') return 'In Transit';
    if (status === 'delivered') return 'Delivered';
    return status;
  };

  const bidsCount = Math.floor(Math.random() * 8) + 2;
  
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/(driver)/load-details?id=${load.id}`);
    }
  };

  const analytics = useMemo(() => {
    if (load.analytics) {
      return load.analytics;
    }

    const driverProfile = user?.role === 'driver' ? (user.profile as DriverProfile) : null;
    const mpg = driverProfile?.truckInfo?.mpg || 0;
    const fuelType = driverProfile?.truckInfo?.fuelType || 'Diesel';
    const fuelPrice = 3.85;
    const miles = load.distance || 0;
    const rate = load.rate || 0;

    if (!mpg || mpg <= 0 || !miles || !rate) {
      return null;
    }

    const gallonsNeeded = miles / mpg;
    const fuelCost = gallonsNeeded * fuelPrice;
    const netProfit = rate - fuelCost;
    const profitPerMile = netProfit / miles;
    
    const avgSpeed = 55;
    const hoursToDestination = miles / avgSpeed;
    const etaDate = new Date();
    etaDate.setHours(etaDate.getHours() + hoursToDestination);
    const etaFormatted = etaDate.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' + 
                         etaDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

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
      eta: etaFormatted,
    };
  }, [load.analytics, load.distance, load.rate, user]);

  const getStatusPills = () => {
    const pills = [];
    
    if (load.status === 'delivered') {
      pills.push({ label: 'Completed', color: '#9CA3AF', borderColor: '#9CA3AF', key: 'completed' });
    } else if (load.status === 'in_transit') {
      pills.push({ label: 'In Transit', color: '#F59E0B', borderColor: '#F59E0B', key: 'in_transit' });
    } else if (load.available) {
      pills.push({ label: 'Available', color: '#2563EB', borderColor: '#2563EB', key: 'available' });
      if (load.rushDelivery) {
        pills.push({ label: 'Rush Delivery', color: '#F97316', borderColor: '#F97316', key: 'rush' });
      }
    }
    
    return pills;
  };

  const statusPills = getStatusPills();

  const handleBackhaulPress = async () => {
    const driverProfile = user?.role === 'driver' ? (user.profile as DriverProfile) : null;
    
    if (!driverProfile?.truckInfo?.mpg) {
      setBackhaulError('Add MPG in your Vehicle Profile to unlock Backhaul analytics.');
      setShowBackhaulModal(true);
      return;
    }

    setShowBackhaulModal(true);
    setLoadingBackhaul(true);
    setBackhaulError(null);

    try {
      const deliveryLocation = `${load.dropoff.city}, ${load.dropoff.state}`;
      const vehicleType = driverProfile.truckInfo?.make + ' ' + driverProfile.truckInfo?.model || 'Semi Truck';
      const trailerType = driverProfile.trailerInfo?.type || 'Dry Van';
      const trailerLength = driverProfile.trailerInfo?.length || 53;
      const trailerCapacity = driverProfile.trailerInfo?.capacity || 45000;
      const mpg = driverProfile.truckInfo?.mpg || 8.5;
      const dotNumber = driverProfile.dotNumber;

      const prompt = `You are a logistics AI assistant. Generate 3-5 realistic backhaul load opportunities for a truck driver.

Driver Profile:
- Vehicle: ${vehicleType}
- Trailer: ${trailerType}, ${trailerLength}ft, ${trailerCapacity}lbs capacity
- MPG: ${mpg}
- DOT: ${dotNumber}
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
      console.log('Backhaul AI response:', response);
      
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
      }
      
      const parsedLoads = JSON.parse(cleanedResponse);
      
      if (Array.isArray(parsedLoads) && parsedLoads.length > 0) {
        setBackhaulLoads(parsedLoads);
      } else {
        setBackhaulError('No backhaul loads available near this delivery.');
      }
    } catch (error) {
      console.error('Error fetching backhaul loads:', error);
      setBackhaulError('Failed to load backhaul options. Please try again.');
    } finally {
      setLoadingBackhaul(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.statusBadgesContainer}>
        {statusPills.map((pill) => (
          <View key={pill.key} style={[styles.statusBadge, { backgroundColor: pill.color, borderColor: pill.borderColor }]}>
            <Text style={styles.statusText}>{pill.label}</Text>
          </View>
        ))}
      </View>

      {showAIScore && load.aiScore && (
        <View style={styles.aiScoreBadge}>
          <TrendingUp size={12} color={Colors.light.success} />
          <Text style={styles.aiScoreText}>{load.aiScore}%</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.statusLine}>Status: {getStatusLabel(load.status)}</Text>
        <Text style={styles.rateLine}>Rate: ${(load.rate || 0).toLocaleString()}</Text>
        <Text style={styles.routeLine}>
          Route: {load.pickup?.city || 'N/A'}, {load.pickup?.state || 'N/A'} → {load.dropoff?.city || 'N/A'}, {load.dropoff?.state || 'N/A'}
        </Text>
        <Text style={styles.bidsLine}>Bids: {bidsCount}</Text>
      </View>

      {analytics ? (
        mode === 'summary' ? (
          <View style={styles.analyticsSummarySection}>
            <Text style={styles.analyticsSummaryTitle}>Live Analytics</Text>
            
            <View style={styles.analyticsSummaryGrid}>
              <View style={styles.analyticsSummaryItem}>
                <View style={styles.analyticsSummaryIconContainer}>
                  <TrendingDown size={14} color="#EF4444" />
                </View>
                <Text style={styles.analyticsSummaryLabel}>Fuel Cost</Text>
                <Text style={styles.analyticsSummaryValueCost}>${analytics.fuelCost}</Text>
              </View>
              
              <View style={styles.analyticsSummaryItem}>
                <View style={styles.analyticsSummaryIconContainer}>
                  <DollarSign size={14} color="#22C55E" />
                </View>
                <Text style={styles.analyticsSummaryLabel}>Net Profit</Text>
                <Text style={styles.analyticsSummaryValueProfit}>${analytics.netProfit}</Text>
              </View>
              
              <View style={styles.analyticsSummaryItem}>
                <View style={styles.analyticsSummaryIconContainer}>
                  <TrendingUp size={14} color="#3B82F6" />
                </View>
                <Text style={styles.analyticsSummaryLabel}>Profit/Mile</Text>
                <Text style={styles.analyticsSummaryValue}>${analytics.profitPerMile}</Text>
              </View>
              
              <View style={styles.analyticsSummaryItem}>
                <View style={styles.analyticsSummaryIconContainer}>
                  <Clock size={14} color="#F59E0B" />
                </View>
                <Text style={styles.analyticsSummaryLabel}>ETA</Text>
                <Text style={styles.analyticsSummaryValue}>{analytics.eta}</Text>
              </View>
            </View>
            
            <View style={styles.analyticsSummaryFooter}>
              <Text style={styles.analyticsSummaryFooterText}>
                Based on driver profile ({analytics.mpg} MPG, ${analytics.fuelPrice} {analytics.fuelType}).
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.analyticsSection}>
            <Text style={styles.analyticsSectionTitle}>Live Fuel Analytics</Text>
            
            <View style={styles.analyticsGrid}>
              <View style={styles.analyticsItem}>
                <View style={styles.analyticsIconContainer}>
                  <Gauge size={16} color="#3B82F6" />
                </View>
                <Text style={styles.analyticsLabel}>Miles</Text>
                <Text style={styles.analyticsValue}>{analytics.miles}</Text>
              </View>
              
              <View style={styles.analyticsItem}>
                <View style={styles.analyticsIconContainer}>
                  <TrendingUp size={16} color="#10B981" />
                </View>
                <Text style={styles.analyticsLabel}>MPG</Text>
                <Text style={styles.analyticsValue}>{analytics.mpg}</Text>
              </View>
              
              <View style={styles.analyticsItem}>
                <View style={styles.analyticsIconContainer}>
                  <Fuel size={16} color="#8B5CF6" />
                </View>
                <Text style={styles.analyticsLabel}>Fuel Type</Text>
                <Text style={styles.analyticsValue}>{analytics.fuelType}</Text>
              </View>
              
              <View style={styles.analyticsItem}>
                <View style={styles.analyticsIconContainer}>
                  <DollarSign size={16} color="#F59E0B" />
                </View>
                <Text style={styles.analyticsLabel}>Fuel Price</Text>
                <Text style={styles.analyticsValue}>${analytics.fuelPrice}/gal</Text>
              </View>
              
              <View style={styles.analyticsItem}>
                <View style={styles.analyticsIconContainer}>
                  <Fuel size={16} color="#8B5CF6" />
                </View>
                <Text style={styles.analyticsLabel}>Gallons Needed</Text>
                <Text style={styles.analyticsValue}>{analytics.gallonsNeeded}</Text>
              </View>
              
              <View style={styles.analyticsItem}>
                <View style={styles.analyticsIconContainer}>
                  <TrendingDown size={16} color="#EF4444" />
                </View>
                <Text style={styles.analyticsLabel}>Fuel Cost</Text>
                <Text style={styles.analyticsValueCost}>${analytics.fuelCost}</Text>
              </View>
              
              <View style={styles.analyticsItem}>
                <View style={styles.analyticsIconContainer}>
                  <DollarSign size={16} color="#059669" />
                </View>
                <Text style={styles.analyticsLabel}>Gross</Text>
                <Text style={styles.analyticsValueGross}>${analytics.gross.toLocaleString()}</Text>
              </View>
              
              <View style={styles.analyticsItem}>
                <View style={styles.analyticsIconContainer}>
                  <DollarSign size={16} color="#22C55E" />
                </View>
                <Text style={styles.analyticsLabel}>Net</Text>
                <Text style={styles.analyticsValueProfit}>${analytics.netProfit}</Text>
              </View>
              
              <View style={styles.analyticsItem}>
                <View style={styles.analyticsIconContainer}>
                  <TrendingUp size={16} color="#3B82F6" />
                </View>
                <Text style={styles.analyticsLabel}>Profit/Mile</Text>
                <Text style={styles.analyticsValue}>${analytics.profitPerMile}</Text>
              </View>
              
              <View style={[styles.analyticsItem, styles.analyticsItemWide]}>
                <View style={styles.analyticsIconContainer}>
                  <Clock size={16} color="#F59E0B" />
                </View>
                <Text style={styles.analyticsLabel}>ETA</Text>
                <Text style={styles.analyticsValue}>{analytics.eta}</Text>
              </View>
            </View>
            
            <View style={styles.analyticsFooter}>
              <Text style={styles.analyticsFooterText}>
                Estimated from driver profile.
              </Text>
            </View>
          </View>
        )
      ) : (
        <View style={styles.analyticsPlaceholder}>
          <Text style={styles.analyticsPlaceholderText}>
            Add MPG in Profile → Vehicle to unlock analytics.
          </Text>
        </View>
      )}

      {mode === 'expanded' && load.status === 'in_transit' && (
        <TouchableOpacity 
          style={styles.backhaulPill} 
          onPress={handleBackhaulPress}
          activeOpacity={0.7}
        >
          <Package size={16} color="#FFFFFF" />
          <Text style={styles.backhaulPillText}>Backhaul Options</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.detailsButton} onPress={handlePress}>
        <Text style={styles.detailsButtonText}>Tap for Details</Text>
      </TouchableOpacity>

      <Modal
        visible={showBackhaulModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBackhaulModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Backhaul Options</Text>
            <TouchableOpacity onPress={() => setShowBackhaulModal(false)}>
              <X size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {loadingBackhaul ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF9500" />
                <Text style={styles.loadingText}>Finding backhaul loads...</Text>
              </View>
            ) : backhaulError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{backhaulError}</Text>
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
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#1E3A8A',
    position: 'relative' as const,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  statusBadgesContainer: {
    position: 'absolute' as const,
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    maxWidth: '70%',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  aiScoreBadge: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  aiScoreText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.light.success,
  },
  content: {
    marginTop: 36,
    marginBottom: 12,
  },
  statusLine: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E293B',
    marginBottom: 6,
  },
  rateLine: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 6,
  },
  routeLine: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#475569',
    marginBottom: 6,
  },
  bidsLine: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#475569',
  },
  detailsButton: {
    alignSelf: 'center',
    marginTop: 8,
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#2563EB',
  },
  analyticsSection: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  analyticsSectionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 14,
    textAlign: 'center',
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  analyticsItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  analyticsItemWide: {
    minWidth: '100%',
  },
  analyticsIconContainer: {
    marginBottom: 6,
  },
  analyticsLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#64748B',
    marginBottom: 4,
    textAlign: 'center',
  },
  analyticsValue: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#1E293B',
    textAlign: 'center',
  },
  analyticsValueGross: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#059669',
    textAlign: 'center',
  },
  analyticsValueCost: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#EF4444',
    textAlign: 'center',
  },
  analyticsValueProfit: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#22C55E',
    textAlign: 'center',
  },
  analyticsFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  analyticsFooterText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
  analyticsPlaceholder: {
    marginTop: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  analyticsPlaceholderText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#92400E',
    textAlign: 'center',
  },
  analyticsSummarySection: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  analyticsSummaryTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 10,
    textAlign: 'center',
  },
  analyticsSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  analyticsSummaryItem: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  analyticsSummaryIconContainer: {
    marginBottom: 4,
  },
  analyticsSummaryLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#64748B',
    marginBottom: 3,
    textAlign: 'center',
  },
  analyticsSummaryValue: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#1E293B',
    textAlign: 'center',
  },
  analyticsSummaryValueCost: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#EF4444',
    textAlign: 'center',
  },
  analyticsSummaryValueProfit: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#22C55E',
    textAlign: 'center',
  },
  analyticsSummaryFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  analyticsSummaryFooterText: {
    fontSize: 9,
    fontWeight: '500' as const,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 13,
  },
  backhaulPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F97316',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F97316',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  backhaulPillText: {
    fontSize: 14,
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
  loadingText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
    marginTop: 16,
  },
  errorContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#92400E',
    textAlign: 'center',
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
});
