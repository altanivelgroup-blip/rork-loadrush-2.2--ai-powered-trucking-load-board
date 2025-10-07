import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, MapPin } from 'lucide-react-native';
import { useDriverGPS } from '@/hooks/useDriverGPS';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { MapView, Marker, Polyline, PROVIDER_GOOGLE } from '@/components/MapComponents';

const ORS_API_KEY = process.env.EXPO_PUBLIC_ORS_API_KEY || '5b3ce3597851110001cf6248a1b8c8e8e8e84e5f8b8e8e8e8e8e8e8e';

interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export default function DriverMapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();

  const pickupLat = parseFloat((params.pickupLat as string) || '0');
  const pickupLng = parseFloat((params.pickupLng as string) || '0');
  const dropoffLat = parseFloat((params.dropoffLat as string) || '0');
  const dropoffLng = parseFloat((params.dropoffLng as string) || '0');

  const pickup = useMemo(
    () => (pickupLat !== 0 && pickupLng !== 0 ? { lat: pickupLat, lng: pickupLng } : null),
    [pickupLat, pickupLng]
  );
  const dropoff = useMemo(
    () => (dropoffLat !== 0 && dropoffLng !== 0 ? { lat: dropoffLat, lng: dropoffLng } : null),
    [dropoffLat, dropoffLng]
  );

  const { location, error: gpsError } = useDriverGPS(user?.id);

  const [routeCoords, setRouteCoords] = useState<RouteCoordinate[]>([]);
  const [distance, setDistance] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [routeError, setRouteError] = useState<string | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const mapRef = useRef<any>(null);

  const getRoute = useCallback(async () => {
    if (!pickup || !dropoff) return;

    setIsLoadingRoute(true);
    setRouteError(null);

    try {
      const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${pickup.lng},${pickup.lat}&end=${dropoff.lng},${dropoff.lat}`;
      
      console.log('[DriverMapScreen] Fetching route from ORS...');
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`ORS API error: ${res.status}`);
      }

      const data = await res.json();
      
      if (!data.features || data.features.length === 0) {
        throw new Error('No route found');
      }

      const coords = data.features[0].geometry.coordinates.map((c: number[]) => ({
        latitude: c[1],
        longitude: c[0],
      }));
      
      setRouteCoords(coords);

      const summary = data.features[0].properties.summary;
      const distanceKm = summary.distance / 1000;
      const distanceMi = distanceKm * 0.621371;
      setDistance(distanceMi.toFixed(1));
      
      const mins = Math.round(summary.duration / 60);
      setDuration(mins.toString());

      console.log('[DriverMapScreen] Route loaded:', {
        distance: distanceMi.toFixed(1) + ' mi',
        duration: mins + ' min',
        points: coords.length,
      });
    } catch (err) {
      console.error('[DriverMapScreen] Route error:', err);
      setRouteError('Failed to load route. Please try again.');
    } finally {
      setIsLoadingRoute(false);
    }
  }, [pickup, dropoff]);

  useEffect(() => {
    if (location && pickup && dropoff) {
      getRoute();
    }
  }, [location, pickup, dropoff, getRoute]);

  const handleClose = () => {
    router.back();
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.webFallback}>
          <MapPin size={64} color={Colors.light.primary} />
          <Text style={styles.webFallbackTitle}>Map Not Available on Web</Text>
          <Text style={styles.webFallbackText}>
            Please use the mobile app to access live map features.
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (gpsError) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.errorText}>{gpsError}</Text>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Locating driver...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {MapView && (
        <MapView
          ref={mapRef}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          style={StyleSheet.absoluteFillObject}
          showsUserLocation={true}
          followsUserLocation={true}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
        >
          {pickup && Marker && (
            <Marker
              coordinate={{ latitude: pickup.lat, longitude: pickup.lng }}
              title="Pickup"
              pinColor="green"
            />
          )}
          
          {dropoff && Marker && (
            <Marker
              coordinate={{ latitude: dropoff.lat, longitude: dropoff.lng }}
              title="Drop-off"
              pinColor="red"
            />
          )}
          
          {routeCoords.length > 0 && Polyline && (
            <Polyline
              coordinates={routeCoords}
              strokeWidth={4}
              strokeColor={Colors.light.primary}
              lineCap="round"
              lineJoin="round"
            />
          )}
        </MapView>
      )}

      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Live Map</Text>
          {pickup && dropoff && (
            <Text style={styles.headerSubtitle}>Pickup → Drop-off</Text>
          )}
        </View>
        <TouchableOpacity style={styles.closeIconButton} onPress={handleClose}>
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {(distance || duration || isLoadingRoute || routeError) && (
        <View style={[styles.infoBox, { bottom: insets.bottom + 30 }]}>
          {isLoadingRoute ? (
            <View style={styles.loadingRoute}>
              <ActivityIndicator size="small" color={Colors.light.primary} />
              <Text style={styles.loadingRouteText}>Calculating route...</Text>
            </View>
          ) : routeError ? (
            <Text style={styles.errorTextSmall}>{routeError}</Text>
          ) : (
            <>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.label}>Distance</Text>
                  <Text style={styles.value}>{distance} mi</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoItem}>
                  <Text style={styles.label}>ETA</Text>
                  <Text style={styles.value}>{duration} min</Text>
                </View>
              </View>
              <Text style={styles.updateText}>updated live</Text>
            </>
          )}
        </View>
      )}

      {!MapView && (
        <View style={styles.webFallback}>
          <MapPin size={64} color={Colors.light.primary} />
          <Text style={styles.webFallbackTitle}>Map Not Available</Text>
          <Text style={styles.webFallbackText}>
            Maps are not available on this platform.
          </Text>
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
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(37, 99, 235, 0.95)',
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 2,
  },
  closeIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.primary,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.light.border,
  },
  updateText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic' as const,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.danger,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorTextSmall: {
    fontSize: 14,
    color: Colors.light.danger,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  loadingRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingRouteText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  webFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    padding: 20,
  },
  webFallbackTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  webFallbackText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 300,
  },
});
