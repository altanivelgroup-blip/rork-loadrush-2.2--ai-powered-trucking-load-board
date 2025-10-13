import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Switch,
} from 'react-native';
import { Stack } from 'expo-router';

import { RadioTower, MapPin, X, Navigation, Package, Clock, TrendingUp, Route, Monitor, Map as MapIcon, RotateCcw, Pause, Play, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react-native';
import { useCommandCenterDrivers, DriverStatus } from '@/hooks/useCommandCenterDrivers';
import { useDriverRoute } from '@/hooks/useDriverRoute';
import { useDriverPlayback, PlaybackLocation } from '@/hooks/useDriverPlayback';
import { useDemoSimulation, SimulationConfig } from '@/hooks/useDemoSimulation';

const reverseGeocodeCache = new Map<string, { city: string; state: string; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 60;

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isSmallScreen = width < 768;
const isTablet = width >= 768 && width < 1024;

// Platform-specific map import handled via .native.tsx extension
import { MapView, Marker, PROVIDER_GOOGLE } from '@/components/MapComponents';

export default function CommandCenter() {
  const { drivers, isLoading } = useCommandCenterDrivers();
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [panelAnimation] = useState(new Animated.Value(0));
  const [popupDriver, setPopupDriver] = useState<string | null>(null);
  const [popupAnimation] = useState(new Animated.Value(0));
  const [activeFilter, setActiveFilter] = useState<DriverStatus | 'all'>('all');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [projectorMode, setProjectorMode] = useState(false);
  const [currentCycleIndex, setCurrentCycleIndex] = useState(0);
  const cycleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const projectorOverlayAnim = useRef(new Animated.Value(0)).current;
  const isWindowFocused = useRef(true);
  const [viewMode, setViewMode] = useState<'dark' | 'map'>('dark');
  const mapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const sidebarAnimation = useRef(new Animated.Value(1)).current;
  const { isSimulating, startSimulation, stopSimulation, progress: simulationProgress } = useDemoSimulation();
  const USA_REGION = useMemo(() => ({
    latitude: 39.8283,
    longitude: -98.5795,
    latitudeDelta: Platform.OS === 'web' ? 22 : 25,
    longitudeDelta: Platform.OS === 'web' ? 40 : 45,
  }), []);
  const USA_BOUNDS = useMemo(() => ({
    north: 49.384358,
    south: 24.396308,
    west: -124.848974,
    east: -66.885444,
  }), []);
  const filteredDrivers = useMemo(() => {
    const list = activeFilter === 'all' ? drivers : drivers.filter((d) => d.status === activeFilter);
    return list;
  }, [drivers, activeFilter]);

  const fitAllDrivers = useCallback(() => {
    if (!mapRef.current) return;
    try {
      if (mapRef.current.animateToRegion) {
        mapRef.current.animateToRegion(USA_REGION, 600);
      }
    } catch (e) {
      console.log('[Map] fitAllDrivers error', e);
    }
  }, [USA_REGION]);

  const toggleSidebar = useCallback(() => {
    const toValue = sidebarCollapsed ? 1 : 0;
    setSidebarCollapsed(!sidebarCollapsed);
    
    Animated.spring(sidebarAnimation, {
      toValue,
      useNativeDriver: false,
      tension: 80,
      friction: 12,
    }).start(() => {
      if (toValue === 0 && Platform.OS === 'web' && viewMode === 'map') {
        setTimeout(() => {
          fitAllDrivers();
        }, 100);
      }
    });
  }, [sidebarCollapsed, sidebarAnimation, viewMode, fitAllDrivers]);

  const getMockLocationHistory = (driverId: string): PlaybackLocation[] => {
    const baseLocations: { [key: string]: PlaybackLocation[] } = {
      'mock-1': [
        { latitude: 32.7767, longitude: -96.7970, timestamp: Date.now() - 3600000 },
        { latitude: 32.5, longitude: -96.5, timestamp: Date.now() - 3000000 },
        { latitude: 32.0, longitude: -96.0, timestamp: Date.now() - 2400000 },
        { latitude: 31.5, longitude: -95.8, timestamp: Date.now() - 1800000 },
        { latitude: 31.0, longitude: -95.6, timestamp: Date.now() - 1200000 },
        { latitude: 30.5, longitude: -95.5, timestamp: Date.now() - 600000 },
        { latitude: 29.7604, longitude: -95.3698, timestamp: Date.now() },
      ],
      'mock-2': [
        { latitude: 29.7604, longitude: -95.3698, timestamp: Date.now() - 7200000 },
        { latitude: 30.5, longitude: -98.0, timestamp: Date.now() - 6000000 },
        { latitude: 31.5, longitude: -101.0, timestamp: Date.now() - 4800000 },
        { latitude: 32.5, longitude: -105.0, timestamp: Date.now() - 3600000 },
        { latitude: 33.0, longitude: -110.0, timestamp: Date.now() - 2400000 },
        { latitude: 33.5, longitude: -115.0, timestamp: Date.now() - 1200000 },
        { latitude: 34.0522, longitude: -118.2437, timestamp: Date.now() },
      ],
    };
    return baseLocations[driverId] || [];
  };

  const driversWithHistory = useMemo(() => filteredDrivers.filter((d) => getMockLocationHistory(d.id).length > 0), [filteredDrivers]);

  useEffect(() => {
    setIsMounted(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (Platform.OS === 'web') {
        isWindowFocused.current = !document.hidden;
      }
    };

    if (Platform.OS === 'web') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, []);

  useEffect(() => {
    if (projectorMode && filteredDrivers.length > 0) {
      Animated.timing(projectorOverlayAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();

      const startCycle = () => {
        if (cycleTimerRef.current) {
          clearInterval(cycleTimerRef.current);
        }

        cycleTimerRef.current = setInterval(() => {
          if (isWindowFocused.current) {
            setCurrentCycleIndex((prev) => (prev + 1) % filteredDrivers.length);
          }
        }, 15000);
      };

      startCycle();

      return () => {
        if (cycleTimerRef.current) {
          clearInterval(cycleTimerRef.current);
        }
      };
    } else {
      Animated.timing(projectorOverlayAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();

      if (cycleTimerRef.current) {
        clearInterval(cycleTimerRef.current);
      }
      setCurrentCycleIndex(0);
    }
  }, [projectorMode, filteredDrivers.length, projectorOverlayAnim]);

  useEffect(() => {
    if (projectorMode && filteredDrivers.length > 0) {
      const safeIndex = currentCycleIndex % filteredDrivers.length;
      const currentDriver = filteredDrivers[safeIndex];
      if (currentDriver) {
        console.log(`[Projector Mode] Cycling to driver: ${currentDriver.name} (${currentDriver.driverId})`);
      }
    }
  }, [currentCycleIndex, projectorMode, filteredDrivers.length]);

  useEffect(() => {
    if (filteredDrivers.length === 0) {
      setCurrentCycleIndex(0);
      if (cycleTimerRef.current) {
        clearInterval(cycleTimerRef.current);
      }
    } else if (currentCycleIndex >= filteredDrivers.length) {
      setCurrentCycleIndex(0);
    }
  }, [filteredDrivers.length]);

  const openPanel = (driverId: string) => {
    setSelectedDriver(driverId);
    Animated.spring(panelAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const openPopup = (driverId: string) => {
    setPopupDriver(driverId);
    Animated.spring(popupAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  };

  const closePopup = () => {
    Animated.timing(popupAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setPopupDriver(null);
    });
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
  const popupDriverData = drivers.find((d) => d.id === popupDriver);

  const getStatusCount = (status: DriverStatus | 'all') => {
    if (status === 'all') return drivers.length;
    return drivers.filter((d) => d.status === status).length;
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
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[
              styles.modeToggle,
              viewMode === 'map' && styles.modeToggleActive,
            ]}
            onPress={() => {
              console.log('[ViewToggle] Toggling view mode');
              if (projectorMode) setProjectorMode(false);
              setViewMode((prev) => (prev === 'dark' ? 'map' : 'dark'));
            }}
            activeOpacity={0.7}
          >
            <MapIcon size={18} color={viewMode === 'map' ? '#60A5FA' : '#94A3B8'} />
            <Text style={[styles.modeLabel, viewMode === 'map' && styles.modeLabelActive]}>
              View: {viewMode === 'dark' ? 'Dark' : 'Map'}
            </Text>
          </TouchableOpacity>
          <View style={styles.demoToggle}>
            <Play size={18} color={isSimulating ? '#22C55E' : '#60A5FA'} />
            <Text style={styles.demoLabel}>Demo Mode</Text>
            <Switch
              value={isSimulating}
              onValueChange={(value) => {
                if (value) {
                  const demoConfigs: SimulationConfig[] = filteredDrivers
                    .filter(d => d.pickupLocation && d.dropoffLocation)
                    .slice(0, 6)
                    .map(d => ({
                      driverId: d.id,
                      startLocation: d.location,
                      endLocation: { lat: d.dropoffLocation!.latitude, lng: d.dropoffLocation!.longitude },
                      durationSeconds: 30 + Math.random() * 15,
                    }));
                  
                  if (demoConfigs.length > 0) {
                    console.log('[CommandCenter] Starting demo with', demoConfigs.length, 'drivers');
                    startSimulation(demoConfigs);
                  }
                } else {
                  stopSimulation();
                }
              }}
              trackColor={{ false: '#334155', true: '#22C55E' }}
              thumbColor={isSimulating ? '#22C55E' : '#94A3B8'}
              ios_backgroundColor="#334155"
            />
          </View>
          <View style={styles.projectorToggle}>
            <Monitor size={18} color="#60A5FA" />
            <Text style={styles.projectorLabel}>Projector Mode</Text>
            <Switch
              value={projectorMode}
              onValueChange={(value) => {
                if (value) setViewMode('map');
                setProjectorMode(value);
              }}
              trackColor={{ false: '#334155', true: '#2563EB' }}
              thumbColor={projectorMode ? '#60A5FA' : '#94A3B8'}
              ios_backgroundColor="#334155"
            />
          </View>
          {isSimulating && (
            <View style={[styles.statusBadge, { backgroundColor: 'rgba(34, 197, 94, 0.15)', borderColor: 'rgba(34, 197, 94, 0.3)' }]}>
              <View style={[styles.statusDot, { backgroundColor: '#22C55E' }]} />
              <Text style={[styles.statusText, { color: '#22C55E' }]}>Demo Active {simulationProgress.toFixed(0)}%</Text>
            </View>
          )}
          {!isSimulating && (
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>System Stable</Text>
            </View>
          )}
        </View>
      </Animated.View>

      {!projectorMode && (
        <Animated.View style={[styles.filterBar, { opacity: fadeAnim }]}>
        <FilterButton
          label="All"
          count={getStatusCount('all')}
          isActive={activeFilter === 'all'}
          onPress={() => setActiveFilter('all')}
        />
        <FilterButton
          label="Pickup"
          count={getStatusCount('pickup')}
          isActive={activeFilter === 'pickup'}
          onPress={() => setActiveFilter('pickup')}
          color="#22C55E"
        />
        <FilterButton
          label="In Transit"
          count={getStatusCount('in_transit')}
          isActive={activeFilter === 'in_transit'}
          onPress={() => setActiveFilter('in_transit')}
          color="#F59E0B"
        />
        <FilterButton
          label="Accomplished"
          count={getStatusCount('accomplished')}
          isActive={activeFilter === 'accomplished'}
          onPress={() => setActiveFilter('accomplished')}
          color="#8B5CF6"
        />
        <FilterButton
          label="Breakdown"
          count={getStatusCount('breakdown')}
          isActive={activeFilter === 'breakdown'}
          onPress={() => setActiveFilter('breakdown')}
          color="#EF4444"
        />
        </Animated.View>
      )}

      <View style={styles.content}>
        {!projectorMode && (
          <TouchableOpacity
            style={[
              styles.sidebarToggleButton,
              sidebarCollapsed && styles.sidebarToggleButtonCollapsed,
            ]}
            onPress={toggleSidebar}
            activeOpacity={0.8}
            testID="sidebarToggleButton"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen size={20} color="#60A5FA" />
            ) : (
              <PanelLeftClose size={20} color="#60A5FA" />
            )}
          </TouchableOpacity>
        )}
        {!projectorMode && (
          <Animated.View
            style={[
              styles.sidebar,
              isSmallScreen && styles.sidebarSmall,
              { opacity: fadeAnim },
              {
                width: sidebarAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, isTablet ? 320 : (isSmallScreen ? width * 0.35 : 400)],
                }),
                minWidth: sidebarAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, isTablet ? 320 : (isSmallScreen ? 280 : 400)],
                }),
                opacity: sidebarAnimation.interpolate({
                  inputRange: [0, 0.3, 1],
                  outputRange: [0, 0, 1],
                }),
                overflow: 'hidden',
              },
            ]}
          >
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>Active Drivers</Text>
            <View style={styles.driverCount}>
              <Text style={styles.driverCountText}>{drivers.length}</Text>
            </View>
          </View>

          <View style={styles.legendContainer}>
            <LegendItem status="pickup" label="Pickup" />
            <LegendItem status="in_transit" label="In Transit" />
            <LegendItem status="accomplished" label="Accomplished" />
            <LegendItem status="breakdown" label="Breakdown" />
          </View>

          <ScrollView
            style={styles.driverList}
            showsVerticalScrollIndicator={false}
          >
            {filteredDrivers.map((driver) => (
              <DriverCard
                key={driver.id}
                driver={driver}
                isSelected={selectedDriver === driver.id}
                onPress={() => openPanel(driver.id)}
              />
            ))}
          </ScrollView>
          </Animated.View>
        )}

        <Animated.View style={[
          styles.mapContainer,
          (projectorMode || viewMode === 'map') && styles.mapContainerFullscreen,
          { opacity: fadeAnim },
          isTablet && viewMode === 'map' && !sidebarCollapsed && styles.mapContainerTablet,
        ]}>
          {viewMode === 'map' && MapView ? (
            <MapView
              ref={mapRef}
              style={[
                { flex: 1, minHeight: 300, backgroundColor: '#0F172A' },
                isTablet && { maxHeight: '85vh' },
              ]}
              provider={Platform.select({ ios: undefined, android: PROVIDER_GOOGLE, web: undefined })}
              initialRegion={{
                latitude: USA_REGION.latitude,
                longitude: USA_REGION.longitude,
                latitudeDelta: USA_REGION.latitudeDelta,
                longitudeDelta: USA_REGION.longitudeDelta,
              }}
              minZoomLevel={3}
              maxZoomLevel={18}
              onRegionChangeComplete={(region: any) => {
                try {
                  if (!mapReady) return;
                  const correctingRef = (mapRef as React.MutableRefObject<any>) as any;
                  if (!correctingRef.current) return;
                  correctingRef.current.__isCorrecting = correctingRef.current.__isCorrecting ?? false;
                  correctingRef.current.__lastCorrectionTs = correctingRef.current.__lastCorrectionTs ?? 0;

                  const latDelta = region.latitudeDelta ?? 0;
                  const lngDelta = region.longitudeDelta ?? 0;
                  
                  const outOfBounds =
                    region.latitude > USA_BOUNDS.north + 8 ||
                    region.latitude < USA_BOUNDS.south - 8 ||
                    region.longitude < USA_BOUNDS.west - 20 ||
                    region.longitude > USA_BOUNDS.east + 20;

                  const tooZoomedOut = latDelta > 60 || lngDelta > 100;
                  const now = Date.now();
                  const cooldownPassed = now - correctingRef.current.__lastCorrectionTs > 2000;

                  if ((outOfBounds || tooZoomedOut) && mapRef.current?.animateToRegion && !correctingRef.current.__isCorrecting && cooldownPassed) {
                    console.log('[Map] Correcting bounds - lat:', region.latitude, 'lng:', region.longitude, 'latDelta:', latDelta, 'lngDelta:', lngDelta);
                    correctingRef.current.__isCorrecting = true;
                    correctingRef.current.__lastCorrectionTs = now;
                    mapRef.current.animateToRegion(USA_REGION, 400);
                    setTimeout(() => {
                      if (mapRef.current) mapRef.current.__isCorrecting = false;
                    }, 450);
                  }
                } catch (e) {
                  console.log('[Map] Region change error:', e);
                }
              }}
              onMapReady={() => {
                console.log('[Map] Ready');
                setMapReady(true);
                if (Platform.OS === 'web') {
                  setTimeout(() => {
                    if (mapRef.current?.animateToRegion) {
                      console.log('[Map] Auto-fitting to USA region on web');
                      mapRef.current.animateToRegion(USA_REGION, 800);
                    }
                  }, 200);
                } else {
                  setTimeout(() => {
                    if (mapRef.current?.animateToRegion) {
                      mapRef.current.animateToRegion(USA_REGION, 800);
                    }
                  }, 200);
                }
              }}
              showsTraffic
              showsUserLocation={false}
              showsBuildings
              showsCompass
              toolbarEnabled={false}
              mapType={'standard'}
              testID="commandCenterMap"
            >
              {Platform.OS === 'web' && (
                <AutoFitOnToggle
                  viewMode={viewMode}
                  mapReady={mapReady}
                  onFit={() => {
                    try {
                      if (mapRef.current?.animateToRegion) {
                        mapRef.current.animateToRegion(USA_REGION, 600);
                      }
                    } catch (e) {
                      console.log('[Map] AutoFitOnToggle error', e);
                    }
                  }}
                />
              )}
              {filteredDrivers.map((driver) => (
                <Marker
                  key={driver.id}
                  coordinate={{ latitude: driver.location.lat, longitude: driver.location.lng }}
                  title={`${driver.driverId} • ${driver.name}`}
                  description={getStatusLabel(driver.status)}
                  onPress={() => {
                    console.log(`[Map] Pin pressed: ${driver.driverId}`);
                    openPopup(driver.id);
                    if (mapRef.current) {
                      mapRef.current.animateCamera({
                        center: { latitude: driver.location.lat, longitude: driver.location.lng },
                        zoom: 12,
                        heading: 0,
                        pitch: 45,
                      }, { duration: 800 });
                    }
                  }}
                >
                  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <PulsingDot color={getStatusColor(driver.status)} size={14} />
                  </View>
                </Marker>
              ))}
            </MapView>
          ) : (
            <View style={styles.darkMapPlaceholder}>
              <View style={styles.mapGrid}>
                {filteredDrivers.map((driver) => (
                  <AnimatedMarker
                    key={driver.id}
                    driver={driver}
                    onPress={() => openPopup(driver.id)}
                    isSelected={popupDriver === driver.id}
                  />
                ))}
              </View>
              <View style={styles.mapOverlay}>
                <MapPin size={64} color="rgba(37, 99, 235, 0.3)" />
                <Text style={styles.mapOverlayText}>
                  {filteredDrivers.length} Active Drivers
                </Text>
                <Text style={styles.mapOverlaySubtext}>
                  Live tracking across continental U.S.
                </Text>
              </View>
            </View>
          )}
        </Animated.View>
      </View>

      {projectorMode && filteredDrivers.length > 0 && (
        <ProjectorOverlay
          driver={filteredDrivers[currentCycleIndex]}
          animation={projectorOverlayAnim}
        />
      )}

      {selectedDriver && selectedDriverData && !projectorMode && (
        <DriverDetailPanel
          driver={selectedDriverData}
          animation={panelAnimation}
          onClose={closePanel}
        />
      )}

      {popupDriver && popupDriverData && !projectorMode && (
        <DriverPopup
          driver={popupDriverData}
          animation={popupAnimation}
          onClose={closePopup}
        />
      )}
    </View>
  );
}

