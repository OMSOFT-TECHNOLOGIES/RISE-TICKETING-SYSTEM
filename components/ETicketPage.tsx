import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Loader2, MapPin, QrCode, Ticket, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ticketApi } from './utils/api';
import type { ETicket } from './utils/eTicket.types';

interface ETicketPageProps {
  token: string;
}

export function ETicketPage({ token }: ETicketPageProps) {
  const [ticket, setTicket] = useState<ETicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTicket() {
      setLoading(true);
      setError(null);
      const response = await ticketApi.getByToken(token);

      if (cancelled) return;

      if (response.success && response.data) {
        setTicket(response.data as ETicket);
      } else {
        setError(response.error ?? 'Ticket not found');
      }
      setLoading(false);
    }

    loadTicket();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-[#193cb8]" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">Ticket Not Found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>{error ?? 'This e-ticket link is invalid or has expired.'}</p>
            <p>Contact the station where you booked your trip for assistance.</p>
            <Button variant="outline" className="w-full" onClick={() => (window.location.href = '/')}>
              Go to RISE Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const departureDate = new Date(ticket.departureTime);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#193cb8]/5 to-background p-4 sm:p-8">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 text-[#193cb8] font-semibold">
            <Ticket className="h-5 w-5" />
            RISE E-Ticket
          </div>
          <p className="text-sm text-muted-foreground">{ticket.stationName}</p>
        </div>

        <Card className="border-[#193cb8]/20 shadow-lg">
          <CardHeader className="pb-3 border-b bg-[#193cb8]/5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{ticket.id}</CardTitle>
              <Badge className="bg-green-100 text-green-800 capitalize">{ticket.status}</Badge>
            </div>
            <p className="text-sm font-medium">
              {ticket.routeFrom} → {ticket.routeTo}
            </p>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="font-medium">{ticket.passengerName}</p>
                <p className="text-sm text-muted-foreground">{ticket.passengerPhone}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{departureDate.toLocaleDateString('en-GH')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {departureDate.toLocaleTimeString('en-GH', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>Seat {ticket.seatNumber}</span>
              </div>
              <div className="font-semibold text-[#193cb8]">₵{ticket.fare.toFixed(2)}</div>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4 text-center">
              <QrCode className="h-16 w-16 mx-auto mb-2 text-[#193cb8]/60" />
              <p className="text-xs font-mono text-muted-foreground">{ticket.qrCode}</p>
              <p className="text-xs text-muted-foreground mt-2">Show this code at boarding</p>
            </div>

            {(ticket.vehicle !== 'TBD' || ticket.driver !== 'TBD') && (
              <div className="text-sm space-y-1 text-muted-foreground">
                {ticket.vehicle !== 'TBD' && <p>Vehicle: {ticket.vehicle}</p>}
                {ticket.driver !== 'TBD' && <p>Driver: {ticket.driver}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Booked {new Date(ticket.bookingDate).toLocaleString('en-GH')}
        </p>
      </div>
    </div>
  );
}
