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
        const defaultZoom = 3;
        const zoom = initialRegion ? regionToZoom(initialRegion.latitudeDelta) : defaultZoom;
        const center = initialRegion ? { lat: initialRegion.latitude, lng: initialRegion.longitude } : { lat: USA_CENTER.latitude, lng: USA_CENTER.longitude };
        const map = new gmaps.Map(containerRef.current, {
          center: { lat: USA_CENTER.latitude, lng: USA_CENTER.longitude },
          zoom: 4,
          minZoom: typeof minZoomLevel === 'number' ? minZoomLevel : 3,
          maxZoom: typeof maxZoomLevel === 'number' ? maxZoomLevel : 18,
          mapTypeId: mapType === 'satellite' ? gmaps.MapTypeId.SATELLITE : gmaps.MapTypeId.ROADMAP,
          gestureHandling: 'greedy',
          streetViewControl: false,
          fullscreenControl: false,
          mapTypeControl: false,
          clickableIcons: false,
          zoomControl: false,
          scrollwheel: true,
          keyboardShortcuts: true,
          draggable: true,
          disableDoubleClickZoom: false,
          restriction: {
            latLngBounds: { north: USA_BOUNDS.north, south: USA_BOUNDS.south, west: USA_BOUNDS.west, east: USA_BOUNDS.east },
            strictBounds: false,
          },
          styles: lightMapStyles,
        });
        console.log('[WebMap] Map initialized with draggable: true, gestureHandling: greedy');
        googleMapRef.current = map;
        (window as any).__lastGoogleMapInstance = map;
        injectPulseCSS();

        gmaps.event.addListener(map, 'zoom_changed', () => {
          const currentZoom = map.getZoom() ?? 4;
          const minZ = typeof minZoomLevel === 'number' ? minZoomLevel : 3;
          const maxZ = typeof maxZoomLevel === 'number' ? maxZoomLevel : 18;
          
          if (currentZoom < minZ) {
            isProgrammaticRef.current = true;
            map.setZoom(minZ);
          } else if (currentZoom > maxZ) {
            isProgrammaticRef.current = true;
            map.setZoom(maxZ);
          }
        });

        const usaBounds = new gmaps.LatLngBounds(
          new gmaps.LatLng(USA_BOUNDS.south, USA_BOUNDS.west),
          new gmaps.LatLng(USA_BOUNDS.north, USA_BOUNDS.east),
        );
        try {
          isProgrammaticRef.current = true;
          map.fitBounds(usaBounds, { top: 80, right: 80, bottom: 80, left: 80 } as any);
        } catch (e) {
          console.log('[WebMap] initial USA fit failed', e);
        }

        let ro: ResizeObserver | null = null;
        try {
          if (containerRef.current && 'ResizeObserver' in window) {
            ro = new (window as any).ResizeObserver(() => {
              try {
                isProgrammaticRef.current = true;
                map.fitBounds(usaBounds, { top: 80, right: 80, bottom: 80, left: 80 } as any);
              } catch (e) {
                console.log('[WebMap] resize fit failed', e);
              }
            });
            ro.observe(containerRef.current);
          }
        } catch {}

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
          const href = typeof window !== 'undefined' ? window.location.origin : '';
          setLoadError(`REFERRER BLOCKED: Your Google Maps API key doesn't allow: ${href}`);
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
      try {
        // @ts-ignore
        ro?.disconnect?.();
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
      {/* Zoom Controls */}
      <View style={styles.zoomControls} pointerEvents="box-none">
        <View style={styles.zoomButtonsWrap} pointerEvents="auto">
          <Pressable
            onPress={() => {
              const gmaps = (window as any)?.google?.maps;
              const map = googleMapRef.current;
              if (!map || !gmaps) return;
              try {
                const bounds = new gmaps.LatLngBounds(
                  new gmaps.LatLng(USA_BOUNDS.south, USA_BOUNDS.west),
                  new gmaps.LatLng(USA_BOUNDS.north, USA_BOUNDS.east),
                );
                isProgrammaticRef.current = true;
                map.fitBounds(bounds, { top: 80, right: 80, bottom: 80, left: 80 } as any);
              } catch (e) {
                console.log('[WebMap] fit USA failed', e);
              }
            }}
            style={styles.zoomButton}
            testID="fitUSABtn"
          >
            <Text style={styles.zoomButtonText}>USA</Text>
          </Pressable
          >
          <Pressable
            onPress={() => {
              const map = googleMapRef.current;
              if (!map) return;
              try {
                const current = map.getZoom?.() ?? 4;
                const maxZ = typeof maxZoomLevel === 'number' ? maxZoomLevel : 18;
                const newZoom = Math.min(maxZ, current + 1);
                isProgrammaticRef.current = true;
                map.setZoom(newZoom);
                console.log('[WebMap] Zoom in to', newZoom);
              } catch (e) {
                console.log('[WebMap] zoom in failed', e);
              }
            }}
            style={styles.zoomButton}
            testID="zoomInBtn"
          >
            <Text style={styles.zoomButtonText}>+</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              const map = googleMapRef.current;
              if (!map) return;
              try {
                const current = map.getZoom?.() ?? 4;
                const minZ = typeof minZoomLevel === 'number' ? minZoomLevel : 3;
                const newZoom = Math.max(minZ, current - 1);
                isProgrammaticRef.current = true;
                map.setZoom(newZoom);
                console.log('[WebMap] Zoom out to', newZoom);
              } catch (e) {
                console.log('[WebMap] zoom out failed', e);
              }
            }}
            style={styles.zoomButton}
            testID="zoomOutBtn"
          >
            <Text style={styles.zoomButtonText}>-</Text>
          </Pressable>
        </View>
      </View>
      {children}
      {loadError ? (
        <View style={styles.errorOverlay} testID="webGoogleMapError">
          <View style={styles.errorContent}>
            <Text style={styles.errorTitle}>🔒 Google Maps API Key Issue</Text>
            <Text style={styles.errorText}>{loadError}</Text>
            
            <View style={styles.instructionBox}>
              <Text style={styles.instructionTitle}>QUICK FIX:</Text>
              <Text style={styles.instructionStep}>1. Go to: console.cloud.google.com/apis/credentials</Text>
              <Text style={styles.instructionStep}>2. Select your API key: {process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.substring(0, 20)}...</Text>
              <Text style={styles.instructionStep}>3. Under &quot;Website restrictions&quot;, add these referrers:</Text>
              <View style={styles.referrerBox}>
                <Text style={styles.referrerText}>{typeof window !== 'undefined' ? window.location.origin + '/*' : ''}</Text>
                <Text style={styles.referrerText}>http://localhost:8081/*</Text>
                <Text style={styles.referrerText}>http://localhost:8080/*</Text>
                <Text style={styles.referrerText}>https://*.exp.direct/*</Text>
                <Text style={styles.referrerText}>https://*.expo.dev/*</Text>
              </View>
              <Text style={styles.instructionStep}>4. Save changes and wait 1-2 minutes</Text>
            </View>
            
            <Pressable onPress={() => {
              setLoadError(null);
              const s = document.getElementById('google-maps-js');
              if (s && s.parentNode) s.parentNode.removeChild(s);
              (window as any).google = undefined;
              window.location.reload();
            }} style={styles.retryBtn} testID="retryMapLoad">
              <Text style={styles.retryText}>I&apos;ve Added the Referrers - Reload</Text>
            </Pressable>
          </View>
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
    width: '100%',
    height: '100%',
  },
  mapHost: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContent: {
    maxWidth: 600,
    width: '100%',
  },
  errorTitle: {
    color: '#FBBF24',
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 12,
    textAlign: 'center' as const,
  },
  errorText: {
    color: '#F87171',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center' as const,
    fontWeight: '600' as const,
  },
  instructionBox: {
    backgroundColor: 'rgba(30,41,59,0.8)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.3)',
    marginBottom: 20,
  },
  instructionTitle: {
    color: '#60A5FA',
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  instructionStep: {
    color: '#E2E8F0',
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 20,
  },
  referrerBox: {
    backgroundColor: 'rgba(15,23,42,0.8)',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.3)',
  },
  referrerText: {
    color: '#34D399',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  retryBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center' as const,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: '700' as const,
    fontSize: 15,
  },
  zoomControls: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 12,
  },
  zoomButtonsWrap: {
    backgroundColor: 'rgba(15,23,42,0.7)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
    overflow: 'hidden',
  },
  zoomButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.25)',
  },
  zoomButtonText: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: '700' as const,
  }
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

const lightMapStyles: any = [
  { elementType: 'geometry', stylers: [{ color: '#f0ebe2' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#3b3b3b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'on' }] },
  { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#3b3b3b' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#b0b0b0' }] },
  { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#d0d0d0' }] },
  
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f0ebe2' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#e0dac6' }] },
  { featureType: 'landscape.natural.landcover', elementType: 'geometry', stylers: [{ color: '#d5e8d8' }] },
  { featureType: 'landscape.natural.terrain', elementType: 'geometry', stylers: [{ visibility: 'on' }, { color: '#d5e8d8' }] },
  
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#d5e8d8' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6b6b6b' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#c5e6c5' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#447b44' }] },
  
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#6b6b6b' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'geometry.stroke', stylers: [{ color: '#e0e0e0' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#ffdb5c' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#e0a800' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#3b3b3b' }] },
  { featureType: 'road.local', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#e0e0e0' }] },
  { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#6b6b6b' }] },
  
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#a8d4f2' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4a7396' }] },
];
