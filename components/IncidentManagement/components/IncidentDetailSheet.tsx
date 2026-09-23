import React from 'react';
import {
  Car,
  Clock,
  MapPin,
  Phone,
  Shield,
  User,
  Users,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../ui/sheet';
import { Separator } from '../../ui/separator';
import { ScrollArea } from '../../ui/scroll-area';
import { Badge } from '../../ui/badge';
import type { Incident } from '../types';
import { formatIncidentDate, formatTypeLabel } from '../utils';
import { GhanaMapCanvas } from './GhanaMapCanvas';
import { SeverityIndicator } from './SeverityIndicator';
import { StatusBadge } from './StatusBadge';

interface IncidentDetailSheetProps {
  incident: Incident | null;
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

export function IncidentDetailSheet({ incident, open, onOpenChange }: IncidentDetailSheetProps) {
  if (!incident) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col gap-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center gap-2 pr-8">
            <span className="font-mono text-xs text-muted-foreground">{incident.id}</span>
          </div>
          <SheetTitle className="text-left text-lg leading-snug">{incident.title}</SheetTitle>
          <SheetDescription className="text-left line-clamp-2">{incident.description}</SheetDescription>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <StatusBadge status={incident.status} />
            <SeverityIndicator severity={incident.severity} />
            <Badge variant="outline" className="font-normal">{formatTypeLabel(incident.type)}</Badge>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-5 space-y-6">
            <DetailSection title="Overview">
              <div className="grid grid-cols-2 gap-4">
                <DetailField label="Region" value={`${incident.region}, ${incident.district}`} />
                <DetailField label="Reported" value={formatIncidentDate(incident.reportedAt)} />
                <DetailField label="Reporter" value={incident.reportedBy} />
                <DetailField label="Last Updated" value={formatIncidentDate(incident.updatedAt)} />
              </div>
            </DetailSection>

            <Separator />

            <DetailSection title="Location">
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <span>{incident.location}</span>
              </div>
              {incident.coordinates && (
                <div className="rounded-lg overflow-hidden border mt-2">
                  <GhanaMapCanvas
                    singleMarker={{
                      lat: incident.coordinates.lat,
                      lng: incident.coordinates.lng,
                      severity: incident.severity,
                    }}
                    height="180px"
                    showLegend={false}
                    variant="dark"
                  />
                </div>
              )}
            </DetailSection>

            {(incident.vehicleRegNumber || incident.driverName) && (
              <>
                <Separator />
                <DetailSection title="Vehicle & Personnel">
                  <div className="rounded-lg border p-4 space-y-3 bg-muted/20">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      Transport details
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <DetailField label="Registration" value={
                        <span className="font-mono">{incident.vehicleRegNumber}</span>
                      } />
                      <DetailField label="Driver" value={incident.driverName} />
                      <DetailField label="Passengers" value={incident.passengersInvolved} />
                    </div>
                  </div>
                </DetailSection>
              </>
            )}

            <Separator />

            <DetailSection title="Impact">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Injuries', value: incident.injuriesReported ?? 0, color: 'text-orange-600' },
                  { label: 'Fatalities', value: incident.fatalitiesReported ?? 0, color: 'text-red-600' },
                  {
                    label: 'Est. Damage',
                    value: incident.estimatedDamage ? `₵${incident.estimatedDamage.toLocaleString()}` : '—',
                    color: 'text-[#193cb8]',
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border p-3 text-center bg-muted/20">
                    <p className={`text-xl font-semibold tabular-nums ${item.color}`}>{item.value}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wide">{item.label}</p>
                  </div>
                ))}
              </div>
            </DetailSection>

            <Separator />

            <DetailSection title="Conditions">
              <div className="grid grid-cols-2 gap-4">
                <DetailField label="Weather" value={incident.weatherConditions} />
                <DetailField label="Road" value={incident.roadConditions} />
                <DetailField label="Time of Day" value={incident.timeOfDay} />
              </div>
            </DetailSection>

            <Separator />

            <DetailSection title="Response">
              <div className="space-y-4">
                <DetailField label="Assigned To" value={incident.assignedTo} />
                <DetailField label="Police Report" value={incident.policeReportNumber} />
                {incident.emergencyServices && incident.emergencyServices.length > 0 && (
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-2">
                      Emergency Services
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {incident.emergencyServices.map((s) => (
                        <Badge key={s} variant="secondary" className="font-normal">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {incident.witnesses && incident.witnesses.length > 0 && (
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Users className="h-3 w-3" /> Witnesses
                    </p>
                    <ul className="text-sm space-y-1">
                      {incident.witnesses.map((w) => (
                        <li key={w} className="text-muted-foreground">· {w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </DetailSection>

            {(incident.contactNumber || incident.contactEmail) && (
              <>
                <Separator />
                <DetailSection title="Contact">
                  <div className="space-y-2">
                    {incident.contactNumber && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono">{incident.contactNumber}</span>
                      </div>
                    )}
                    {incident.contactEmail && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {incident.contactEmail}
                      </div>
                    )}
                  </div>
                </DetailSection>
              </>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground pb-4">
              <Clock className="h-3.5 w-3.5" />
              <span>Case opened {formatIncidentDate(incident.reportedAt)}</span>
              <Shield className="h-3.5 w-3.5 ml-2" />
              <span>Priority: {incident.priority}</span>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
