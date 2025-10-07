import React, { useState, useEffect, useRef } from 'react';
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
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

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
        <Stack.Screen options={{ title: 'Command Center', headerShown: false }} />
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Initializing Command Center...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Command Center', headerShown: false }} />
      
      <View style={styles.gradientBackground} />
      
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <View style={styles.headerLeft}>
          <RadioTower size={28} color="#FFFFFF" />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>LOADRUSH COMMAND CENTER</Text>
            <Text style={styles.headerSubtitle}>
              Live Fleet Tracking Dashboard
            </Text>
          </View>
        </View>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>System Stable</Text>
        </View>
      </Animated.View>

      <View style={styles.content}>
        <Animated.View style={[styles.sidebar, isSmallScreen && styles.sidebarSmall, { opacity: fadeAnim }]}>
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
        </Animated.View>

        <Animated.View style={[styles.mapContainer, { opacity: fadeAnim }]}>
          <View style={styles.darkMapPlaceholder}>
            <View style={styles.mapGrid}>
              {drivers.map((driver) => (
                <AnimatedMarker
                  key={driver.id}
                  driver={driver}
                  onPress={() => openPanel(driver.id)}
                  isSelected={selectedDriver === driver.id}
                />
              ))}
            </View>
            <View style={styles.mapOverlay}>
              <MapPin size={64} color="rgba(37, 99, 235, 0.3)" />
              <Text style={styles.mapOverlayText}>
                {drivers.length} Active Drivers
              </Text>
              <Text style={styles.mapOverlaySubtext}>
                Live tracking across continental U.S.
              </Text>
            </View>
          </View>
        </Animated.View>
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

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View
        style={[
          styles.driverCard,
          isSelected && styles.driverCardSelected,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View
          style={[
            styles.statusBar,
            { backgroundColor: getStatusColor(driver.status) },
          ]}
        />
        <View style={styles.driverCardContent}>
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
              <Route size={12} color="#94A3B8" />
              <Text style={styles.etaText}>
                ETA: {routeData.durationFormatted} • {Math.round(routeData.distanceMiles)} mi
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
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
      <PulsingDot color={getStatusColor(status)} size={10} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

interface PulsingDotProps {
  color: string;
  size: number;
}

function PulsingDot({ color, size }: PulsingDotProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View
        style={[
          styles.legendDot,
          {
            backgroundColor: color,
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.legendDotGlow,
          {
            backgroundColor: color,
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
    </View>
  );
}

interface AnimatedMarkerProps {
  driver: {
    id: string;
    driverId: string;
    name: string;
    status: DriverStatus;
    location: {
      latitude: number;
      longitude: number;
    };
  };
  onPress: () => void;
  isSelected: boolean;
}

function AnimatedMarker({ driver, onPress, isSelected }: AnimatedMarkerProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseSpeed = driver.status === 'breakdown' ? 1500 : 1000;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.5,
          duration: pulseSpeed,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: pulseSpeed,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [driver.status]);

  const markerColor = getStatusColor(driver.status);
  const markerSize = isSelected ? 24 : 18;

  return (
    <TouchableOpacity
      style={[
        styles.mapMarker,
        {
          left: `${((driver.location.longitude + 125) / 60) * 100}%`,
          top: `${((50 - driver.location.latitude) / 25) * 100}%`,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.markerGlow,
          {
            backgroundColor: markerColor,
            width: markerSize * 2,
            height: markerSize * 2,
            borderRadius: markerSize,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
      <View
        style={[
          styles.markerCore,
          {
            backgroundColor: markerColor,
            width: markerSize,
            height: markerSize,
            borderRadius: markerSize / 2,
          },
        ]}
      >
        {isSelected && <View style={styles.markerSelected} />}
      </View>
    </TouchableOpacity>
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
    backgroundColor: '#0A0F1F',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0F1F',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0F1F',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '500' as const,
  },
  header: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 41, 59, 0.5)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 1.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500' as const,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#22C55E',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: isSmallScreen ? '100%' : '30%',
    maxWidth: 400,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(30, 41, 59, 0.5)',
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(12px)',
    }),
  },
  sidebarSmall: {
    width: '35%',
    minWidth: 280,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 41, 59, 0.5)',
  },
  sidebarTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#F1F5F9',
  },
  driverCount: {
    backgroundColor: 'rgba(37, 99, 235, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.5)',
  },
  driverCountText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#60A5FA',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 41, 59, 0.5)',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
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
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500' as const,
  },
  legendDotGlow: {
    position: 'absolute',
    opacity: 0.4,
  },
  driverList: {
    flex: 1,
  },
  driverCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(8px)',
    }),
  },
  driverCardSelected: {
    borderColor: 'rgba(37, 99, 235, 0.8)',
    backgroundColor: 'rgba(30, 58, 138, 0.3)',
    shadowColor: '#2563EB',
    shadowOpacity: 0.5,
  },
  statusBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  driverCardContent: {
    padding: 14,
    paddingLeft: 18,
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
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#94A3B8',
    marginBottom: 4,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#F1F5F9',
  },
  statusIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 4,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  currentLoad: {
    fontSize: 13,
    color: '#60A5FA',
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(30, 41, 59, 0.5)',
  },
  etaText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600' as const,
  },
  statusLabel: {
    fontSize: 13,
    color: '#CBD5E1',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  darkMapPlaceholder: {
    flex: 1,
    backgroundColor: '#0F172A',
    position: 'relative',
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A',
  },
  mapOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -60 }],
    width: 200,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.4,
  },
  mapOverlayText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#60A5FA',
    textAlign: 'center',
  },
  mapOverlaySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  mapMarker: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerGlow: {
    position: 'absolute',
    opacity: 0.3,
  },
  markerCore: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  markerSelected: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  panelOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 999,
  },
  detailPanel: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 1000,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(30, 41, 59, 0.8)',
  },
  panelHeader: {
    backgroundColor: 'rgba(30, 58, 138, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(37, 99, 235, 0.3)',
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
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    padding: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  driverAvatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(37, 99, 235, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(37, 99, 235, 0.5)',
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
    color: '#F1F5F9',
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
    color: '#60A5FA',
  },
  infoCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500' as const,
  },
  infoValue: {
    fontSize: 14,
    color: '#F1F5F9',
    fontWeight: '600' as const,
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
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
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 4,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#F1F5F9',
    minWidth: 40,
    textAlign: 'right',
  },
  viewRouteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.5)',
  },
  viewRouteButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#64748B',
  },
});
