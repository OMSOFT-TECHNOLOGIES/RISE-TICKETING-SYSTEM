import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { RisePreloader } from './shared/feedback';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { appEnv } from './utils/env';
import { formatTripDepartureDisplay } from './utils/tripDateTime';

interface PoliceCheckPageProps {
  token: string;
  highlightPassengerId?: string;
}

type ManifestPassenger = {
  id?: string;
  passengerId?: string;
  name?: string;
  seatNumber?: string;
  seats?: number;
};

export function PoliceCheckPage({ token, highlightPassengerId }: PoliceCheckPageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const base = appEnv.apiBaseUrl.replace(/\/$/, '');
        const res = await fetch(
          `${base}/api/public/police-check/${encodeURIComponent(token)}`
        );
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json.success) {
          setError(json.message || json.error || 'This QR code is invalid or expired.');
          setData(null);
          return;
        }
        setData(json.data as Record<string, unknown>);
      } catch {
        if (!cancelled) setError('Unable to verify manifest.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const passengers = useMemo(() => {
    if (!data?.passengers || !Array.isArray(data.passengers)) return [];
    return data.passengers as ManifestPassenger[];
  }, [data]);

  if (loading) {
    return (
      <RisePreloader variant="fullscreen" label="Verifying passenger manifest…" showBrand />
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Verification failed</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{error}</CardContent>
        </Card>
      </div>
    );
  }

  const tripForDisplay = {
    departureTime: data.departureTime,
    route: data.route,
  };

  return (
    <div className="min-h-screen bg-muted/30 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-primary" />
              RISE Police Receipt Check
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Official passenger manifest · QR valid until{' '}
              {data.expiresAt
                ? new Date(String(data.expiresAt)).toLocaleString('en-GH')
                : 'expiry'}
            </p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Trip</p>
              <p className="font-medium">{String(data.tripId ?? '—')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Route</p>
              <p className="font-medium">{String(data.route ?? '—')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Departure</p>
              <p className="font-medium">{formatTripDepartureDisplay(tripForDisplay)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Station</p>
              <p className="font-medium">{String(data.stationName ?? '—')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Vehicle</p>
              <p className="font-medium">{String(data.vehicle ?? '—')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Driver</p>
              <p className="font-medium">{String(data.driver ?? '—')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Passengers ({passengers.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {passengers.map((p, index) => {
              const pid = String(p.id ?? p.passengerId ?? '');
              const highlighted =
                highlightPassengerId &&
                (pid === highlightPassengerId ||
                  decodeURIComponent(highlightPassengerId) === pid);
              return (
                <div
                  key={pid || index}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 ${highlighted ? 'border-primary bg-primary/5' : 'bg-background'}`}
                >
                  <div>
                    <p className="font-medium">{p.name ?? 'Passenger'}</p>
                    <p className="text-xs text-muted-foreground">
                      Seat {p.seatNumber ?? '—'}
                      {p.seats && Number(p.seats) > 1 ? ` · ${p.seats} seats` : ''}
                    </p>
                  </div>
                  {highlighted ? (
                    <Badge variant="default">Scanned passenger</Badge>
                  ) : (
                    <Badge variant="secondary">On manifest</Badge>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
