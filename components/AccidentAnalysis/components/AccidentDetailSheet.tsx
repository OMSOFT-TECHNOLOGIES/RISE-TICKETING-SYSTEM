import React from 'react';
import { Car, MapPin, User, Users } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../ui/sheet';
import { ScrollArea } from '../../ui/scroll-area';
import { Separator } from '../../ui/separator';
import type { Accident } from '../types';
import { formatAccidentDate, formatCurrency, formatSnakeLabel, getCauseLabel } from '../utils';
import { SeverityBadge } from './SeverityBadge';
import { StatusBadge } from './StatusBadge';

interface AccidentDetailSheetProps {
  accident: Accident | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function DetailField({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm mt-0.5">{value}</p>
    </div>
  );
}

export function AccidentDetailSheet({ accident, open, onOpenChange }: AccidentDetailSheetProps) {
  if (!accident) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col gap-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <span className="font-mono text-xs text-muted-foreground">{accident.id}</span>
          <SheetTitle className="text-left text-lg leading-snug">
            {accident.location ?? 'Unknown location'}
          </SheetTitle>
          <SheetDescription className="text-left">{accident.route ?? '—'}</SheetDescription>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <SeverityBadge severity={accident.severity} />
            <StatusBadge status={accident.status} />
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-5 space-y-6">
            <DetailSection title="Overview">
              <div className="grid grid-cols-2 gap-4">
                <DetailField label="Date & Time" value={formatAccidentDate(accident.date)} />
                <DetailField label="Trip ID" value={accident.tripId} />
                <DetailField label="Reported By" value={accident.reportedBy} />
                <DetailField label="Time of Day" value={formatSnakeLabel(accident.timeOfDay)} />
              </div>
            </DetailSection>

            <Separator />

            <DetailSection title="Vehicle & Driver">
              <div className="grid grid-cols-2 gap-4">
                <DetailField
                  label="Vehicle"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <Car className="h-3.5 w-3.5 text-muted-foreground" />
                      {accident.vehicleId}
                    </span>
                  }
                />
                <DetailField
                  label="Driver"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      {accident.driverName}
                    </span>
                  }
                />
                <DetailField
                  label="Passengers Aboard"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      {accident.passengersAboard}
                    </span>
                  }
                />
                <DetailField label="Station" value={accident.stationId} />
              </div>
            </DetailSection>

            <Separator />

            <DetailSection title="Casualties">
              <div className="grid grid-cols-2 gap-4">
                <DetailField label="Injuries" value={<span className="text-orange-600 font-medium">{accident.injuries}</span>} />
                <DetailField label="Fatalities" value={<span className="text-red-600 font-medium">{accident.fatalities}</span>} />
              </div>
            </DetailSection>

            <Separator />

            <DetailSection title="Conditions">
              <div className="grid grid-cols-2 gap-4">
                <DetailField label="Weather" value={formatSnakeLabel(accident.weatherConditions)} />
                <DetailField label="Road Conditions" value={formatSnakeLabel(accident.roadConditions)} />
                <DetailField label="Probable Cause" value={getCauseLabel(accident.cause)} />
              </div>
            </DetailSection>

            <Separator />

            <DetailSection title="Investigation">
              <div className="grid grid-cols-2 gap-4">
                <DetailField label="Insurance Claim" value={formatSnakeLabel(accident.insuranceClaim)} />
                <DetailField label="Estimated Cost" value={formatCurrency(accident.cost)} />
              </div>
            </DetailSection>

            <Separator />

            <DetailSection title="Description">
              <p className="text-sm text-muted-foreground leading-relaxed p-3 rounded-lg bg-muted/50 border">
                {accident.description?.trim() ? accident.description : 'No description provided.'}
              </p>
            </DetailSection>

            <div className="flex items-start gap-2 text-xs text-muted-foreground pb-2">
              <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{accident.location}</span>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
