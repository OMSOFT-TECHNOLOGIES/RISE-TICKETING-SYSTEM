import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { MapPin, Search, Navigation, RotateCcw, AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { notify } from './utils/notify';
import { GHANA_BOUNDS, DEFAULT_MAP_CENTER } from './IncidentManagement/constants';
import {
  getDefaultGoogleMapOptions,
  getGoogleMapsApiKey,
  loadGoogleMaps,
} from './utils/googleMaps';

interface MapLocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address?: string }) => void;
  initialLocation?: { lat: number; lng: number };
  className?: string;
}

interface SelectedLocation {
  lat: number;
  lng: number;
  address?: string;
}

export function MapLocationPicker({
  onLocationSelect,
  initialLocation = DEFAULT_MAP_CENTER,
  className = '',
}: MapLocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(
    initialLocation ? { ...initialLocation } : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  const commonLocations = [
    { name: 'Accra Central', lat: 5.56, lng: -0.2057 },
    { name: 'Kumasi', lat: 6.6885, lng: -1.6244 },
    { name: 'Tamale', lat: 9.4034, lng: -0.8424 },
    { name: 'Cape Coast', lat: 5.1053, lng: -1.2466 },
    { name: 'Takoradi', lat: 4.896, lng: -1.7566 },
    { name: 'Ho', lat: 6.6012, lng: 0.4816 },
    { name: 'Sunyani', lat: 7.3395, lng: -2.3297 },
    { name: 'Koforidua', lat: 6.0939, lng: -0.2637 },
  ];

  const onLocationSelectRef = useRef(onLocationSelect);
  onLocationSelectRef.current = onLocationSelect;

  const reverseGeocode = async (location: { lat: number; lng: number }) => {
    const geocoder = geocoderRef.current;
    if (!geocoder) return;

    try {
      const response = await geocoder.geocode({ location });
      const address = response.results[0]?.formatted_address;
      if (address) {
        const withAddress = { ...location, address };
        setSelectedLocation(withAddress);
        onLocationSelectRef.current(withAddress);
      }
    } catch {
      /* keep coordinates only */
    }
  };

  const placeMarker = useCallback((location: SelectedLocation, pan = true) => {
    const map = mapRef.current;
    if (!map) return;

    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    markerRef.current = new google.maps.Marker({
      position: location,
      map,
      draggable: true,
      title: 'Selected location',
    });

    markerRef.current.addListener('dragend', () => {
      const pos = markerRef.current?.getPosition();
      if (!pos) return;
      const dragged = { lat: pos.lat(), lng: pos.lng() };
      setSelectedLocation(dragged);
      onLocationSelectRef.current(dragged);
      void reverseGeocode(dragged);
    });

    if (pan) {
      map.panTo(location);
      if ((map.getZoom() ?? 0) < 12) map.setZoom(12);
    }

    setSelectedLocation(location);
    onLocationSelectRef.current(location);
  }, []);

  useEffect(() => {
    if (!getGoogleMapsApiKey()) {
      setMapError('Set VITE_GOOGLE_MAPS_API_KEY in your .env file');
      setMapLoading(false);
      return;
    }

    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapContainerRef.current) return;

        geocoderRef.current = new google.maps.Geocoder();

        const map = new google.maps.Map(
          mapContainerRef.current,
          getDefaultGoogleMapOptions({
            center: initialLocation,
            zoom: 10,
          })
        );
        mapRef.current = map;

        map.addListener('click', (event: google.maps.MapMouseEvent) => {
          const latLng = event.latLng;
          if (!latLng) return;
          const location = { lat: latLng.lat(), lng: latLng.lng() };
          placeMarker(location);
          void reverseGeocode(location);
        });

        if (initialLocation) {
          placeMarker({ ...initialLocation }, false);
        }

        setMapLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setMapError(err instanceof Error ? err.message : 'Failed to load Google Maps');
          setMapLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map initializes once
  }, []);

  const handleQuickLocation = (location: typeof commonLocations[0]) => {
    const loc = { lat: location.lat, lng: location.lng, address: location.name };
    placeMarker(loc);
    void reverseGeocode(loc);
  };

  const handleCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      notify.error('Geolocation is not supported by this browser');
      return;
    }

    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        if (
          location.lat >= GHANA_BOUNDS.south &&
          location.lat <= GHANA_BOUNDS.north &&
          location.lng >= GHANA_BOUNDS.west &&
          location.lng <= GHANA_BOUNDS.east
        ) {
          placeMarker(location);
          void reverseGeocode(location);
          notify.success('Current location selected');
        } else {
          notify.warning('Location is outside Ghana. Pin placed; verify on the map.');
          placeMarker(location);
          void reverseGeocode(location);
        }
        setIsLoading(false);
      },
      (error) => {
        setIsLoading(false);
        let errorMessage = 'Unable to get your current location';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please allow location access and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable. Please select a location manually.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again or select manually.';
            break;
        }

        notify.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) return;

    const geocoder = geocoderRef.current;
    if (!geocoder) {
      const found = commonLocations.find((loc) =>
        loc.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (found) {
        handleQuickLocation(found);
        setSearchQuery('');
        notify.success(`Found ${found.name}`);
      } else {
        notify.error('Map is still loading or search is unavailable.');
      }
      return;
    }

    try {
      const response = await geocoder.geocode({
        address: searchQuery,
        region: 'gh',
        bounds: new google.maps.LatLngBounds(
          { lat: GHANA_BOUNDS.south, lng: GHANA_BOUNDS.west },
          { lat: GHANA_BOUNDS.north, lng: GHANA_BOUNDS.east }
        ),
      });

      const result = response.results[0];
      if (!result?.geometry?.location) {
        notify.error('Location not found. Try a city name or click on the map.');
        return;
      }

      const lat = result.geometry.location.lat();
      const lng = result.geometry.location.lng();
      const location = {
        lat,
        lng,
        address: result.formatted_address,
      };
      placeMarker(location);
      setSearchQuery('');
      notify.success('Location found');
    } catch {
      notify.error('Search failed. Try quick locations or click on the map.');
    }
  };

  const resetLocation = () => {
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
    setSelectedLocation(null);
    mapRef.current?.setCenter(initialLocation);
    mapRef.current?.setZoom(10);
    setSearchQuery('');
    notify.info('Location selection reset');
  };

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Select Location on Map
            </Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCurrentLocation}
                disabled={isLoading || mapLoading || !!mapError}
                className="flex items-center gap-1"
              >
                <Navigation className="h-3 w-3" />
                {isLoading ? 'Getting...' : 'My Location'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetLocation}
                disabled={mapLoading || !!mapError}
                className="flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Search for a location (e.g., Accra, Kumasi)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleSearchLocation()}
              disabled={mapLoading || !!mapError}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleSearchLocation()}
              className="px-3"
              disabled={mapLoading || !!mapError}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Quick Select:</Label>
            <div className="flex flex-wrap gap-2">
              {commonLocations.slice(0, 6).map((location) => (
                <Button
                  key={location.name}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLocation(location)}
                  className="text-xs"
                  disabled={mapLoading || !!mapError}
                >
                  {location.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="relative w-full h-80 rounded-lg border overflow-hidden bg-muted">
            <div ref={mapContainerRef} className="absolute inset-0" />
            {mapLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/80 z-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            {mapError && (
              <div className="absolute inset-0 flex items-center justify-center p-4 z-10 bg-muted">
                <div className="text-center text-sm text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-medium">Google Maps could not load</p>
                  <p className="text-xs mt-1">{mapError}</p>
                </div>
              </div>
            )}
            {!mapLoading && !mapError && !selectedLocation && (
              <div className="absolute bottom-3 left-3 right-3 pointer-events-none z-10">
                <p className="text-xs text-center bg-background/90 rounded px-2 py-1 border text-muted-foreground">
                  Click the map or drag the pin to set the incident location
                </p>
              </div>
            )}
          </div>

          {selectedLocation && (
            <div className="p-3 bg-muted rounded-lg">
              <Label className="text-sm font-medium">Selected Location:</Label>
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    Latitude: {selectedLocation.lat.toFixed(6)}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Longitude: {selectedLocation.lng.toFixed(6)}
                  </Badge>
                </div>
                {selectedLocation.address && (
                  <p className="text-sm text-muted-foreground">{selectedLocation.address}</p>
                )}
              </div>
            </div>
          )}

          {!('geolocation' in navigator) && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-700">
                Your browser doesn&apos;t support location services. Please select a location on the map.
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
