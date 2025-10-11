import React, { useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, ImageBackground, StyleSheet } from 'react-native';

export type LatLng = { latitude: number; longitude: number };

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

// Web fallback map: USA-only static background with interstate overlay; non-interactive but supports imperative no-ops

type MapViewProps = {
  style?: any;
  children?: React.ReactNode;
  initialRegion?: Region;
  onMapReady?: () => void;
  onRegionChangeComplete?: (region: Region) => void;
  provider?: any;
  minZoomLevel?: number;
  maxZoomLevel?: number;
  showsTraffic?: boolean;
  showsUserLocation?: boolean;
  showsBuildings?: boolean;
  showsCompass?: boolean;
  toolbarEnabled?: boolean;
  mapType?: 'standard' | 'satellite' | 'terrain' | 'hybrid' | string;
  testID?: string;
};

const US_BOUNDS = {
  minLat: 24.396308,
  maxLat: 49.384358,
  minLng: -124.848974,
  maxLng: -66.885444,
};

export const MapView = forwardRef<any, MapViewProps>(function MapView(
  { style, children, onMapReady, testID }: MapViewProps,
  ref,
) {
  useEffect(() => {
    onMapReady?.();
  }, [onMapReady]);

  useImperativeHandle(ref, () => ({
    animateToRegion: (_region: Region, _duration?: number) => {
      console.log('[WebMap] animateToRegion noop');
    },
    fitToCoordinates: (_coords: LatLng[], _opts?: any) => {
      console.log('[WebMap] fitToCoordinates noop');
    },
    animateCamera: (_cam: any, _opts?: any) => {
      console.log('[WebMap] animateCamera noop');
    },
  }));

  return (
    <ImageBackground
      testID={testID ?? 'webMapFallback'}
      source={{
        uri:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Interstate_Highway_plan.svg/1920px-Interstate_Highway_plan.svg.png',
      }}
      resizeMode="cover"
      style={[styles.mapBackground, style]}
    >
      <View style={styles.overlay}>{children}</View>
    </ImageBackground>
  );
});

export type MarkerProps = {
  coordinate: LatLng;
  children?: React.ReactNode;
  title?: string;
  description?: string;
  onPress?: () => void;
};

export function Marker({ coordinate, children, onPress }: MarkerProps) {
  const lat = Math.min(Math.max(coordinate.latitude, US_BOUNDS.minLat), US_BOUNDS.maxLat);
  const lng = Math.min(Math.max(coordinate.longitude, US_BOUNDS.minLng), US_BOUNDS.maxLng);
  const leftPct = ((lng - US_BOUNDS.minLng) / (US_BOUNDS.maxLng - US_BOUNDS.minLng)) * 100;
  const topPct = ((US_BOUNDS.maxLat - lat) / (US_BOUNDS.maxLat - US_BOUNDS.minLat)) * 100;

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
