import React from 'react';
import { Building2 } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { StationSearchSelect } from './StationSearchSelect';
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
          <div className="w-full sm:w-80">
            <StationSearchSelect
              id="data-entry-station"
              stations={stations}
              value={stationId}
              onValueChange={onStationIdChange}
              loading={loading}
              emptyMessage={
                loading ? 'Loading stations…' : 'No active stations in your assignment area.'
              }
              placeholder={loading ? 'Loading stations…' : 'Search and select station…'}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
