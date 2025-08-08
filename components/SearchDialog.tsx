import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useAuth } from './AuthContext';
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
  ArrowRight
} from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery?: string;
}

// Mock search data
const mockSearchData = {
  trips: [
    {
      id: 'TRP001',
      route: 'Accra Central → Kumasi Main',
      departure: '2024-01-20T08:00:00',
      vehicle: 'GV-123-20',
      driver: 'Kwame Asante',
      passengers: 45,
      status: 'active'
    },
    {
      id: 'TRP002',
      route: 'Accra Central → Cape Coast',
      departure: '2024-01-20T10:30:00',
      vehicle: 'GV-456-21',
      driver: 'Ama Osei',
      passengers: 32,
      status: 'boarding'
    }
  ],
  passengers: [
    {
      id: 'PAS001',
      name: 'John Doe',
      phone: '+233 24 111 1111',
      email: 'john.doe@email.com',
      lastTrip: 'Accra → Kumasi',
      totalTrips: 12
    },
    {
      id: 'PAS002',
      name: 'Jane Smith',
      phone: '+233 26 222 2222',
      email: 'jane.smith@email.com',
      lastTrip: 'Kumasi → Accra',
      totalTrips: 8
    }
  ],
  vehicles: [
    {
      id: 'VEH001',
      registrationNumber: 'GV-123-20',
      make: 'Toyota',
      model: 'Hiace',
      capacity: 50,
      station: 'Accra Central',
      status: 'active'
    },
    {
      id: 'VEH002',
      registrationNumber: 'GV-456-21',
      make: 'Mercedes',
      model: 'Sprinter',
      capacity: 35,
      station: 'Accra Central',
      status: 'maintenance'
    }
  ],
  tickets: [
    {
      id: 'TKT001',
      ticketNumber: 'TKT001',
      passengerName: 'John Doe',
      route: 'Accra → Kumasi',
      date: '2024-01-20',
      status: 'confirmed'
    },
    {
      id: 'TKT002',
      ticketNumber: 'TKT002',
      passengerName: 'Jane Smith',
      route: 'Accra → Kumasi',
      date: '2024-01-20',
      status: 'used'
    }
  ]
};

export function SearchDialog({ open, onOpenChange, initialQuery = '' }: SearchDialogProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any>({});
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (query.length >= 2) {
      setIsSearching(true);
      // Simulate search delay
      const timer = setTimeout(() => {
        performSearch(query);
        setIsSearching(false);
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      setResults({});
    }
  }, [query]);

  const performSearch = (searchQuery: string) => {
    const lowercaseQuery = searchQuery.toLowerCase();
    
    const filteredResults = {
      trips: mockSearchData.trips.filter(trip => 
        trip.route.toLowerCase().includes(lowercaseQuery) ||
        trip.vehicle.toLowerCase().includes(lowercaseQuery) ||
        trip.driver.toLowerCase().includes(lowercaseQuery) ||
        trip.id.toLowerCase().includes(lowercaseQuery)
      ),
      passengers: mockSearchData.passengers.filter(passenger =>
        passenger.name.toLowerCase().includes(lowercaseQuery) ||
        passenger.phone.includes(searchQuery) ||
        passenger.email.toLowerCase().includes(lowercaseQuery)
      ),
      vehicles: mockSearchData.vehicles.filter(vehicle =>
        vehicle.registrationNumber.toLowerCase().includes(lowercaseQuery) ||
        vehicle.make.toLowerCase().includes(lowercaseQuery) ||
        vehicle.model.toLowerCase().includes(lowercaseQuery) ||
        vehicle.station.toLowerCase().includes(lowercaseQuery)
      ),
      tickets: mockSearchData.tickets.filter(ticket =>
        ticket.ticketNumber.toLowerCase().includes(lowercaseQuery) ||
        ticket.passengerName.toLowerCase().includes(lowercaseQuery) ||
        ticket.route.toLowerCase().includes(lowercaseQuery)
      )
    };

    setResults(filteredResults);
  };

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

  const handleResultClick = (type: string, item: any) => {
    console.log(`Navigate to ${type}:`, item);
    onOpenChange(false);
    // Here you would implement navigation to the specific item
  };

  const ResultSection = ({ title, icon: Icon, items, type }: any) => {
    if (!items || items.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Icon className="h-4 w-4" />
          {title} ({items.length})
        </div>
        <div className="space-y-1">
          {items.map((item: any) => (
            <button
              key={item.id}
              onClick={() => handleResultClick(type, item)}
              className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors"
            >
              {type === 'trips' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{item.route}</p>
                    {getStatusBadge(item.status, 'trip')}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(item.departure).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(item.departure).toLocaleTimeString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bus className="h-3 w-3" />
                      {item.vehicle}
                    </span>
                  </div>
                </div>
              )}

              {type === 'passengers' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{item.name}</p>
                    <Badge variant="outline">{item.totalTrips} trips</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {item.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {item.email}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Last trip: {item.lastTrip}</p>
                </div>
              )}

              {type === 'vehicles' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{item.registrationNumber}</p>
                    {getStatusBadge(item.status, 'vehicle')}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{item.make} {item.model}</span>
                    <span>Capacity: {item.capacity}</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {item.station}
                    </span>
                  </div>
                </div>
              )}

              {type === 'tickets' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{item.ticketNumber}</p>
                    {getStatusBadge(item.status, 'ticket')}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{item.passengerName}</span>
                    <span>{item.route}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {item.date}
                    </span>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const totalResults = Object.values(results).reduce((total: number, items: any) => total + (items?.length || 0), 0);

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
                      Found {totalResults} result{totalResults !== 1 ? 's' : ''} for "{query}"
                    </p>
                  </div>

                  <ResultSection
                    title="Trips"
                    icon={Route}
                    items={results.trips}
                    type="trips"
                  />

                  {results.trips?.length > 0 && results.passengers?.length > 0 && <Separator />}

                  <ResultSection
                    title="Passengers"
                    icon={Users}
                    items={results.passengers}
                    type="passengers"
                  />

                  {(results.trips?.length > 0 || results.passengers?.length > 0) && results.vehicles?.length > 0 && <Separator />}

                  <ResultSection
                    title="Vehicles"
                    icon={Bus}
                    items={results.vehicles}
                    type="vehicles"
                  />

                  {(results.trips?.length > 0 || results.passengers?.length > 0 || results.vehicles?.length > 0) && results.tickets?.length > 0 && <Separator />}

                  <ResultSection
                    title="Tickets"
                    icon={Ticket}
                    items={results.tickets}
                    type="tickets"
                  />
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

          {query.length < 2 && (
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