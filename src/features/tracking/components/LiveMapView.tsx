import { createElement, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/constants/theme';
import { MapUnavailable } from './MapUnavailable';
import type { LiveMapViewProps } from './liveMapProps';
import { interpolateCoordinate, shouldFollowCamera, type MapCoordinate } from '../live';
import { DEMO_TICK_MS } from '../demoLocation';

type LeafletMap = {
  setView: (center: [number, number], zoom?: number) => void;
  panTo: (center: [number, number], options?: { animate?: boolean; duration?: number }) => void;
  fitBounds: (bounds: [[number, number], [number, number]], options?: { padding?: [number, number] }) => void;
  invalidateSize: () => void;
  remove: () => void;
  on: (event: string, handler: () => void) => void;
};

type LeafletMarker = {
  setLatLng: (latLng: [number, number]) => void;
  setIcon: (icon: unknown) => void;
  addTo: (map: LeafletMap) => LeafletMarker;
};

type LeafletPolyline = {
  setLatLngs: (latLngs: [number, number][]) => void;
  addTo: (map: LeafletMap) => LeafletPolyline;
};

type LeafletNamespace = {
  map: (el: HTMLElement, options: Record<string, unknown>) => LeafletMap;
  tileLayer: (url: string, options: Record<string, unknown>) => { addTo: (map: LeafletMap) => void };
  marker: (latLng: [number, number], options?: Record<string, unknown>) => LeafletMarker;
  polyline: (latLngs: [number, number][], options?: Record<string, unknown>) => LeafletPolyline;
  divIcon: (options: Record<string, unknown>) => unknown;
};

declare global {
  interface Window {
    L?: LeafletNamespace;
  }
}

let leafletLoader: Promise<LeafletNamespace> | null = null;

function loadLeaflet(): Promise<LeafletNamespace> {
  if (typeof window !== 'undefined' && window.L) {
    return Promise.resolve(window.L);
  }
  if (leafletLoader) {
    return leafletLoader;
  }
  leafletLoader = new Promise((resolve, reject) => {
    const cssId = 'agewell-leaflet-css';
    if (!document.getElementById(cssId)) {
      const css = document.createElement('link');
      css.id = cssId;
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(css);
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
      if (!window.L) {
        reject(new Error('Leaflet failed to load'));
        return;
      }
      resolve(window.L);
    };
    script.onerror = () => reject(new Error('Leaflet failed to load'));
    document.body.appendChild(script);
  });
  return leafletLoader;
}

function toLatLng(coord: MapCoordinate): [number, number] {
  return [coord.latitude, coord.longitude];
}

function placeIconHtml(kind: 'home' | 'senior'): string {
  const emoji = kind === 'home' ? 'ðŸ ' : 'ðŸ“';
  const label = kind === 'home' ? 'Home' : 'Senior';
  return `<div class="aw-place" title="${label}"><span>${emoji}</span></div>`;
}

function vehicleIconHtml(heading: number, live: boolean): string {
  return `<div class="aw-vehicle-wrap">
    ${live ? '<div class="aw-vehicle-pulse"></div>' : ''}
    <div class="aw-vehicle" style="transform: rotate(${heading}deg)">
      <div class="aw-vehicle-nose"></div>
    </div>
  </div>`;
}

function ensureVehicleStyles() {
  const id = 'agewell-live-vehicle-css';
  if (document.getElementById(id)) {
    return;
  }
  const style = document.createElement('style');
  style.id = id;
  style.textContent = `
    .aw-vehicle-wrap { width: 44px; height: 44px; position: relative; }
    .aw-vehicle-pulse {
      position: absolute; inset: 0; border-radius: 22px;
      background: ${colors.primary}; opacity: 0.35;
      animation: aw-pulse 1.6s ease-out infinite;
    }
    .aw-vehicle {
      width: 36px; height: 36px; margin: 4px; border-radius: 18px;
      background: ${colors.primary}; border: 3px solid #fff;
      box-shadow: 0 4px 12px rgba(28,31,51,0.25);
      display: flex; align-items: center; justify-content: center;
    }
    .aw-vehicle-nose {
      width: 0; height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-bottom: 14px solid #fff;
      margin-top: -4px;
    }
    .aw-place {
      width: 36px; height: 36px; border-radius: 18px;
      background: #fff; border: 2px solid ${colors.accent};
      box-shadow: 0 2px 8px rgba(28,31,51,0.2);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; line-height: 20px;
    }
    @keyframes aw-pulse {
      from { transform: scale(0.7); opacity: 0.45; }
      to { transform: scale(1.7); opacity: 0; }
    }
    .leaflet-container { width: 100%; height: 100%; background: #e8eaed; }
  `;
  document.head.appendChild(style);
}

export function LiveMapView({
  associate,
  live,
  heading = 0,
  senior,
  home,
  traveledPath,
  remainingPath,
  followMode,
  onUserGesture,
  onMapReady,
  fitToken = 0,
}: LiveMapViewProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const vehicleRef = useRef<LeafletMarker | null>(null);
  const homeRef = useRef<LeafletMarker | null>(null);
  const seniorRef = useRef<LeafletMarker | null>(null);
  const traveledRef = useRef<LeafletPolyline | null>(null);
  const remainingRef = useRef<LeafletPolyline | null>(null);
  const leafletRef = useRef<LeafletNamespace | null>(null);
  const followRef = useRef(followMode);
  const lastAssociateRef = useRef<MapCoordinate | null>(null);
  const animRef = useRef<number | null>(null);
  const didFitRef = useRef(false);
  const lastFitTokenRef = useRef(0);
  const readyRef = useRef(false);
  const mapEpochRef = useRef(0);
  const [mapEpoch, setMapEpoch] = useState(0);
  const onUserGestureRef = useRef(onUserGesture);
  const onMapReadyRef = useRef(onMapReady);
  const hasPins = Boolean(associate || senior || home);

  followRef.current = followMode;
  onUserGestureRef.current = onUserGesture;
  onMapReadyRef.current = onMapReady;

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const L = await loadLeaflet();
        if (cancelled || !hostRef.current) {
          return;
        }
        ensureVehicleStyles();
        leafletRef.current = L;
        const center = associate ?? senior ?? home;
        const map = L.map(hostRef.current, {
          zoomControl: false,
          attributionControl: true,
          zoom: 15,
          center: center ? toLatLng(center) : [20.5937, 78.9629],
        });
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap &copy; CARTO',
          maxZoom: 20,
        }).addTo(map);
        map.on('dragstart', () => onUserGestureRef.current());
        mapRef.current = map;
        requestAnimationFrame(() => map.invalidateSize());
        mapEpochRef.current += 1;
        setMapEpoch(mapEpochRef.current);
        if (!readyRef.current) {
          readyRef.current = true;
          onMapReadyRef.current();
        }
      } catch {
        if (!cancelled) {
          onMapReadyRef.current();
        }
      }
    })();

    return () => {
      cancelled = true;
      if (animRef.current != null) {
        cancelAnimationFrame(animRef.current);
      }
      mapRef.current?.remove();
      mapRef.current = null;
      vehicleRef.current = null;
      homeRef.current = null;
      seniorRef.current = null;
      traveledRef.current = null;
      remainingRef.current = null;
      didFitRef.current = false;
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) {
      return;
    }

    if (associate) {
      if (!vehicleRef.current) {
        vehicleRef.current = L.marker(toLatLng(associate), {
          icon: L.divIcon({
            className: '',
            html: vehicleIconHtml(heading, live),
            iconSize: [44, 44],
            iconAnchor: [22, 22],
          }),
          zIndexOffset: 600,
        }).addTo(map);
        lastAssociateRef.current = associate;
      } else {
        vehicleRef.current.setIcon(
          L.divIcon({
            className: '',
            html: vehicleIconHtml(heading, live),
            iconSize: [44, 44],
            iconAnchor: [22, 22],
          }),
        );
        const from = lastAssociateRef.current ?? associate;
        lastAssociateRef.current = associate;
        if (animRef.current != null) {
          cancelAnimationFrame(animRef.current);
        }
        const started = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - started) / DEMO_TICK_MS);
          const current = interpolateCoordinate(from, associate, progress);
          vehicleRef.current?.setLatLng(toLatLng(current));
          if (shouldFollowCamera(followRef.current)) {
            map.panTo(toLatLng(current), { animate: false });
          }
          if (progress < 1) {
            animRef.current = requestAnimationFrame(tick);
          }
        };
        animRef.current = requestAnimationFrame(tick);
      }
    }

    if (home) {
      if (!homeRef.current) {
        homeRef.current = L.marker(toLatLng(home), {
          icon: L.divIcon({ className: '', html: placeIconHtml('home'), iconSize: [36, 36], iconAnchor: [18, 36] }),
        }).addTo(map);
      } else {
        homeRef.current.setLatLng(toLatLng(home));
      }
    }

    if (senior) {
      if (!seniorRef.current) {
        seniorRef.current = L.marker(toLatLng(senior), {
          icon: L.divIcon({ className: '', html: placeIconHtml('senior'), iconSize: [36, 36], iconAnchor: [18, 36] }),
          zIndexOffset: 400,
        }).addTo(map);
      } else {
        seniorRef.current.setLatLng(toLatLng(senior));
      }
    }

    if (!traveledRef.current) {
      traveledRef.current = L.polyline((traveledPath ?? []).map(toLatLng), {
        color: colors.primary,
        weight: 5,
        opacity: 0.95,
      }).addTo(map);
    } else {
      traveledRef.current.setLatLngs((traveledPath ?? []).map(toLatLng));
    }

    if (!remainingRef.current) {
      remainingRef.current = L.polyline((remainingPath ?? []).map(toLatLng), {
        color: '#C5C9D6',
        weight: 5,
        dashArray: '8 8',
        opacity: 0.95,
      }).addTo(map);
    } else {
      remainingRef.current.setLatLngs((remainingPath ?? []).map(toLatLng));
    }

    const shouldFit = !didFitRef.current || fitToken !== lastFitTokenRef.current;
    if (shouldFit) {
      const bounds: [number, number][] = [];
      if (associate) bounds.push(toLatLng(associate));
      if (senior) bounds.push(toLatLng(senior));
      if (home) bounds.push(toLatLng(home));
      if (bounds.length >= 2) {
        didFitRef.current = true;
        lastFitTokenRef.current = fitToken;
        map.fitBounds([bounds[0], bounds[bounds.length - 1]] as [[number, number], [number, number]], {
          padding: [72, 72],
        });
      } else if (bounds[0]) {
        didFitRef.current = true;
        lastFitTokenRef.current = fitToken;
        map.setView(bounds[0], 15);
      }
    }
  }, [associate, heading, live, senior, home, traveledPath, remainingPath, mapEpoch, fitToken]);

  return (
    <View style={styles.fill} accessibilityLabel="Live location map">
      {createElement('div', {
        ref: hostRef,
        style: {
          width: '100%',
          height: '100%',
          display: hasPins ? 'block' : 'none',
        },
      })}
      {!hasPins ? <MapUnavailable /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#e8eaed',
  },
});
