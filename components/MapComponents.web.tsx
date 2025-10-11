import React, { useEffect, forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View, StyleSheet, Platform, Text, Pressable } from 'react-native';

export type LatLng = { latitude: number; longitude: number };

export type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

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

const USA_BOUNDS = {
  north: 49.384358,
  south: 24.396308,
  west: -124.848974,
  east: -66.885444,
};

const USA_CENTER: LatLng = { latitude: 39.8283, longitude: -98.5795 };

let googleMapsLoading: Promise<any> | null = null;
function loadGoogleMaps(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject('No window');
  const w = window as any;
  if (w.google && w.google.maps) return Promise.resolve(w.google.maps);
  if (googleMapsLoading) return googleMapsLoading;

  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  const scriptId = 'google-maps-js';
  if (document.getElementById(scriptId)) {
    googleMapsLoading = new Promise((resolve) => {
      const check = () => {
        if (w.google && w.google.maps) resolve(w.google.maps);
        else setTimeout(check, 50);
      };
      check();
    });
    return googleMapsLoading;
  }

  googleMapsLoading = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.id = scriptId;
    s.async = true;
    s.defer = true;
    const apiParam = apiKey ? `&key=${apiKey}` : '';
    s.src = `https://maps.googleapis.com/maps/api/js?libraries=geometry${apiParam}`;
    s.onload = () => resolve(w.google.maps);
    s.onerror = (e) => reject(e);
    document.head.appendChild(s);
  });
  return googleMapsLoading;
}