function AutoFitOnToggle({ viewMode, mapReady, onFit }: { viewMode: 'dark' | 'map'; mapReady: boolean; onFit: () => void }) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!mapReady) return;
    if (viewMode === 'map') {
      const t = setTimeout(onFit, 150);
      return () => clearTimeout(t);
    }
  }, [viewMode, mapReady, onFit]);
  return null;
}

interface DriverCardProps {
  driver: {
    id: string;
    driverId: string;
    name: string;
    status: DriverStatus;
    location: {
      lat: number;
      lng: number;
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
    eta?: number;
    distanceRemaining?: number;
  };
  isSelected: boolean;
  onPress: () => void;
}

function DriverCard({ driver, isSelected, onPress }: DriverCardProps) {
  const { routeData } = useDriverRoute({
    origin: { latitude: driver.location.lat, longitude: driver.location.lng },
    destination: driver.dropoffLocation || null,
    enabled: isSelected && !!(driver.pickupLocation && driver.dropoffLocation),
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
          {(driver.eta !== undefined || driver.distanceRemaining !== undefined || routeData) && (
            <View style={styles.etaBadge}>
              <Route size={12} color="#94A3B8" />
              <Text style={styles.etaText}>
                {driver.eta !== undefined && driver.distanceRemaining !== undefined ? (
                  `ETA: ${driver.eta.toFixed(1)} min • ${driver.distanceRemaining.toFixed(1)} mi`
                ) : routeData ? (
                  `ETA: ${routeData.durationFormatted} • ${Math.round(routeData.distanceMiles)} mi`
                ) : null}
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
  }, [pulseAnim]);

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

interface FilterButtonProps {
  label: string;
  count: number;
  isActive: boolean;
  onPress: () => void;
  color?: string;
}

function FilterButton({ label, count, isActive, onPress, color }: FilterButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
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
          styles.filterButton,
          isActive && styles.filterButtonActive,
          isActive && color && { borderColor: color, shadowColor: color },
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={[styles.filterButtonLabel, isActive && styles.filterButtonLabelActive]}>
          {label}
        </Text>
        <View
          style={[
            styles.filterCount,
            isActive && styles.filterCountActive,
            isActive && color && { backgroundColor: color + '30', borderColor: color },
          ]}
        >
          <Text
            style={[
              styles.filterCountText,
              isActive && styles.filterCountTextActive,
              isActive && color && { color },
            ]}
          >
            {count}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

interface AnimatedMarkerProps {
  driver: {
    id: string;
    driverId: string;
    name: string;
    status: DriverStatus;
    location: {
      lat: number;
      lng: number;
    };
  };
  onPress: () => void;
  isSelected: boolean;
}

function AnimatedMarker({ driver, onPress, isSelected }: AnimatedMarkerProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const positionX = useRef(new Animated.Value(((driver.location.lng + 125) / 60) * 100)).current;
  const positionY = useRef(new Animated.Value(((50 - driver.location.lat) / 25) * 100)).current;
  const prevLocation = useRef({ lat: driver.location.lat, lng: driver.location.lng });

  useEffect(() => {
    const isActiveDriver = driver.status === 'pickup' || driver.status === 'in_transit';
    const pulseSpeed = driver.status === 'breakdown' ? 1500 : 1000;
    const pulseScale = isActiveDriver ? 1.5 : 1.3;
    
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: pulseScale,
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
  }, [driver.status, pulseAnim]);

  useEffect(() => {
    const newLat = driver.location.lat;
    const newLng = driver.location.lng;
    const oldLat = prevLocation.current.lat;
    const oldLng = prevLocation.current.lng;

    if (newLat !== oldLat || newLng !== oldLng) {
      console.log(`[AnimatedMarker] ${driver.driverId} moving from (${oldLat.toFixed(4)}, ${oldLng.toFixed(4)}) to (${newLat.toFixed(4)}, ${newLng.toFixed(4)})`);
      
      const newX = ((newLng + 125) / 60) * 100;
      const newY = ((50 - newLat) / 25) * 100;

      Animated.parallel([
        Animated.timing(positionX, {
          toValue: newX,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(positionY, {
          toValue: newY,
          duration: 2000,
          useNativeDriver: false,
        }),
      ]).start();

      prevLocation.current = { lat: newLat, lng: newLng };
    }
  }, [driver.location.lat, driver.location.lng, driver.driverId, positionX, positionY]);

  const markerColor = getStatusColor(driver.status);
  const markerSize = isSelected ? 24 : 18;
  const isActiveDriver = driver.status === 'pickup' || driver.status === 'in_transit';

  return (
    <Animated.View
      style={[
        styles.mapMarker,
        {
          left: positionX.interpolate({
            inputRange: [0, 100],
            outputRange: ['0%', '100%'],
          }),
          top: positionY.interpolate({
            inputRange: [0, 100],
            outputRange: ['0%', '100%'],
          }),
        },
      ]}
    >
      <TouchableOpacity
        style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {isSelected && (
          <Animated.View
            style={[
              styles.markerRing,
              {
                width: markerSize * 3,
                height: markerSize * 3,
                borderRadius: markerSize * 1.5,
                borderColor: markerColor,
              },
            ]}
          />
        )}
        {isActiveDriver && (
          <Animated.View
            style={[
              styles.markerActivePulse,
              {
                backgroundColor: markerColor,
                width: markerSize * 3.5,
                height: markerSize * 3.5,
                borderRadius: markerSize * 1.75,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
        )}
        <Animated.View
          style={[
            styles.markerGlow,
            {
              backgroundColor: markerColor,
              width: markerSize * 2,
              height: markerSize * 2,
              borderRadius: markerSize,
              transform: [{ scale: pulseAnim.interpolate({
                inputRange: [1, 1.5],
                outputRange: [1, 1.2],
              }) }],
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
    </Animated.View>
  );
}

function getStatusColor(status: DriverStatus): string {
  switch (status) {
    case 'pickup':
      return '#22C55E';
    case 'in_transit':
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
    case 'in_transit':
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
      lat: number;
      lng: number;
    };
    currentLoad?: string;
    lastUpdate: Date;
  };
  animation: Animated.Value;
  onClose: () => void;
}

interface DriverPopupProps {
  driver: {
    id: string;
    driverId: string;
    name: string;
    status: DriverStatus;
    location: {
      lat: number;
      lng: number;
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
  animation: Animated.Value;
  onClose: () => void;
}

function DriverPopup({ driver, animation, onClose }: DriverPopupProps) {
  const { routeData } = useDriverRoute({
    origin: { latitude: driver.location.lat, longitude: driver.location.lng },
    destination: driver.dropoffLocation || null,
    enabled: true && !!(driver.pickupLocation && driver.dropoffLocation),
  });
  const [locationName, setLocationName] = useState<{ city: string; state: string }>({ city: 'Loading...', state: '' });

  useEffect(() => {
    const fetchLocation = async () => {
      const cacheKey = `${driver.location.lat.toFixed(2)},${driver.location.lng.toFixed(2)}`;
      const cached = reverseGeocodeCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setLocationName({ city: cached.city, state: cached.state });
        return;
      }

      try {
        const apiKey = process.env.EXPO_PUBLIC_ORS_API_KEY;
        if (!apiKey) {
          console.warn('[DriverPopup] No ORS API key configured');
          setLocationName({ city: 'Location unavailable', state: '' });
          return;
        }

        const url = `https://api.openrouteservice.org/geocode/reverse?api_key=${apiKey}&point.lon=${driver.location.lng}&point.lat=${driver.location.lat}`;
        const res = await fetch(url);
        
        if (!res.ok) {
          console.warn(`[DriverPopup] Geocode API error: ${res.status}`);
          setLocationName({ city: 'Location unavailable', state: '' });
          return;
        }

        const data = await res.json();
        const props = data.features?.[0]?.properties;
        
        if (props) {
          const city = props.locality || props.county || props.region || 'Unknown';
          const state = props.region || props.macroregion || '';
          const result = { city, state, timestamp: Date.now() };
          
          reverseGeocodeCache.set(cacheKey, result);
          setLocationName({ city, state });
          console.log(`[DriverPopup] ${driver.driverId} location: ${city}, ${state}`);
        } else {
          setLocationName({ city: 'Location unavailable', state: '' });
        }
      } catch (err) {
        console.error('[DriverPopup] Reverse geocode error:', err);
        setLocationName({ city: 'Location unavailable', state: '' });
      }
    };

    fetchLocation();
  }, [driver.location.lat, driver.location.lng, driver.driverId]);

  const scale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  const opacity = animation;

  return (
    <>
      <Animated.View
        style={[
          styles.popupOverlay,
          {
            opacity: opacity.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.7],
            }),
          },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.popupCard,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.popupCloseButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <X size={18} color="#94A3B8" />
        </TouchableOpacity>

        <View style={styles.popupHeader}>
          <View style={styles.popupDriverInfo}>
            <Text style={styles.popupDriverName}>{driver.name}</Text>
            <Text style={styles.popupDriverId}>{driver.driverId}</Text>
          </View>
          <View
            style={[
              styles.popupStatusBadge,
              { backgroundColor: getStatusColor(driver.status) + '20' },
            ]}
          >
            <View
              style={[
                styles.popupStatusDot,
                { backgroundColor: getStatusColor(driver.status) },
              ]}
            />
            <Text
              style={[
                styles.popupStatusText,
                { color: getStatusColor(driver.status) },
              ]}
            >
              {getStatusLabel(driver.status)}
            </Text>
          </View>
        </View>

        <View style={styles.popupDivider} />

        <View style={styles.popupSection}>
          <View style={styles.popupRow}>
            <MapPin size={16} color="#60A5FA" />
            <Text style={styles.popupLabel}>Current Location</Text>
          </View>
          <Text style={styles.popupValue}>{locationName.city}{locationName.state ? `, ${locationName.state}` : ''}</Text>
        </View>

        {driver.currentLoad && (
          <>
            <View style={styles.popupDivider} />
            <View style={styles.popupSection}>
              <View style={styles.popupRow}>
                <Package size={16} color="#60A5FA" />
                <Text style={styles.popupLabel}>Current Load</Text>
              </View>
              <Text style={styles.popupValue}>{driver.currentLoad}</Text>
            </View>
          </>
        )}

        {routeData && (
          <>
            <View style={styles.popupDivider} />
            <View style={styles.popupSection}>
              <View style={styles.popupRow}>
                <Clock size={16} color="#60A5FA" />
                <Text style={styles.popupLabel}>ETA & Distance</Text>
              </View>
              <Text style={styles.popupValue}>
                {routeData.durationFormatted} • {Math.round(routeData.distanceMiles)} mi
              </Text>
            </View>
          </>
        )}

        <TouchableOpacity
          style={styles.popupButton}
          activeOpacity={0.7}
          disabled
        >
          <Text style={styles.popupButtonText}>View Load Details</Text>
          <Text style={styles.popupButtonSubtext}>(Coming Soon)</Text>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
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
                  {driver.location.lat.toFixed(4)}°N
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Longitude</Text>
                <Text style={styles.infoValue}>
                  {driver.location.lng.toFixed(4)}°W
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

interface ProjectorOverlayProps {
  driver: {
    id: string;
    driverId: string;
    name: string;
    status: DriverStatus;
    location: {
      lat: number;
      lng: number;
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
  animation: Animated.Value;
}

interface PlaybackToolbarProps {
  drivers: Array<{
    id: string;
    driverId: string;
    name: string;
    status: DriverStatus;
  }>;
  selectedDriver: string | null;
  onSelectDriver: (driverId: string) => void;
  isPlaying: boolean;
  progress: number;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onRestart: () => void;
  onSpeedChange: (speed: number) => void;
  onClose: () => void;
  animation: Animated.Value;
}

function PlaybackToolbar({
  drivers,
  selectedDriver,
  onSelectDriver,
  isPlaying,
  progress,
  speed,
  onPlay,
  onPause,
  onRestart,
  onSpeedChange,
  onClose,
  animation,
}: PlaybackToolbarProps) {

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [200, 0],
  });

  const opacity = animation;

  const selectedDriverData = drivers.find((d) => d.id === selectedDriver);

  const cycleSpeed = () => {
    const speeds = [1, 2, 4];
    const currentIndex = speeds.indexOf(speed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    onSpeedChange(speeds[nextIndex]);
  };

  return (
    <Animated.View
      style={[
        styles.playbackToolbar,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.playbackHeader}>
        <Text style={styles.playbackTitle}>Playback Timeline</Text>
        <TouchableOpacity
          style={styles.playbackCloseButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <X size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {selectedDriverData && (
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.playbackDriverName}>{selectedDriverData.name}</Text>
          <Text style={styles.playbackDriverId}>{selectedDriverData.driverId}</Text>
        </View>
      )}

      {selectedDriver && (
        <>
          <View style={styles.playbackProgressContainer}>
            <View style={styles.playbackProgressBar}>
              <View
                style={[
                  styles.playbackProgressFill,
                  { width: `${progress}%` },
                ]}
              />
            </View>
            <Text style={styles.playbackProgressText}>
              {progress.toFixed(1)}% Complete
            </Text>
          </View>

          <View style={styles.playbackControls}>
            <TouchableOpacity
              style={styles.playbackButton}
              onPress={onRestart}
              activeOpacity={0.7}
            >
              <RotateCcw size={20} color="#60A5FA" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.playbackButton, styles.playbackButtonPrimary]}
              onPress={isPlaying ? onPause : onPlay}
              activeOpacity={0.8}
            >
              {isPlaying ? (
                <Pause size={24} color="#FFFFFF" />
              ) : (
                <Play size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.playbackSpeedButton}
              onPress={cycleSpeed}
              activeOpacity={0.7}
            >
              <Text style={styles.playbackSpeedText}>{speed}×</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </Animated.View>
  );
}

interface PlaybackGhostMarkerProps {
  driver: {
    id: string;
    driverId: string;
    name: string;
    status: DriverStatus;
  };
  location: {
    latitude: number;
    longitude: number;
  };
  progress: number;
}

function PlaybackGhostMarker({ driver, location, progress }: PlaybackGhostMarkerProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1.5,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();
    glowAnimation.start();

    return () => {
      pulseAnimation.stop();
      glowAnimation.stop();
    };
  }, [pulseAnim, glowAnim]);

  const markerColor = getStatusColor(driver.status);

  return (
    <View
      style={[
        styles.ghostMarker,
        {
          left: `${((location.longitude + 125) / 60) * 100}%`,
          top: `${((50 - location.latitude) / 25) * 100}%`,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.ghostMarkerGlow,
          {
            backgroundColor: markerColor,
            transform: [{ scale: glowAnim }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ghostMarkerCore,
          {
            backgroundColor: markerColor,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <View style={styles.ghostMarkerInner} />
      </Animated.View>
    </View>
  );
}

function ProjectorOverlay({ driver, animation }: ProjectorOverlayProps) {
  const { routeData } = useDriverRoute({
    origin: { latitude: driver.location.lat, longitude: driver.location.lng },
    destination: driver.dropoffLocation || null,
    enabled: true && !!(driver.pickupLocation && driver.dropoffLocation),
  });

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0],
  });

  const opacity = animation;

  return (
    <Animated.View
      style={[
        styles.projectorOverlay,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View
        style={[
          styles.projectorBanner,
          { borderColor: getStatusColor(driver.status) + '80' },
        ]}
      >
        <View style={styles.projectorHeader}>
          <View style={styles.projectorDriverInfo}>
            <Text style={styles.projectorDriverNumber}>{driver.driverId}</Text>
            <Text style={styles.projectorDriverName}>{driver.name}</Text>
          </View>
          <View
            style={[
              styles.projectorStatusBadge,
              { backgroundColor: getStatusColor(driver.status) + '30' },
            ]}
          >
            <PulsingDot color={getStatusColor(driver.status)} size={12} />
            <Text
              style={[
                styles.projectorStatusText,
                { color: getStatusColor(driver.status) },
              ]}
            >
              {getStatusLabel(driver.status)}
            </Text>
          </View>
        </View>

        <View style={styles.projectorDivider} />

        <View style={styles.projectorDetails}>
          {driver.currentLoad && (
            <View style={styles.projectorDetailItem}>
              <Package size={16} color="#60A5FA" />
              <Text style={styles.projectorDetailLabel}>Load ID</Text>
              <Text style={styles.projectorDetailValue}>{driver.currentLoad}</Text>
            </View>
          )}

          {routeData && (
            <>
              <View style={styles.projectorDetailItem}>
                <Clock size={16} color="#60A5FA" />
                <Text style={styles.projectorDetailLabel}>ETA</Text>
                <Text style={styles.projectorDetailValue}>
                  {routeData.durationFormatted}
                </Text>
              </View>
              <View style={styles.projectorDetailItem}>
                <Route size={16} color="#60A5FA" />
                <Text style={styles.projectorDetailLabel}>Distance</Text>
                <Text style={styles.projectorDetailValue}>
                  {Math.round(routeData.distanceMiles)} mi
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    </Animated.View>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  projectorToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.3)',
  },
  projectorLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#94A3B8',
  },
  demoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  demoLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#94A3B8',
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
    width: isTablet ? 320 : (isSmallScreen ? '100%' : '30%'),
    maxWidth: isTablet ? 320 : 400,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(30, 41, 59, 0.5)',
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(12px)',
    }),
  },
  sidebarToggleButton: {
    position: 'absolute',
    left: isTablet ? 320 : (isSmallScreen ? 280 : 400),
    top: '50%',
    zIndex: 1001,
    width: 40,
    height: 90,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: 'rgba(37, 99, 235, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(10px)',
      transform: [{ translateY: '-50%' }],
    }),
  },
  sidebarToggleButtonCollapsed: {
    left: 0,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
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
  mapContainerFullscreen: {
    width: '100%',
  },
  mapContainerTablet: {
    maxWidth: '100%',
    maxHeight: '85vh',
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
  markerActivePulse: {
    position: 'absolute',
    opacity: 0.15,
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
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 41, 59, 0.5)',
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(10px)',
    }),
    flexWrap: 'wrap',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    borderColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },
  filterButtonLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#94A3B8',
  },
  filterButtonLabelActive: {
    color: '#FFFFFF',
  },
  filterCount: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.5)',
    minWidth: 28,
    alignItems: 'center',
  },
  filterCountActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.3)',
    borderColor: 'rgba(37, 99, 235, 0.5)',
  },
  filterCountText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#64748B',
  },
  filterCountTextActive: {
    color: '#60A5FA',
  },
  markerRing: {
    position: 'absolute',
    borderWidth: 2,
    opacity: 0.6,
  },
  popupOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 998,
  },
  popupCard: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: isSmallScreen ? width * 0.9 : Math.min(420, width * 0.4),
    maxWidth: 500,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
    zIndex: 999,
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.8)',
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(10px)',
      transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
    }),
    ...(!isWeb && {
      marginLeft: isSmallScreen ? -(width * 0.45) : -Math.min(210, width * 0.2),
      marginTop: -200,
    }),
  },
  popupCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  popupHeader: {
    marginBottom: 16,
  },
  popupDriverInfo: {
    marginBottom: 12,
  },
  popupDriverName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#F1F5F9',
    marginBottom: 4,
  },
  popupDriverId: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600' as const,
  },
  popupStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  popupStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  popupStatusText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  popupDivider: {
    height: 1,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    marginVertical: 16,
  },
  popupSection: {
    marginBottom: 4,
  },
  popupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  popupLabel: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600' as const,
  },
  popupValue: {
    fontSize: 16,
    color: '#F1F5F9',
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  popupSubvalue: {
    fontSize: 14,
    color: '#CBD5E1',
    fontWeight: '500' as const,
  },
  popupButton: {
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.5)',
  },
  popupButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  popupButtonSubtext: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  projectorOverlay: {
    position: 'absolute',
    top: isSmallScreen ? 80 : 100,
    left: '50%',
    width: isSmallScreen ? width * 0.95 : Math.min(900, width * 0.7),
    zIndex: 1001,
    ...(Platform.OS === 'web' && {
      transform: [{ translateX: '-50%' }],
    }),
    ...(!isWeb && {
      marginLeft: isSmallScreen ? -(width * 0.475) : -Math.min(450, width * 0.35),
    }),
  },
  projectorBanner: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 16,
    borderWidth: 2,
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(16px)',
    }),
  },
  projectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  projectorDriverInfo: {
    flex: 1,
  },
  projectorDriverNumber: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#94A3B8',
    marginBottom: 6,
    letterSpacing: 1,
  },
  projectorDriverName: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  projectorStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 10,
  },
  projectorStatusText: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  projectorDivider: {
    height: 1,
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    marginVertical: 16,
  },
  projectorDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  projectorDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  projectorDetailLabel: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600' as const,
    marginRight: 4,
  },
  projectorDetailValue: {
    fontSize: 15,
    color: '#F1F5F9',
    fontWeight: '700' as const,
  },
  modeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  modeToggleActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    borderColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#94A3B8',
  },
  modeLabelActive: {
    color: '#60A5FA',
  },
  playbackToolbar: {
    position: 'absolute',
    bottom: 40,
    left: '50%',
    width: isSmallScreen ? width * 0.95 : Math.min(800, width * 0.6),
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 16,
    borderWidth: 1,
    borderColor: 'rgba(30, 41, 59, 0.8)',
    zIndex: 1002,
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(12px)',
      transform: [{ translateX: '-50%' }],
    }),
    ...(!isWeb && {
      marginLeft: isSmallScreen ? -(width * 0.475) : -Math.min(400, width * 0.3),
    }),
  },
  playbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  playbackTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#F1F5F9',
  },
  playbackCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playbackDriverSelect: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    marginBottom: 16,
  },
  playbackDriverOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.3)',
  },
  playbackDriverOptionLast: {
    borderBottomWidth: 0,
  },
  playbackDriverOptionSelected: {
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
  },
  playbackDriverName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#F1F5F9',
  },
  playbackDriverId: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  playbackProgressContainer: {
    marginBottom: 16,
  },
  playbackProgressBar: {
    height: 6,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  playbackProgressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 3,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  playbackProgressText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '600' as const,
  },
  playbackControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  playbackButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(37, 99, 235, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.5)',
  },
  playbackButtonPrimary: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    borderColor: '#3B82F6',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  playbackSpeedButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.5)',
    minWidth: 70,
    alignItems: 'center',
  },
  playbackSpeedText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#60A5FA',
  },
  ghostMarker: {
    position: 'absolute',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
  },
  ghostMarkerGlow: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    opacity: 0.4,
  },
  ghostMarkerCore: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  ghostMarkerInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  ghostTrail: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    opacity: 0.3,
  },
});
