import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  MapPin,
  RotateCcw,
  Video,
} from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { cn } from '../ui/utils';
import { MapLocationPicker } from '../MapLocationPicker';
import type { DeathTrapReport } from './types';
import {
  DEFAULT_MAP_CENTER,
  HAZARD_TYPE_OPTIONS,
  SEVERITY_OPTIONS,
} from './constants';

export interface HazardReportForm {
  type: DeathTrapReport['type'];
  location: string;
  description: string;
  severityLevel: DeathTrapReport['severityLevel'];
  affectedRoutes: string[];
  affectedNotes: string;
  estimatedRepairCost: number;
  coordinates: { lat: number; lng: number };
  locationAddress: string;
  reporterName?: string;
  reporterPhone?: string;
}

interface ReportHazardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: HazardReportForm;
  isLocationFromMap: boolean;
  priorityScore: number;
  onFormChange: (updates: Partial<HazardReportForm>) => void;
  onLocationSelect: (location: { lat: number; lng: number; address?: string }) => void;
  onResetLocation: () => void;
  onSubmit: (media: { photos: File[]; videos: File[] }) => void;
  onCancel: () => void;
  publicMode?: boolean;
  isSubmitting?: boolean;
}

const STEPS = [
  { id: 1, title: 'Hazard Details', description: 'Type, severity & description' },
  { id: 2, title: 'Location', description: 'Pin exact hazard on map' },
  { id: 3, title: 'Impact & media', description: 'Notes, photos & video (optional)' },
];