export const MapView = forwardRef<any, MapViewProps>(function MapView(
  {
    style,
    children,
    initialRegion,
    onMapReady,
    onRegionChangeComplete,
    showsTraffic = true,
    mapType = 'standard',
    minZoomLevel,
    maxZoomLevel,
    testID,
  }: MapViewProps,
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const googleMapRef = useRef<any>(null);
  const isProgrammaticRef = useRef(false);
  const trafficLayerRef = useRef<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const onMapReadyRef = useRef<(() => void) | undefined>(undefined);
  const onRegionChangeCompleteRef = useRef<((region: Region) => void) | undefined>(undefined);

  useEffect(() => {
    onMapReadyRef.current = onMapReady;
  }, [onMapReady]);

  useEffect(() => {
    onRegionChangeCompleteRef.current = onRegionChangeComplete;
  }, [onRegionChangeComplete]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let mounted = true;
    setLoadError(null);
    loadGoogleMaps()
      .then((gmaps) => {
        if (!mounted || !containerRef.current) return;
        const defaultZoom = 3.5;
        const zoom = initialRegion ? regionToZoom(initialRegion.latitudeDelta) : defaultZoom;
        const center = initialRegion ? { lat: initialRegion.latitude, lng: initialRegion.longitude } : { lat: USA_CENTER.latitude, lng: USA_CENTER.longitude };
        const map = new gmaps.Map(containerRef.current, {
          center,
          zoom,
          minZoom: typeof minZoomLevel === 'number' ? minZoomLevel : 3,
          maxZoom: typeof maxZoomLevel === 'number' ? maxZoomLevel : 18,
          mapTypeId: mapType === 'satellite' ? gmaps.MapTypeId.SATELLITE : gmaps.MapTypeId.ROADMAP,
          gestureHandling: 'greedy',
          streetViewControl: false,
          fullscreenControl: false,
          mapTypeControl: false,
          clickableIcons: false,
          restriction: {
            latLngBounds: { north: USA_BOUNDS.north, south: USA_BOUNDS.south, west: USA_BOUNDS.west, east: USA_BOUNDS.east },
            strictBounds: true,
          },
          styles: darkMapStyles,
        });
        googleMapRef.current = map;
        (window as any).__lastGoogleMapInstance = map;
        injectPulseCSS();

        if (!initialRegion) {
          const bounds = new gmaps.LatLngBounds(
            new gmaps.LatLng(USA_BOUNDS.south, USA_BOUNDS.west),
            new gmaps.LatLng(USA_BOUNDS.north, USA_BOUNDS.east),
          );
          isProgrammaticRef.current = true;
          map.fitBounds(bounds, 0);
          gmaps.event.addListenerOnce(map, 'idle', () => {
            isProgrammaticRef.current = true;
            const minZ = typeof minZoomLevel === 'number' ? minZoomLevel : 3;
            const current = map.getZoom?.() ?? defaultZoom;
            map.setZoom(Math.max(current - 0.5, minZ));
          });
        }

        if (showsTraffic) {
          trafficLayerRef.current = new gmaps.TrafficLayer();
          trafficLayerRef.current.setMap(map);
        }

        gmaps.event.addListener(map, 'idle', () => {
          if (!mounted) return;
          if (isProgrammaticRef.current) {
            isProgrammaticRef.current = false;
            return;
          }
          const c = map.getCenter();
          const z = map.getZoom();
          const region: Region = {
            latitude: c.lat(),
            longitude: c.lng(),
            latitudeDelta: zoomToLatDelta(z ?? 4),
            longitudeDelta: zoomToLngDelta(z ?? 4),
          };
          onRegionChangeCompleteRef.current?.(region);
        });

        onMapReadyRef.current?.();
      })
      .catch((e) => {
        console.error('[WebMap] Failed to load Google Maps JS', e);
        const msg = String((e && (e.message || e.status || (e.toString && e.toString()))) ?? 'Unknown error');
        if (msg.includes('RefererNotAllowedMapError')) {
          const href = typeof window !== 'undefined' ? window.location.origin + '/*' : '';
          setLoadError(`Google Maps API key HTTP referrer is not allowed for this origin. Add this origin to your key restrictions: ${href}`);
        } else {
          setLoadError('Failed to load map. Check your Google Maps API key and referrer restrictions.');
        }
        onMapReadyRef.current?.();
      });

    return () => {
      mounted = false;
      try {
        if (trafficLayerRef.current) {
          trafficLayerRef.current.setMap(null);
          trafficLayerRef.current = null;
        }
        googleMapRef.current = null;
      } catch {}
    };
  }, [initialRegion?.latitude, initialRegion?.longitude, initialRegion?.latitudeDelta, initialRegion?.longitudeDelta, showsTraffic, mapType]);

  useImperativeHandle(ref, () => ({
    animateToRegion: (region: Region, _duration?: number) => {
      const map = googleMapRef.current;
      if (!map) return;
      isProgrammaticRef.current = true;
      map.panTo({ lat: region.latitude, lng: region.longitude });
      map.setZoom(regionToZoom(region.latitudeDelta));
    },
    fitToCoordinates: (coords: LatLng[], _opts?: any) => {
      const map = googleMapRef.current;
      const gmaps = (window as any)?.google?.maps;
      if (!map || !gmaps || !coords || coords.length === 0) return;
      const bounds = new gmaps.LatLngBounds();
      coords.forEach((c) => bounds.extend(new gmaps.LatLng(c.latitude, c.longitude)));
      isProgrammaticRef.current = true;
      map.fitBounds(bounds, 80);
    },
    animateCamera: (cam: any, _opts?: any) => {
      const map = googleMapRef.current;
      if (!map) return;
      const center = cam?.center;
      if (center) {
        isProgrammaticRef.current = true;
        map.panTo({ lat: center.latitude, lng: center.longitude });
      }
      if (typeof cam?.zoom === 'number') {
        isProgrammaticRef.current = true;
        map.setZoom(cam.zoom);
      }
    },
  }));

  return (
    <View style={[styles.container, style]} testID={testID ?? 'webGoogleMap'}>
      <View style={styles.mapHost} ref={(el) => (containerRef.current = el as unknown as HTMLDivElement)} />
      {children}
      {loadError ? (
        <View style={styles.errorOverlay} testID="webGoogleMapError">
          <Text style={styles.errorTitle}>Map failed to load</Text>
          <Text style={styles.errorText}>{loadError}</Text>
          <Text style={styles.errorText}>Env var: EXPO_PUBLIC_GOOGLE_MAPS_API_KEY must be set and allow these referrers:</Text>
          <Text style={styles.errorList}>- http://localhost:8081/*</Text>
          <Text style={styles.errorList}>- http://localhost:8080/*</Text>
          <Text style={styles.errorList}>- https://*.exp.direct/*</Text>
          <Text style={styles.errorList}>- https://*.expo.dev/*</Text>
          <Text style={styles.errorList}>- https://*.ngrok-free.app/* (if used)</Text>
          <Pressable onPress={() => {
            setLoadError(null);
            const s = document.getElementById('google-maps-js');
            if (s && s.parentNode) s.parentNode.removeChild(s);
            (window as any).google = undefined;
          }} style={styles.retryBtn} testID="retryMapLoad">
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
});

export type MarkerProps = {
  coordinate: LatLng;
  title?: string;
  description?: string;
  onPress?: () => void;
};

export function Marker({ coordinate, onPress }: MarkerProps) {
  const markerRef = useRef<any>(null);
  const mapRef = (window as any)?.google?.maps;

  useEffect(() => {
    return () => {
      if (markerRef.current) {
        try {
          markerRef.current.setMap(null);
        } catch {}
      }
    };
  }, []);

  useEffect(() => {
    const makeOverlay = async () => {
      const gmaps = await loadGoogleMaps().catch(() => null);
      const map = (window as any)?.__lastGoogleMapInstance;
      if (!gmaps || !map) return;

      class DotOverlay extends gmaps.OverlayView {
        _div: HTMLDivElement | null = null;
        _position: any;
        constructor(position: any) {
          super();
          this._position = position;
        }
        onAdd() {
          this._div = document.createElement('div');
          this._div.style.position = 'absolute';
          this._div.style.width = '24px';
          this._div.style.height = '24px';
          this._div.style.transform = 'translate(-12px, -12px)';
          this._div.style.pointerEvents = 'auto';

          const glow = document.createElement('div');
          glow.style.position = 'absolute';
          glow.style.width = '36px';
          glow.style.height = '36px';
          glow.style.left = '-6px';
          glow.style.top = '-6px';
          glow.style.borderRadius = '18px';
          glow.style.background = 'rgba(96,165,250,0.35)';
          glow.style.animation = 'pulseGlow 2s ease-in-out infinite';

          const core = document.createElement('div');
          core.style.width = '12px';
          core.style.height = '12px';
          core.style.borderRadius = '6px';
          core.style.background = '#60A5FA';
          core.style.border = '2px solid rgba(255,255,255,0.8)';
          core.style.boxShadow = '0 0 8px rgba(96,165,250,0.8)';

          this._div.appendChild(glow);
          this._div.appendChild(core);

          const panes = this.getPanes();
          panes?.overlayMouseTarget.appendChild(this._div!);

          if (onPress) {
            this._div!.addEventListener('click', () => onPress());
          }
        }
        draw() {
          const proj = this.getProjection();
          if (!proj || !this._div) return;
          const pos = proj.fromLatLngToDivPixel(this._position);
          if (!pos) return;
          this._div.style.left = `${pos.x}px`;
          this._div.style.top = `${pos.y}px`;
        }
        onRemove() {
          if (this._div && this._div.parentNode) {
            this._div.parentNode.removeChild(this._div);
          }
          this._div = null;
        }
      }

      const overlay = new DotOverlay(new gmaps.LatLng(coordinate.latitude, coordinate.longitude));
      overlay.setMap(map);
      markerRef.current = overlay;
    };

    makeOverlay();

    return () => {
      if (markerRef.current) {
        try {
          markerRef.current.setMap(null);
        } catch {}
      }
    };
  }, [coordinate.latitude, coordinate.longitude, onPress]);

  return null as any;
}

export const Polyline: any = null;
export const PROVIDER_GOOGLE: any = 'google';

function regionToZoom(latDelta: number): number {
  // rough mapping
  if (latDelta <= 0.05) return 15;
  if (latDelta <= 0.1) return 14;
  if (latDelta <= 0.2) return 13;
  if (latDelta <= 0.5) return 12;
  if (latDelta <= 1) return 11;
  if (latDelta <= 2) return 10;
  if (latDelta <= 3) return 9;
  if (latDelta <= 5) return 8;
  if (latDelta <= 8) return 7;
  if (latDelta <= 12) return 6;
  if (latDelta <= 20) return 5;
  if (latDelta <= 30) return 4;
  return 3;
}
function zoomToLatDelta(z: number): number {
  const table: Record<number, number> = { 3: 30, 4: 20, 5: 12, 6: 8, 7: 5, 8: 3, 9: 2, 10: 1, 11: 0.5, 12: 0.2, 13: 0.1, 14: 0.05, 15: 0.03 };
  return table[Math.round(z)] ?? 30;
}
function zoomToLngDelta(z: number): number {
  return zoomToLatDelta(z) * (45 / 25);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    position: 'relative',
  },
  mapHost: {
    ...StyleSheet.absoluteFillObject,
  },
  errorOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: 'rgba(15,23,42,0.96)',
    borderRadius: 12,
    padding: 16,
    borderColor: 'rgba(148,163,184,0.25)',
    borderWidth: 1,
  },
  errorTitle: {
    color: '#F87171',
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  errorText: {
    color: '#E2E8F0',
    fontSize: 12,
    marginBottom: 6,
  },
  errorList: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 2,
  },
  retryBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: '600' as const,
  },
});

function injectPulseCSS() {
  if (typeof document === 'undefined') return;
  const id = 'pulse-glow-keyframes';
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = `@keyframes pulseGlow { 0% { transform: scale(0.9); opacity: 0.5; } 50% { transform: scale(1.1); opacity: 0.9; } 100% { transform: scale(0.9); opacity: 0.5; } }`;
  document.head.appendChild(style);
}

const darkMapStyles: any = [
  { elementType: 'geometry', stylers: [{ color: '#0b1224' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94A3B8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0b1224' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1f2a44' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2b3a5e' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a142b' }] },
];
