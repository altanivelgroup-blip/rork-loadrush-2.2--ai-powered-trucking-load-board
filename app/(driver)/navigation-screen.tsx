import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Dimensions } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Navigation, MapPin, Play, Square } from 'lucide-react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import useDriverNavigation from '@/hooks/useDriverNavigation';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';

const { width } = Dimensions.get('window');

export default function NavigationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();

  const destinationLat = parseFloat((params.destinationLat as string) || '0');
  const destinationLng = parseFloat((params.destinationLng as string) || '0');
  const destinationName = (params.destinationName as string) || 'Pickup Location';

  const destination = {
    lat: destinationLat,
    lng: destinationLng,
  };

  const {
    currentLocation,
    routeCoords,
    distance,
    duration,
    isNavigating,
    error,
    isCompleted,
    setDestination,
    startNavigation,
    stopNavigation,
  } = useDriverNavigation(user?.id || 'unknown');

  const [mapReady, setMapReady] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const mapRef = React.useRef<MapView>(null);
  const confettiRef = React.useRef<any>(null);

  useEffect(() => {
    if (destination.lat !== 0 && destination.lng !== 0) {
      setDestination(destination);
    }

    return () => {
      setDestination(null);
    };
  }, [destination.lat, destination.lng, setDestination]);

  useEffect(() => {
    if (isCompleted) {
      console.log('🎉 Trip completed - showing celebration!');
      setShowCelebration(true);
      
      if (confettiRef.current) {
        confettiRef.current.start();
      }

      const timer = setTimeout(() => {
        setShowCelebration(false);
        router.back();
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, [isCompleted, router]);

  useEffect(() => {
    if (mapReady && currentLocation && routeCoords.length > 0 && mapRef.current) {
      const allCoords = [
        { latitude: currentLocation.lat, longitude: currentLocation.lng },
        ...routeCoords.map(coord => ({ latitude: coord.lat, longitude: coord.lng })),
      ];

      mapRef.current.fitToCoordinates(allCoords, {
        edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
        animated: true,
      });
    }
  }, [mapReady, currentLocation, routeCoords]);

  const handleClose = () => {
    setDestination(null);
    router.back();
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentLocation) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        initialRegion={{
          latitude: currentLocation.lat,
          longitude: currentLocation.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        onMapReady={() => setMapReady(true)}
      >
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords.map(coord => ({
              latitude: coord.lat,
              longitude: coord.lng,
            }))}
            strokeColor={Colors.light.primary}
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}

        <Marker
          coordinate={{
            latitude: currentLocation.lat,
            longitude: currentLocation.lng,
          }}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.currentLocationMarker}>
            <View style={styles.currentLocationDot} />
          </View>
        </Marker>

        <Marker
          coordinate={{
            latitude: destination.lat,
            longitude: destination.lng,
          }}
          anchor={{ x: 0.5, y: 1 }}
        >
          <View style={styles.destinationMarker}>
            <MapPin size={32} color="#EF4444" fill="#EF4444" />
          </View>
        </Marker>
      </MapView>

      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerContent}>
          <Navigation size={24} color="#FFFFFF" />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Live Navigation to Pickup</Text>
            <Text style={styles.headerSubtitle}>{destinationName}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.closeIconButton} onPress={handleClose}>
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {distance !== null && duration !== null && (
        <View style={[styles.infoCard, { bottom: insets.bottom + 20 }]}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Distance</Text>
              <Text style={styles.infoValue}>{distance.toFixed(1)} mi</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>ETA</Text>
              <Text style={styles.infoValue}>{Math.round(duration)} min</Text>
            </View>
          </View>
          
          {isNavigating && (
            <View style={styles.navigationStatus}>
              <View style={styles.navigationDot} />
              <Text style={styles.navigationText}>Navigation Active</Text>
            </View>
          )}

          <View style={styles.controlButtons}>
            {!isNavigating ? (
              <TouchableOpacity
                style={[styles.controlButton, styles.startButton]}
                onPress={() => startNavigation(destination)}
              >
                <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.controlButtonText}>Start Navigation</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.controlButton, styles.stopButton]}
                onPress={stopNavigation}
              >
                <Square size={20} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.controlButtonText}>Stop Navigation</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {showCelebration && (
        <>
          <View style={styles.celebrationOverlay}>
            <Text style={styles.celebrationTitle}>🎯 Mission Accomplished!</Text>
            <Text style={styles.celebrationSubtitle}>Trip successfully completed.</Text>
          </View>
          <ConfettiCannon
            ref={confettiRef}
            count={200}
            origin={{ x: width / 2, y: 0 }}
            fadeOut={true}
            autoStart={false}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  map: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.8,
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
  infoCard: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    backdropFilter: 'blur(12px)' as any,
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
  infoLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500' as const,
    marginBottom: 4,
    opacity: 0.8,
  },
  infoValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  infoDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  navigationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    gap: 8,
  },
  navigationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  navigationText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  currentLocationMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.light.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  destinationMarker: {
    alignItems: 'center',
    justifyContent: 'center',
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
  controlButtons: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  startButton: {
    backgroundColor: '#16A34A',
  },
  stopButton: {
    backgroundColor: '#DC2626',
  },
  controlButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  celebrationTitle: {
    fontSize: 28,
    color: '#C084FC',
    fontWeight: '700' as const,
    marginBottom: 10,
    textAlign: 'center',
  },
  celebrationSubtitle: {
    fontSize: 16,
    color: '#E2E8F0',
    textAlign: 'center',
  },
});
