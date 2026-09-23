import React, { useState, useEffect, useCallback } from 'react';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from './ui/dialog';
import {
  Search,
  Route,
  Users,
  Bus,
  Ticket,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Clock,
} from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { searchApi } from './utils/api';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery?: string;
}

interface SearchResults {
  trips?: Record<string, unknown>[];
  passengers?: Record<string, unknown>[];
  vehicles?: Record<string, unknown>[];
  tickets?: Record<string, unknown>[];
}

function normalizeSearchResults(data: unknown): SearchResults {
  if (!data || typeof data !== 'object') return {};

  const record = data as Record<string, unknown>;
  const nested = record.results && typeof record.results === 'object'
    ? (record.results as Record<string, unknown>)
    : record;

  return {
    trips: Array.isArray(nested.trips) ? nested.trips as Record<string, unknown>[] : [],
    passengers: Array.isArray(nested.passengers) ? nested.passengers as Record<string, unknown>[] : [],
    vehicles: Array.isArray(nested.vehicles) ? nested.vehicles as Record<string, unknown>[] : [],
    tickets: Array.isArray(nested.tickets) ? nested.tickets as Record<string, unknown>[] : [],
  };
}

export function SearchDialog({ open, onOpenChange, initialQuery = '' }: SearchDialogProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResults>({});
  const [isSearching, setIsSearching] = useState(false);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults({});
      return;
    }

    setIsSearching(true);
    try {
      const response = await searchApi.search(searchQuery);
      if (response.success && response.data) {
        setResults(normalizeSearchResults(response.data));
      } else {
        setResults({});
      }
    } catch (err) {
      console.error('Search error:', err);
      setResults({});
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setQuery(initialQuery);
      if (initialQuery.length >= 2) {
        void performSearch(initialQuery);
      } else {
        setResults({});
      }
    }
  }, [open, initialQuery, performSearch]);

  useEffect(() => {
    if (!open || query.length < 2) {
      if (query.length < 2) setResults({});
      return;
    }

    const timer = setTimeout(() => {
      void performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, open, performSearch]);

  const getStatusBadge = (status: string, type: 'trip' | 'vehicle' | 'ticket') => {
    const colors = {
      trip: {
        active: 'bg-green-100 text-green-700',
        boarding: 'bg-blue-100 text-blue-700',
        completed: 'bg-gray-100 text-gray-700',
        cancelled: 'bg-red-100 text-red-700'
      },
      vehicle: {
        active: 'bg-green-100 text-green-700',
        maintenance: 'bg-yellow-100 text-yellow-700',
        inactive: 'bg-gray-100 text-gray-700'
      },
      ticket: {
        confirmed: 'bg-green-100 text-green-700',
        pending: 'bg-yellow-100 text-yellow-700',
        used: 'bg-gray-100 text-gray-700',
        cancelled: 'bg-red-100 text-red-700'
      }
    };

    const colorClass = colors[type][status as keyof typeof colors[typeof type]] || 'bg-gray-100 text-gray-700';

    return (
      <Badge className={colorClass}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleResultClick = (type: string, item: Record<string, unknown>) => {
    console.log(`Navigate to ${type}:`, item);
    onOpenChange(false);
  };

  const ResultSection = ({
    title,
    icon: Icon,
    items,
    type,
  }: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    items?: Record<string, unknown>[];
    type: 'trips' | 'passengers' | 'vehicles' | 'tickets';
  }) => {
    if (!items || items.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Icon className="h-4 w-4" />
          {title} ({items.length})
        </div>
        <div className="space-y-1">
          {items.map((item, index) => (
            <button
              key={String(item.id ?? index)}
              onClick={() => handleResultClick(type, item)}
              className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors"
            >
              {type === 'trips' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{String(item.route ?? 'Unknown route')}</p>
                    {item.status && getStatusBadge(String(item.status), 'trip')}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {item.departure && (
                      <>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(String(item.departure)).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(String(item.departure)).toLocaleTimeString()}
                        </span>
                      </>
                    )}
                    {item.vehicle && (
                      <span className="flex items-center gap-1">
                        <Bus className="h-3 w-3" />
                        {String(item.vehicle)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {type === 'passengers' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{String(item.name ?? 'Unknown')}</p>
                    {item.totalTrips != null && (
                      <Badge variant="outline">{String(item.totalTrips)} trips</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {item.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {String(item.phone)}
                      </span>
                    )}
                    {item.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {String(item.email)}
                      </span>
                    )}
                  </div>
                  {item.lastTrip && (
                    <p className="text-sm text-muted-foreground">Last trip: {String(item.lastTrip)}</p>
                  )}
                </div>
              )}

              {type === 'vehicles' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{String(item.registrationNumber ?? item.id ?? 'Unknown')}</p>
                    {item.status && getStatusBadge(String(item.status), 'vehicle')}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {(item.make || item.model) && (
                      <span>{String(item.make ?? '')} {String(item.model ?? '')}</span>
                    )}
                    {item.capacity != null && <span>Capacity: {String(item.capacity)}</span>}
                    {item.station && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {String(item.station ?? item.stationName ?? '')}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {type === 'tickets' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{String(item.ticketNumber ?? item.id ?? 'Unknown')}</p>
                    {item.status && getStatusBadge(String(item.status), 'ticket')}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {item.passengerName && <span>{String(item.passengerName)}</span>}
                    {item.route && <span>{String(item.route)}</span>}
                    {item.date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {String(item.date)}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const totalResults =
    (results.trips?.length ?? 0) +
    (results.passengers?.length ?? 0) +
    (results.vehicles?.length ?? 0) +
    (results.tickets?.length ?? 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search RISE System
          </DialogTitle>
          <DialogDescription>
            Search for trips, passengers, vehicles, and tickets across the system
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search for anything..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {isSearching && (
            <div className="text-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Searching...</p>
            </div>
          )}

          {query.length >= 2 && !isSearching && (
            <ScrollArea className="max-h-[400px]">
              {totalResults > 0 ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Found {totalResults} result{totalResults !== 1 ? 's' : ''} for &quot;{query}&quot;
                    </p>
                  </div>

                  <ResultSection title="Trips" icon={Route} items={results.trips} type="trips" />

                  {(results.trips?.length ?? 0) > 0 && (results.passengers?.length ?? 0) > 0 && <Separator />}

                  <ResultSection title="Passengers" icon={Users} items={results.passengers} type="passengers" />

                  {((results.trips?.length ?? 0) > 0 || (results.passengers?.length ?? 0) > 0) &&
                    (results.vehicles?.length ?? 0) > 0 && <Separator />}

                  <ResultSection title="Vehicles" icon={Bus} items={results.vehicles} type="vehicles" />

                  {((results.trips?.length ?? 0) > 0 ||
                    (results.passengers?.length ?? 0) > 0 ||
                    (results.vehicles?.length ?? 0) > 0) &&
                    (results.tickets?.length ?? 0) > 0 && <Separator />}

                  <ResultSection title="Tickets" icon={Ticket} items={results.tickets} type="tickets" />
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="font-medium">No results found</p>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search terms or browse the system manually
                  </p>
                </div>
              )}
            </ScrollArea>
          )}

          {query.length < 2 && !isSearching && (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="font-medium">Start typing to search</p>
              <p className="text-sm text-muted-foreground">
                Search for trips, passengers, vehicles, tickets, and more
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
