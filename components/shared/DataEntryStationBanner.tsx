import React from 'react';
import { Building2, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { StationOption } from './hooks/useDataEntryStation';

type Props = {
  stationId: string;
  onStationIdChange: (id: string) => void;
  stations: StationOption[];
  loading?: boolean;
  loadError?: string | null;
  onRetry?: () => void;
  description?: string;
};

export function DataEntryStationBanner({
  stationId,
  onStationIdChange,
  stations,
  loading = false,
  loadError = null,
  onRetry,
  description = 'Select the station you are entering data for. Lists and new records will apply to this station.',
}: Props) {
  return (
    <Card className="border-[#193cb8]/30 bg-[#193cb8]/5">
      <CardContent className="pt-4 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#193cb8]">
              <Building2 className="h-4 w-4" />
              Station context
            </div>
            <p className="text-sm text-muted-foreground max-w-xl">{description}</p>
            {loadError && (
              <p className="text-sm text-destructive">
                {loadError}
                {onRetry && (
                  <button
                    type="button"
                    className="ml-2 underline font-medium"
                    onClick={() => onRetry()}
                  >
                    Retry
                  </button>
                )}
              </p>
            )}
          </div>
          <div className="w-full sm:w-72 space-y-1.5">
            <Label htmlFor="data-entry-station" className="text-xs font-medium">
              Station <span className="text-destructive">*</span>
            </Label>
            <Select
              value={stationId || undefined}
              onValueChange={onStationIdChange}
              disabled={loading}
            >
              <SelectTrigger id="data-entry-station" className="bg-background">
                <SelectValue placeholder={loading ? 'Loading stations…' : 'Select station'} />
              </SelectTrigger>
              <SelectContent>
                {stations.length === 0 ? (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading…
                      </span>
                    ) : (
                      'No active stations found'
                    )}
                  </div>
                ) : (
                  stations.map((station) => (
                    <SelectItem key={station.id} value={station.id}>
                      <span>{station.name}</span>
                      {(station.city || station.region) && (
                        <span className="text-muted-foreground text-xs ml-1">
                          — {[station.city, station.region].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