export function ReportHazardDialog({
  open,
  onOpenChange,
  form,
  isLocationFromMap,
  priorityScore,
  onFormChange,
  onLocationSelect,
  onResetLocation,
  onSubmit,
  onCancel,
  publicMode = false,
  isSubmitting = false,
}: ReportHazardDialogProps) {
  const [step, setStep] = useState(1);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setStep(1);
      setPhotoFiles([]);
      setVideoFiles([]);
    }
    onOpenChange(next);
  };

  const hasCoordinates = form.coordinates.lat !== 0 || form.coordinates.lng !== 0;
  const canProceedStep1 = !!form.type && !!form.severityLevel && !!form.description.trim();
  const canProceedStep2 = hasCoordinates && !!form.location.trim();

  const selectedType = HAZARD_TYPE_OPTIONS.find((t) => t.value === form.type);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-w-3xl flex-col gap-0 p-0 overflow-hidden rounded-2xl max-h-[min(90dvh,calc(100%-2rem))]">
        <DialogHeader className="border-b border-border/80 bg-gradient-to-br from-muted/50 to-background px-6 py-5 shrink-0">
          <div className="flex items-start gap-4 pr-6">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <AlertTriangle className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <div className="space-y-1 min-w-0">
              <DialogTitle className="text-xl font-semibold tracking-tight">
                Report road hazard
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                File a structured death trap report for triage, routing impact assessment, and repair
                coordination.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 border-b bg-muted/20 shrink-0">
          <div className="flex items-center justify-between">
            {STEPS.map((s, idx) => (
              <React.Fragment key={s.id}>
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium border-2 transition-colors',
                      step > s.id && 'bg-primary border-primary text-primary-foreground',
                      step === s.id && 'border-primary text-primary bg-primary/5',
                      step < s.id && 'border-muted-foreground/30 text-muted-foreground'
                    )}
                  >
                    {step > s.id ? <Check className="h-3.5 w-3.5" /> : s.id}
                  </div>
                  <div className="hidden sm:block min-w-0">
                    <p className={cn('text-xs font-medium truncate', step === s.id && 'text-primary')}>
                      {s.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{s.description}</p>
                  </div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={cn('flex-1 h-px mx-2', step > s.id ? 'bg-primary' : 'bg-border')} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <DialogBody className="min-h-0 flex-1 px-6 py-5 max-h-[min(52vh,480px)]">
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Hazard Type *
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {HAZARD_TYPE_OPTIONS.map(({ value, label, description, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => onFormChange({ type: value })}
                      className={cn(
                        'flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-all hover:border-primary/40',
                        form.type === value
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                          : 'border-border bg-background'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4',
                          form.type === value ? 'text-primary' : 'text-muted-foreground'
                        )}
                      />
                      <div>
                        <p className="text-xs font-medium leading-tight">{label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Severity Level *
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SEVERITY_OPTIONS.map(({ value, label, description, dot, ring, bg, text }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => onFormChange({ severityLevel: value })}
                      className={cn(
                        'rounded-lg border p-3 text-left transition-all',
                        form.severityLevel === value
                          ? cn(bg, ring, 'ring-1')
                          : 'border-border bg-background hover:border-muted-foreground/30'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn('h-2 w-2 rounded-full', dot)} />
                        <span className={cn('text-sm font-medium', form.severityLevel === value && text)}>
                          {label}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-snug">{description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hazard-description">Description *</Label>
                <Textarea
                  id="hazard-description"
                  rows={4}
                  placeholder="Describe the hazard, immediate danger to road users, and any visible damage or obstruction..."
                  value={form.description}
                  onChange={(e) => onFormChange({ description: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="hazard-location">Location Description *</Label>
                  {form.location && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={onResetLocation}
                      className="h-7 px-2 text-xs text-muted-foreground"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="hazard-location"
                    value={form.location}
                    onChange={(e) => onFormChange({ location: e.target.value })}
                    placeholder="Highway, landmark, or junction near the hazard"
                    className={cn(isLocationFromMap && 'border-emerald-300 bg-emerald-50/30')}
                  />
                  {isLocationFromMap && (
                    <MapPin className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
                  )}
                </div>
                {isLocationFromMap && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Auto-filled from map selection
                  </p>
                )}
              </div>

              <MapLocationPicker
                onLocationSelect={onLocationSelect}
                initialLocation={hasCoordinates ? form.coordinates : DEFAULT_MAP_CENTER}
                compactHeightClass="h-52 sm:h-72"
              />

              {hasCoordinates && (
                <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                  <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div className="text-sm min-w-0">
                    <p className="font-medium text-emerald-800">Location confirmed</p>
                    <p className="text-emerald-700/80 text-xs mt-0.5 font-mono">
                      {form.coordinates.lat.toFixed(6)}, {form.coordinates.lng.toFixed(6)}
                    </p>
                    {form.locationAddress && form.locationAddress !== form.location && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        Detected: {form.locationAddress}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-lg border bg-muted/30 px-4 py-3">
                <p className="text-xs font-medium text-foreground">Location tips</p>
                <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                  <li>Click the map to pin the exact hazard location</li>
                  <li>Use quick city buttons to jump to major areas</li>
                  <li>You can refine the description after selecting a pin</li>
                </ul>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Report Summary
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Hazard Type</p>
                    <p className="font-medium mt-0.5">{selectedType?.label}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Severity</p>
                    <p className="font-medium mt-0.5 capitalize">{form.severityLevel}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Location</p>
                    <p className="font-medium mt-0.5 line-clamp-2">{form.location}</p>
                  </div>
                </div>
              </div>

              {publicMode ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reporter-name">Your name (optional)</Label>
                    <Input
                      id="reporter-name"
                      value={form.reporterName ?? ''}
                      onChange={(e) => onFormChange({ reporterName: e.target.value })}
                      placeholder="Citizen reporter"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reporter-phone">Phone (optional)</Label>
                    <Input
                      id="reporter-phone"
                      value={form.reporterPhone ?? ''}
                      onChange={(e) => onFormChange({ reporterPhone: e.target.value })}
                      placeholder="For follow-up if needed"
                    />
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="affected-notes">Affected areas / notes</Label>
                <Textarea
                  id="affected-notes"
                  rows={5}
                  value={form.affectedNotes}
                  onChange={(e) => onFormChange({ affectedNotes: e.target.value })}
                  placeholder="Describe who or what is affected. You can write several sentences with spaces — e.g. school children, market traders, northbound lane closure..."
                />
              </div>

              <div className="space-y-3">
                <Label>Photos &amp; video (optional)</Label>
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) =>
                      setPhotoFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])])
                    }
                  />
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    multiple
                    className="hidden"
                    onChange={(e) =>
                      setVideoFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])])
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    <ImagePlus className="h-4 w-4 mr-2" />
                    Add photos
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Add video
                  </Button>
                </div>
                {(photoFiles.length > 0 || videoFiles.length > 0) && (
                  <p className="text-xs text-muted-foreground">
                    {photoFiles.length} photo(s), {videoFiles.length} video(s) selected
                  </p>
                )}
              </div>

              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Priority Score
                    </p>
                    <p className="text-2xl font-semibold tabular-nums mt-1">{priorityScore}/100</p>
                  </div>
                  <div className="h-12 w-12 rounded-full border-4 border-primary/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{priorityScore}</span>
                  </div>
                </div>
                <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${priorityScore}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Based on severity level and number of affected routes
                </p>
              </div>
            </div>
          )}
        </DialogBody>

        <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between bg-muted/20 shrink-0">
          <Button variant="ghost" onClick={step === 1 ? onCancel : () => setStep((s) => s - 1)}>
            {step === 1 ? (
              'Cancel'
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </>
            )}
          </Button>
          {step < 3 ? (
            <Button
              disabled={(step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2)}
              onClick={() => setStep((s) => s + 1)}
            >
              Continue <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              disabled={isSubmitting}
              onClick={() => onSubmit({ photos: photoFiles, videos: videoFiles })}
            >
              {isSubmitting ? 'Submitting…' : 'Submit report'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
