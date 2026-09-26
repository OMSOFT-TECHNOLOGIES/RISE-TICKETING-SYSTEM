import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { GHANA_BOUNDS, DEFAULT_MAP_CENTER } from '../IncidentManagement/constants';
import { appEnv } from './env';

let optionsConfigured = false;
let loadPromise: Promise<typeof google> | null = null;

export function getGoogleMapsApiKey(): string {
  return appEnv.googleMapsApiKey;
}

export function loadGoogleMaps(): Promise<typeof google> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    return Promise.reject(new Error('VITE_GOOGLE_MAPS_API_KEY is not configured'));
  }

  if (!loadPromise) {
    if (!optionsConfigured) {
      setOptions({ key: apiKey, v: 'weekly', region: 'GH' });
      optionsConfigured = true;
    }

    loadPromise = Promise.all([importLibrary('maps'), importLibrary('geocoding')]).then(
      () => google
    );
  }

  return loadPromise;
}

export function ghanaMapRestriction(): google.maps.MapRestriction {
  return {
    latLngBounds: {
      north: GHANA_BOUNDS.north,
      south: GHANA_BOUNDS.south,
      east: GHANA_BOUNDS.east,
      west: GHANA_BOUNDS.west,
    },
    strictBounds: false,
  };
}

export function getDefaultGoogleMapOptions(
  overrides?: google.maps.MapOptions
): google.maps.MapOptions {
  return {
    center: DEFAULT_MAP_CENTER,
    zoom: 7,
    mapTypeId: 'roadmap',
    mapTypeControl: true,
    mapTypeControlOptions: {
      mapTypeIds: ['roadmap', 'hybrid'],
    },
    streetViewControl: true,
    fullscreenControl: true,
    restriction: ghanaMapRestriction(),
    ...overrides,
  };
}

export function getSeverityMarkerColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return '#ef4444';
    case 'high':
      return '#f97316';
    case 'medium':
      return '#f59e0b';
    case 'low':
      return '#10b981';
    default:
      return '#94a3b8';
  }
}

export function createCircleMarkerIcon(
  scale: number,
  fillColor: string
): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale,
    fillColor,
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
  };
}
