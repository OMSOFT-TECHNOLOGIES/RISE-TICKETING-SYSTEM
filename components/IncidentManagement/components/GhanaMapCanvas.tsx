import React, { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import type { Incident } from '../types';
import { getSeverityDotClass } from '../utils';
import { DEFAULT_MAP_CENTER } from '../constants';
import {
  createCircleMarkerIcon,
  getDefaultGoogleMapOptions,
  getGoogleMapsApiKey,
  getSeverityMarkerColor,
  loadGoogleMaps,
} from '../../utils/googleMaps';

interface GhanaMapCanvasProps {
  incidents?: Incident[];
  selectedId?: string | null;
  onSelectIncident?: (incident: Incident) => void;
  height?: string;
  showLegend?: boolean;
  singleMarker?: { lat: number; lng: number; severity?: string; label?: string };
  variant?: 'light' | 'dark';
}

export function GhanaMapCanvas({
  incidents = [],
  selectedId,
  onSelectIncident,
  height = '100%',
  showLegend = true,
  singleMarker,
  variant = 'dark',
}: GhanaMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const plottedCount = incidents.filter((i) => i.coordinates).length;
  const isDark = variant === 'dark';

  useEffect(() => {
    if (!getGoogleMapsApiKey()) {
      setError('Set VITE_GOOGLE_MAPS_API_KEY in your .env file');
      setLoading(false);
      return;
    }

    let cancelled = false;

    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !containerRef.current) return;
        const map = new google.maps.Map(
          containerRef.current,
          getDefaultGoogleMapOptions({ zoom: singleMarker ? 12 : 7 })
        );
        mapRef.current = map;
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load Google Maps');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || loading) return;

    const mappedIncidents = incidents.filter((i) => i.coordinates);

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (singleMarker) {
      const position = { lat: singleMarker.lat, lng: singleMarker.lng };
      map.setCenter(position);
      map.setZoom(14);
      const marker = new google.maps.Marker({
        position,
        map,
        icon: createCircleMarkerIcon(
          10,
          getSeverityMarkerColor(singleMarker.severity ?? 'high')
        ),
        title: singleMarker.label,
      });
      markersRef.current.push(marker);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    let hasBounds = false;

    for (const incident of mappedIncidents) {
      const coords = incident.coordinates!;
      const position = { lat: coords.lat, lng: coords.lng };
      const isSelected = incident.id === selectedId;
      const marker = new google.maps.Marker({
        position,
        map,
        icon: createCircleMarkerIcon(
          isSelected ? 11 : 8,
          getSeverityMarkerColor(incident.severity)
        ),
        title: `${incident.id} · ${incident.title}`,
        zIndex: isSelected ? 2 : 1,
      });
      marker.addListener('click', () => onSelectIncident?.(incident));
      markersRef.current.push(marker);
      bounds.extend(position);
      hasBounds = true;
    }

    if (hasBounds && mappedIncidents.length > 1) {
      map.fitBounds(bounds, 48);
    } else if (hasBounds && mappedIncidents.length === 1) {
      map.setCenter(bounds.getCenter()!);
      map.setZoom(12);
    } else {
      map.setCenter(DEFAULT_MAP_CENTER);
      map.setZoom(7);
    }
  }, [incidents, selectedId, singleMarker, onSelectIncident, loading]);

  return (
    <div
      className={`relative w-full overflow-hidden ${isDark ? 'bg-slate-900' : 'bg-slate-100'}`}
      style={{ height }}
    >
      <div ref={containerRef} className="absolute inset-0" />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 z-20">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-20 p-4">
          <div
            className={`rounded-lg border px-6 py-5 text-center max-w-sm ${
              isDark ? 'bg-slate-800/95 border-slate-700 text-slate-300' : 'bg-white border-slate-200'
            }`}
          >
            <MapPin className={`h-8 w-8 mx-auto mb-2 ${isDark ? 'text-slate-500' : 'text-muted-foreground'}`} />
            <p className="text-sm font-medium">Map unavailable</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-muted-foreground'}`}>{error}</p>
          </div>
        </div>
      )}

      {!error && (
        <>
          <div
            className={`absolute top-4 left-4 rounded-md border px-3 py-2 text-xs z-10 pointer-events-none ${
              isDark ? 'bg-slate-800/90 border-slate-700 text-slate-200' : 'bg-white/95 border-slate-200'
            }`}
          >
            <p className="font-medium">Ghana — Live Incident Map</p>
            <p className={isDark ? 'text-slate-400' : 'text-muted-foreground'}>
              {singleMarker ? 'Single location' : `${plottedCount} plotted`}
            </p>
          </div>

          {showLegend && !singleMarker && (
            <div
              className={`absolute top-4 right-4 rounded-md border px-3 py-2 z-10 pointer-events-none ${
                isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white/95 border-slate-200'
              }`}
            >
              <p className={`text-xs font-medium mb-2 ${isDark ? 'text-slate-200' : ''}`}>Severity</p>
              <div className="space-y-1.5">
                {(['low', 'medium', 'high', 'critical'] as const).map((s) => (
                  <div
                    key={s}
                    className={`flex items-center gap-2 text-[11px] ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${getSeverityDotClass(s)} ${s === 'critical' ? 'animate-pulse' : ''}`}
                    />
                    <span className="capitalize">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!singleMarker && plottedCount === 0 && !loading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div
                className={`rounded-lg border px-6 py-5 text-center ${
                  isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-white/95 border-slate-200'
                }`}
              >
                <MapPin className={`h-8 w-8 mx-auto mb-2 ${isDark ? 'text-slate-500' : 'text-muted-foreground'}`} />
                <p className="text-sm font-medium">No mapped incidents</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-muted-foreground'}`}>
                  Adjust filters or report a new case with location data
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
