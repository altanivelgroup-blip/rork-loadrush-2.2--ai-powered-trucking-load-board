import React, { useEffect } from 'react';
import { View, ImageBackground, StyleSheet } from 'react-native';

export type LatLng = { latitude: number; longitude: number };

// Very lightweight web fallback: renders a static map background and positions markers by US lat/lng bounds
// Not interactive, but good for sandbox verification without native maps on web

type MapViewProps = {
  style?: any;
  children?: React.ReactNode;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  onMapReady?: () => void;
  testID?: string;
};

const US_BOUNDS = {
  minLat: 24.396308,
  maxLat: 49.384358,
  minLng: -124.848974,
  maxLng: -66.885444,
};

export function MapView({ style, children, onMapReady, testID }: MapViewProps) {
  useEffect(() => {
    onMapReady?.();
  }, [onMapReady]);

  return (
    <ImageBackground
      testID={testID ?? 'webMapFallback'}
      source={{
        uri: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=1920&auto=format&fit=crop',
      }}
      resizeMode="cover"
      style={[styles.mapBackground, style]}
    >
      <View style={styles.overlay}>{children}</View>
    </ImageBackground>
  );
}

export type MarkerProps = {
  coordinate: LatLng;
  children?: React.ReactNode;
  title?: string;
  description?: string;
  onPress?: () => void;
};

export function Marker({ coordinate, children, onPress }: MarkerProps) {
  const leftPct = ((coordinate.longitude - US_BOUNDS.minLng) / (US_BOUNDS.maxLng - US_BOUNDS.minLng)) * 100;
  const topPct = ((US_BOUNDS.maxLat - coordinate.latitude) / (US_BOUNDS.maxLat - US_BOUNDS.minLat)) * 100;

  return (
    <View
      onStartShouldSetResponder={() => true}
      onResponderRelease={onPress}
      style={[styles.marker, { left: `${leftPct}%`, top: `${topPct}%` }]}
    >
      {children}
    </View>
  );
}

export const Polyline: any = null;
export const PROVIDER_GOOGLE: any = 'google';

const styles = StyleSheet.create({
  mapBackground: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  marker: {
    position: 'absolute',
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
});
