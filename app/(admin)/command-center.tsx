import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Pressable,
} from 'react-native';
import { Stack } from 'expo-router';

import { RadioTower, MapPin, X, Navigation, Package, Clock, TrendingUp, Route } from 'lucide-react-native';
import { useCommandCenterDrivers, DriverStatus } from '@/hooks/useCommandCenterDrivers';
import { useDriverRoute } from '@/hooks/useDriverRoute';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isSmallScreen = width < 768;

// Platform-specific map import handled via .native.tsx extension

export default function CommandCenter() {
  const { drivers, isLoading, error } = useCommandCenterDrivers();
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [panelAnimation] = useState(new Animated.Value(0));

  const openPanel = (driverId: string) => {
    setSelectedDriver(driverId);
    Animated.spring(panelAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closePanel = () => {
    Animated.timing(panelAnimation, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setSelectedDriver(null);
    });
  };

  const selectedDriverData = drivers.find((d) => d.id === selectedDriver);

  const initialRegion = {
    latitude: 39.8283,
    longitude: -98.5795,
    latitudeDelta: 25,
    longitudeDelta: 25,
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Command Center' }} />
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={styles.loadingText}>Loading Command Center...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Command Center' }} />
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <RadioTower size={24} color="#1E3A8A" />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>LoadRush Command Center</Text>
            <Text style={styles.headerSubtitle}>
              Monitor drivers, loads, and operational flow in real-time
            </Text>
          </View>
        </View>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>System Stable</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={[styles.sidebar, isSmallScreen && styles.sidebarSmall]}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>Active Drivers</Text>
            <View style={styles.driverCount}>
              <Text style={styles.driverCountText}>{drivers.length}</Text>
            </View>
          </View>

          <View style={styles.legendContainer}>
            <LegendItem status="pickup" label="Pickup" />
            <LegendItem status="in-transit" label="In Transit" />
            <LegendItem status="accomplished" label="Accomplished" />
            <LegendItem status="breakdown" label="Breakdown" />
          </View>

          <ScrollView
            style={styles.driverList}
            showsVerticalScrollIndicator={false}
          >
            {drivers.map((driver) => (
              <DriverCard
                key={driver.id}
                driver={driver}
                isSelected={selectedDriver === driver.id}
                onPress={() => openPanel(driver.id)}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.mapContainer}>
          {isWeb ? (
            <View style={styles.webMapPlaceholder}>
              <MapPin size={48} color="#9CA3AF" />
              <Text style={styles.webMapText}>
                Map view is optimized for mobile devices
              </Text>
              <Text style={styles.webMapSubtext}>
                {drivers.length} drivers active across the U.S.
              </Text>
              <View style={styles.driverLocationsWeb}>
                {drivers.slice(0, 5).map((driver) => (
                  <View key={driver.id} style={styles.locationItem}>
                    <View
                      style={[
                        styles.locationDot,
                        { backgroundColor: getStatusColor(driver.status) },
                      ]}
                    />
                    <Text style={styles.locationText}>
                      {driver.name} - {driver.location.latitude.toFixed(2)}°N, {driver.location.longitude.toFixed(2)}°W
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.webMapPlaceholder}>
              <MapPin size={48} color="#9CA3AF" />
              <Text style={styles.webMapText}>
                Native map view available on mobile
              </Text>
            </View>
          )}
        </View>
      </View>

      {selectedDriver && selectedDriverData && (
        <DriverDetailPanel
          driver={selectedDriverData}
          animation={panelAnimation}
          onClose={closePanel}
        />
      )}
    </View>
  );
}

interface DriverCardProps {
  driver: {
    id: string;
    driverId: string;
    name: string;
    status: DriverStatus;
    location: {
      latitude: number;
      longitude: number;
    };
    currentLoad?: string;
    pickupLocation?: {
      latitude: number;
      longitude: number;
    };
    dropoffLocation?: {
      latitude: number;
      longitude: number;
    };
  };
  isSelected: boolean;
  onPress: () => void;
}

function DriverCard({ driver, isSelected, onPress }: DriverCardProps) {
  const { routeData } = useDriverRoute({
    origin: driver.location,
    destination: driver.dropoffLocation || null,
    enabled: !!(driver.pickupLocation && driver.dropoffLocation),
  });

  return (
    <TouchableOpacity
      style={[styles.driverCard, isSelected && styles.driverCardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.driverCardHeader}>
        <View style={styles.driverInfo}>
          <Text style={styles.driverNumber}>{driver.driverId}</Text>
          <Text style={styles.driverName}>{driver.name}</Text>
        </View>
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: getStatusColor(driver.status) },
          ]}
        />
      </View>
      {driver.currentLoad && (
        <Text style={styles.currentLoad}>Load: {driver.currentLoad}</Text>
      )}
      <Text style={styles.statusLabel}>{getStatusLabel(driver.status)}</Text>
      {routeData && (
        <View style={styles.etaBadge}>
          <Route size={12} color="#1E3A8A" />
          <Text style={styles.etaText}>
            ETA: {routeData.durationFormatted} • {Math.round(routeData.distanceMiles)} mi
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

interface LegendItemProps {
  status: DriverStatus;
  label: string;
}

function LegendItem({ status, label }: LegendItemProps) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendDot,
          { backgroundColor: getStatusColor(status) },
        ]}
      />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

function getStatusColor(status: DriverStatus): string {
  switch (status) {
    case 'pickup':
      return '#22C55E';
    case 'in-transit':
      return '#F59E0B';
    case 'accomplished':
      return '#8B5CF6';
    case 'breakdown':
      return '#EF4444';
    default:
      return '#6B7280';
  }
}

function getStatusLabel(status: DriverStatus): string {
  switch (status) {
    case 'pickup':
      return 'Ready for Pickup';
    case 'in-transit':
      return 'In Transit';
    case 'accomplished':
      return 'Mission Accomplished';
    case 'breakdown':
      return 'Breakdown / Delay';
    default:
      return 'Unknown';
  }
}

interface DriverDetailPanelProps {
  driver: {
    id: string;
    driverId: string;
    name: string;
    status: DriverStatus;
    location: {
      latitude: number;
      longitude: number;
    };
    currentLoad?: string;
    lastUpdate: Date;
  };
  animation: Animated.Value;
  onClose: () => void;
}

function DriverDetailPanel({ driver, animation, onClose }: DriverDetailPanelProps) {
  const panelWidth = isSmallScreen ? width : Math.min(width * 0.35, 450);

  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [panelWidth, 0],
  });

  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const mockRouteData = {
    origin: 'Dallas, TX',
    destination: 'Houston, TX',
    distance: '245 miles',
    eta: '3.5 hours',
    progress: 65,
  };

  return (
    <>
      <Animated.View
        style={[
          styles.panelOverlay,
          {
            opacity,
            display: animation.interpolate({
              inputRange: [0, 0.01],
              outputRange: ['none' as const, 'flex' as const],
            }) as any,
          },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.detailPanel,
          {
            width: panelWidth,
            transform: [{ translateX }],
          },
        ]}
      >
        <View style={styles.panelHeader}>
          <View style={styles.panelHeaderLeft}>
            <Text style={styles.panelTitle}>Driver Details</Text>
            <Text style={styles.panelSubtitle}>{driver.driverId}</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.panelContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.driverSection}>
            <View style={styles.driverHeaderPanel}>
              <View style={styles.driverAvatarPlaceholder}>
                <Text style={styles.driverInitials}>
                  {driver.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </Text>
              </View>
              <View style={styles.driverMetaPanel}>
                <Text style={styles.driverNamePanel}>{driver.name}</Text>
                <View
                  style={[
                    styles.statusBadgePanel,
                    { backgroundColor: getStatusColor(driver.status) + '20' },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDotPanel,
                      { backgroundColor: getStatusColor(driver.status) },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusTextPanel,
                      { color: getStatusColor(driver.status) },
                    ]}
                  >
                    {getStatusLabel(driver.status)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {driver.currentLoad && (
            <View style={styles.infoSection}>
              <View style={styles.infoHeader}>
                <Package size={18} color="#1E3A8A" />
                <Text style={styles.infoHeaderText}>Current Load</Text>
              </View>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Load ID</Text>
                  <Text style={styles.infoValue}>{driver.currentLoad}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Route</Text>
                  <Text style={styles.infoValue}>
                    {mockRouteData.origin} → {mockRouteData.destination}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <Navigation size={18} color="#1E3A8A" />
              <Text style={styles.infoHeaderText}>Route Information</Text>
            </View>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Distance Remaining</Text>
                <Text style={styles.infoValue}>{mockRouteData.distance}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Estimated Time</Text>
                <Text style={styles.infoValue}>{mockRouteData.eta}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Progress</Text>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${mockRouteData.progress}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>{mockRouteData.progress}%</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoHeader}>
              <Clock size={18} color="#1E3A8A" />
              <Text style={styles.infoHeaderText}>Location</Text>
            </View>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Latitude</Text>
                <Text style={styles.infoValue}>
                  {driver.location.latitude.toFixed(4)}°N
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Longitude</Text>
                <Text style={styles.infoValue}>
                  {driver.location.longitude.toFixed(4)}°W
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Last Update</Text>
                <Text style={styles.infoValue}>
                  {driver.lastUpdate.toLocaleTimeString()}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.viewRouteButton}
            activeOpacity={0.7}
            disabled
          >
            <TrendingUp size={18} color="#9CA3AF" />
            <Text style={styles.viewRouteButtonText}>View Route (Coming Soon)</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E3A8A',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#059669',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: isSmallScreen ? '100%' : '30%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  sidebarSmall: {
    width: '35%',
    minWidth: 280,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
  },
  driverCount: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  driverCountText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500' as const,
  },
  driverList: {
    flex: 1,
  },
  driverCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  driverCardSelected: {
    borderColor: '#1E3A8A',
    backgroundColor: '#F0F4FF',
  },
  driverCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  driverInfo: {
    flex: 1,
  },
  driverNumber: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#6B7280',
    marginBottom: 2,
  },
  driverName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#111827',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  currentLoad: {
    fontSize: 12,
    color: '#1E3A8A',
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  etaText: {
    fontSize: 11,
    color: '#1E3A8A',
    fontWeight: '600' as const,
  },
  statusLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  webMapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 32,
  },
  webMapText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6B7280',
    textAlign: 'center',
  },
  webMapSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  driverLocationsWeb: {
    marginTop: 24,
    width: '100%',
    maxWidth: 400,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  locationText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500' as const,
  },
  panelOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 999,
  },
  detailPanel: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#F9FAFB',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 1000,
  },
  panelHeader: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1E40AF',
  },
  panelHeaderLeft: {
    flex: 1,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  panelSubtitle: {
    fontSize: 13,
    color: '#93C5FD',
    fontWeight: '500' as const,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  panelContent: {
    flex: 1,
    padding: 20,
  },
  driverSection: {
    marginBottom: 24,
  },
  driverHeaderPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  driverAvatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverInitials: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  driverMetaPanel: {
    flex: 1,
  },
  driverNamePanel: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 8,
  },
  statusBadgePanel: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusDotPanel: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusTextPanel: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoHeaderText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#1E3A8A',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500' as const,
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600' as const,
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginLeft: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#111827',
    minWidth: 40,
    textAlign: 'right',
  },
  viewRouteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 20,
  },
  viewRouteButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#9CA3AF',
  },
});
