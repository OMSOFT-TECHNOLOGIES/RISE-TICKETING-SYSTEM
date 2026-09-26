import React, { useState } from 'react';
import { Check, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import { Switch } from '../../ui/switch';
import { MapLocationPicker } from '../../MapLocationPicker';
import { GHANA_REGIONS } from '../../constants/ghanaRegions';
import { cn } from '../../ui/utils';
import type { FleetVehicleOption, IncidentCoordinates, NewIncidentForm } from '../types';
import {
  DEFAULT_MAP_CENTER,
  INCIDENT_TYPE_OPTIONS,
  ROAD_OPTIONS,
  SEVERITY_OPTIONS,
  VEHICLE_MODE_OPTIONS,
  WEATHER_OPTIONS,
} from '../constants';
import { IncidentMediaUpload } from './IncidentMediaUpload';

interface NewIncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'create' | 'edit';
  incidentLabel?: string;
  form: NewIncidentForm;
  selectedLocation: IncidentCoordinates | null;
  fleetVehicles: FleetVehicleOption[];
  evidenceFiles: File[];
  onEvidenceChange: (files: File[]) => void;
  onFormChange: (updates: Partial<NewIncidentForm>) => void;
  onLocationSelect: (location: IncidentCoordinates) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const STEPS = [
  { id: 1, title: 'Incident Details', description: 'Type, region & description' },
  { id: 2, title: 'Location', description: 'Google Maps pin' },
  { id: 3, title: 'Vehicle & conditions', description: 'Fleet or other vehicle' },
  { id: 4, title: 'Evidence', description: 'Photos & videos' },
];

export function NewIncidentDialog({
  open,
  onOpenChange,
  mode = 'create',
  incidentLabel,
  form,
  selectedLocation,
  fleetVehicles,
  evidenceFiles,
  onEvidenceChange,
  onFormChange,
  onLocationSelect,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: NewIncidentDialogProps) {
  const [step, setStep] = useState(1);
  const isEdit = mode === 'edit';

  const handleOpenChange = (next: boolean) => {
    if (!next) setStep(1);
    onOpenChange(next);
  };

  const canProceedStep1 = form.title && form.description && form.type && form.severity && form.region;
  const canProceedStep2 = !!selectedLocation;

  const handleFleetVehicleSelect = (vehicleId: string) => {
    const vehicle = fleetVehicles.find((v) => v.id === vehicleId);
    onFormChange({
      registeredVehicleId: vehicleId,
      vehicleRegNumber: vehicle?.registrationNumber ?? '',
      driverName: vehicle?.driverName ?? '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-w-3xl flex-col gap-0 p-0 max-h-[min(90dvh,calc(100%-2rem))] overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>{isEdit ? 'Edit incident' : 'Report New Incident'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Update case details${incidentLabel ? ` for ${incidentLabel}` : ''}. Status and verification are managed separately in the case panel.`
              : 'Complete all steps to file an incident report for emergency coordination'}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 border-b bg-muted/20 shrink-0">
          <div className="flex items-center justify-between">
            {STEPS.map((s, idx) => (
              <React.Fragment key={s.id}>
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium border-2 transition-colors',
                      step > s.id && 'bg-[#193cb8] border-[#193cb8] text-white',
                      step === s.id && 'border-[#193cb8] text-[#193cb8] bg-[#193cb8]/5',
                      step < s.id && 'border-muted-foreground/30 text-muted-foreground'
                    )}
                  >
                    {step > s.id ? <Check className="h-3.5 w-3.5" /> : s.id}
                  </div>
                  <div className="hidden md:block min-w-0">
                    <p className={cn('text-xs font-medium truncate', step === s.id && 'text-[#193cb8]')}>
                      {s.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{s.description}</p>
                  </div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={cn('flex-1 h-px mx-2', step > s.id ? 'bg-[#193cb8]' : 'bg-border')} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="title">Incident Title *</Label>
                  <Input
                    id="title"
                    placeholder="Brief, descriptive title"
                    value={form.title}
                    onChange={(e) => onFormChange({ title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Region *</Label>
                  <Select value={form.region || undefined} onValueChange={(v) => onFormChange({ region: v })}>
                    <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                    <SelectContent>
                      {GHANA_REGIONS.map((region) => (
                        <SelectItem key={region} value={region}>{region}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type *</Label>
                  <Select value={form.type} onValueChange={(v) => onFormChange({ type: v })}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {INCIDENT_TYPE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Severity *</Label>
                  <Select value={form.severity} onValueChange={(v) => onFormChange({ severity: v })}>
                    <SelectTrigger><SelectValue placeholder="Select severity" /></SelectTrigger>
                    <SelectContent>
                      {SEVERITY_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label} — {o.description}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  rows={4}
                  placeholder="Detailed account of the incident, circumstances, and actions taken..."
                  value={form.description}
                  onChange={(e) => onFormChange({ description: e.target.value })}
                />
              </div>
              {isEdit ? (
                form.reportSource === 'public' ? (
                  <p className="text-xs text-muted-foreground rounded-lg border bg-muted/20 p-3">
                    This is a citizen / public report. Verification is handled in the case workflow panel.
                  </p>
                ) : null
              ) : (
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label>Citizen / public report</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Requires verification by MTTD, Fire, Road Safety, or Police before investigation.
                    </p>
                  </div>
                  <Switch
                    checked={form.reportSource === 'public'}
                    onCheckedChange={(checked) =>
                      onFormChange({ reportSource: checked ? 'public' : 'internal' })
                    }
                  />
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Pin the incident on <strong>Google Maps</strong> (live roadmap for Ghana). Search, use GPS, or click the map.
              </p>
              <div className="space-y-2">
                <Label htmlFor="location">Location Description</Label>
                <Input
                  id="location"
                  placeholder="Highway, landmark, or junction"
                  value={form.location}
                  onChange={(e) => onFormChange({ location: e.target.value })}
                />
              </div>
              <MapLocationPicker
                onLocationSelect={onLocationSelect}
                initialLocation={selectedLocation || DEFAULT_MAP_CENTER}
              />
              {selectedLocation && (
                <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:bg-emerald-950/20">
                  <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-emerald-800 dark:text-emerald-300">Location confirmed</p>
                    <p className="text-emerald-700/80 dark:text-emerald-400/80 text-xs mt-0.5">
                      {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Vehicle registration *</Label>
                <Select
                  value={form.vehicleMode}
                  onValueChange={(v: 'public' | 'other') =>
                    onFormChange({
                      vehicleMode: v,
                      registeredVehicleId: '',
                      vehicleRegNumber: '',
                      driverName: '',
                    })
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VEHICLE_MODE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.vehicleMode === 'public' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Registered vehicle *</Label>
                    <Select
                      value={form.registeredVehicleId || undefined}
                      onValueChange={handleFleetVehicleSelect}
                    >
                      <SelectTrigger><SelectValue placeholder="Select from RISE fleet" /></SelectTrigger>
                      <SelectContent>
                        {fleetVehicles.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.registrationNumber}
                            {v.driverName ? ` — ${v.driverName}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Linked to insurance claims — driver name fills automatically when available.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Registration</Label>
                    <Input value={form.vehicleRegNumber} readOnly className="bg-muted/50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Driver</Label>
                    <Input value={form.driverName} readOnly className="bg-muted/50" placeholder="From vehicle record" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Registration number *</Label>
                    <Input
                      placeholder="GT-1234-24"
                      value={form.vehicleRegNumber}
                      onChange={(e) => onFormChange({ vehicleRegNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Driver name</Label>
                    <Input
                      value={form.driverName}
                      onChange={(e) => onFormChange({ driverName: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                {(['passengersInvolved', 'injuriesReported', 'fatalitiesReported'] as const).map((key) => (
                  <div key={key} className="space-y-2">
                    <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form[key]}
                      onChange={(e) => onFormChange({ [key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Number</Label>
                  <Input
                    value={form.contactNumber}
                    onChange={(e) => onFormChange({ contactNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => onFormChange({ contactEmail: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Weather</Label>
                  <Select value={form.weatherConditions} onValueChange={(v) => onFormChange({ weatherConditions: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {WEATHER_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Road Conditions</Label>
                  <Select value={form.roadConditions} onValueChange={(v) => onFormChange({ roadConditions: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {ROAD_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <IncidentMediaUpload files={evidenceFiles} onChange={onEvidenceChange} />
              <p className="text-xs text-muted-foreground">
                {isEdit
                  ? 'New files are added to this case when you save. Existing media stays attached.'
                  : 'Media is uploaded after the report is saved. Supported: images and common video formats.'}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/10 shrink-0">
          <Button variant="ghost" onClick={step === 1 ? onCancel : () => setStep((s) => s - 1)}>
            {step === 1 ? (
              'Cancel'
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </>
            )}
          </Button>
          {step < 4 ? (
            <Button
              className="bg-[#193cb8] hover:bg-[#152f94]"
              disabled={(step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2)}
              onClick={() => setStep((s) => s + 1)}
            >
              Continue <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              className="bg-[#193cb8] hover:bg-[#152f94]"
              disabled={isSubmitting}
              onClick={onSubmit}
            >
              {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Submit Report'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
