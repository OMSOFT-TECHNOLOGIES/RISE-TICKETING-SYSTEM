import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { MapPin, Search, Navigation, RotateCcw, AlertCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

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
  initialLocation = { lat: 5.5600, lng: -0.2057 }, // Default to Accra
  className = '' 
}: MapLocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(
    initialLocation ? { ...initialLocation } : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState(initialLocation);
  const [zoom, setZoom] = useState(10);

  // Ghana's bounds for the map
  const ghanaBounds = {
    north: 11.2,
    south: 4.5,
    east: 1.3,
    west: -3.5
  };

  // Common locations in Ghana for quick selection
  const commonLocations = [
    { name: 'Accra Central', lat: 5.5600, lng: -0.2057 },
    { name: 'Kumasi', lat: 6.6885, lng: -1.6244 },
    { name: 'Tamale', lat: 9.4034, lng: -0.8424 },
    { name: 'Cape Coast', lat: 5.1053, lng: -1.2466 },
    { name: 'Takoradi', lat: 4.8960, lng: -1.7566 },
    { name: 'Ho', lat: 6.6012, lng: 0.4816 },
    { name: 'Sunyani', lat: 7.3395, lng: -2.3297 },
    { name: 'Koforidua', lat: 6.0939, lng: -0.2637 }
  ];

  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const mapContainer = event.currentTarget;
    const rect = mapContainer.getBoundingClientRect();
    
    // Calculate relative position within the map
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert pixel coordinates to lat/lng
    // This is a simplified conversion for demonstration
    const lat = ghanaBounds.north - (y / rect.height) * (ghanaBounds.north - ghanaBounds.south);
    const lng = ghanaBounds.west + (x / rect.width) * (ghanaBounds.east - ghanaBounds.west);
    
    const newLocation = { lat, lng };
    setSelectedLocation(newLocation);
    onLocationSelect(newLocation);
    
    // Simulate reverse geocoding for address
    setTimeout(() => {
      const address = generateMockAddress(lat, lng);
      const updatedLocation = { ...newLocation, address };
      setSelectedLocation(updatedLocation);
      onLocationSelect(updatedLocation);
    }, 500);
  };

  const generateMockAddress = (lat: number, lng: number): string => {
    // Simple mock address generation based on coordinates
    const regions = [
      'Greater Accra', 'Ashanti', 'Northern', 'Western', 'Central', 
      'Eastern', 'Volta', 'Brong Ahafo', 'Upper East', 'Upper West'
    ];
    
    const roadTypes = ['Highway', 'Road', 'Street', 'Avenue', 'Lane'];
    const landmarks = ['Junction', 'Roundabout', 'Bridge', 'Market', 'Station'];
    
    const region = regions[Math.floor(lat * 2) % regions.length];
    const roadType = roadTypes[Math.floor(lng * 3) % roadTypes.length];
    const landmark = landmarks[Math.floor((lat + lng) * 5) % landmarks.length];
    
    return `Near ${landmark}, ${roadType}, ${region} Region`;
  };

  const handleQuickLocation = (location: typeof commonLocations[0]) => {
    setSelectedLocation(location);
    setMapCenter(location);
    onLocationSelect(location);
  };

  const handleCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    setIsLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        // Check if the location is within Ghana's approximate bounds
        if (
          location.lat >= ghanaBounds.south && 
          location.lat <= ghanaBounds.north &&
          location.lng >= ghanaBounds.west && 
          location.lng <= ghanaBounds.east
        ) {
          setSelectedLocation(location);
          setMapCenter(location);
          onLocationSelect(location);
          toast.success('Current location selected');
        } else {
          toast.warning('Location is outside Ghana. Please select a location manually.');
          // Still set the location but show a warning
          setSelectedLocation(location);
          setMapCenter(initialLocation); // Keep map centered on Ghana
          onLocationSelect(location);
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
          default:
            errorMessage = 'An unknown error occurred while getting your location.';
            break;
        }
        
        toast.error(errorMessage);
        console.warn('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const handleSearchLocation = () => {
    if (!searchQuery.trim()) return;
    
    // Mock search functionality
    const found = commonLocations.find(loc => 
      loc.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (found) {
      handleQuickLocation(found);
      setSearchQuery('');
      toast.success(`Found ${found.name}`);
    } else {
      toast.error('Location not found. Please try selecting from quick locations or click on the map.');
    }
  };

  const resetLocation = () => {
    setSelectedLocation(null);
    setMapCenter(initialLocation);
    setSearchQuery('');
    toast.info('Location selection reset');
  };

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
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
                disabled={isLoading}
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
                className="flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="flex gap-2">
            <Input
              placeholder="Search for a location (e.g., Accra, Kumasi)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchLocation()}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleSearchLocation}
              className="px-3"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Locations */}
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
                >
                  {location.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Map Container */}
          <div 
            className="relative w-full h-80 bg-muted rounded-lg border-2 border-dashed border-muted-foreground/25 cursor-crosshair overflow-hidden"
            onClick={handleMapClick}
          >
            {/* Map Background */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 20% 80%, rgba(34, 197, 94, 0.2) 0%, transparent 50%),
                  radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.2) 0%, transparent 50%),
                  linear-gradient(45deg, rgba(34, 197, 94, 0.05) 25%, transparent 25%),
                  linear-gradient(-45deg, rgba(59, 130, 246, 0.05) 25%, transparent 25%)
                `,
                backgroundSize: '40px 40px, 40px 40px, 20px 20px, 20px 20px'
              }}
            />

            {/* Grid Lines */}
            <div className="absolute inset-0 opacity-10">
              {[...Array(8)].map((_, i) => (
                <div
                  key={`h-${i}`}
                  className="absolute w-full h-px bg-gray-400"
                  style={{ top: `${(i + 1) * 12.5}%` }}
                />
              ))}
              {[...Array(10)].map((_, i) => (
                <div
                  key={`v-${i}`}
                  className="absolute h-full w-px bg-gray-400"
                  style={{ left: `${(i + 1) * 10}%` }}
                />
              ))}
            </div>

            {/* Map Labels */}
            <div className="absolute top-2 left-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
              Ghana Map
            </div>
            <div className="absolute top-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
              Click to select location
            </div>

            {/* Location Markers for Major Cities */}
            {commonLocations.map((location) => {
              const x = ((location.lng - ghanaBounds.west) / (ghanaBounds.east - ghanaBounds.west)) * 100;
              const y = ((ghanaBounds.north - location.lat) / (ghanaBounds.north - ghanaBounds.south)) * 100;
              
              return (
                <div
                  key={location.name}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <div className="absolute top-3 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap bg-background/70 px-1 rounded">
                    {location.name}
                  </div>
                </div>
              );
            })}

            {/* Selected Location Marker */}
            {selectedLocation && (
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                style={{
                  left: `${((selectedLocation.lng - ghanaBounds.west) / (ghanaBounds.east - ghanaBounds.west)) * 100}%`,
                  top: `${((ghanaBounds.north - selectedLocation.lat) / (ghanaBounds.north - ghanaBounds.south)) * 100}%`
                }}
              >
                <MapPin className="h-6 w-6 text-red-600 drop-shadow-lg" />
                <div className="absolute top-7 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                  Selected Location
                </div>
              </div>
            )}

            {/* Click instruction overlay */}
            {!selectedLocation && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-background/90 p-4 rounded-lg border text-center">
                  <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click anywhere on the map to select a location
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Selected Location Display */}
          {selectedLocation && (
            <div className="p-3 bg-muted rounded-lg">
              <Label className="text-sm font-medium">Selected Location:</Label>
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Latitude: {selectedLocation.lat.toFixed(6)}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Longitude: {selectedLocation.lng.toFixed(6)}
                  </Badge>
                </div>
                {selectedLocation.address && (
                  <p className="text-sm text-muted-foreground">
                    {selectedLocation.address}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Location access info */}
          {!('geolocation' in navigator) && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-700">
                Your browser doesn't support location services. Please select a location manually on the map.
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}