import React from 'react';
import { Check, ChevronsUpDown, FilePlus2, Loader2 } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command';
import { cn } from '../ui/utils';
import type { InjuryTierKey } from '../utils/claimCompensation';

type IncidentOption = {
  id: string;
  location: string;
};

type ManifestPassenger = {
  passengerId: string;
  name: string;
  phone: string;
  seatNumber?: string;
};

type CompensationInfo = Record<
  InjuryTierKey,
  { minAmount: number; maxAmount: number; description: string }
>;

export type SubmitClaimFormState = {
  incidentId: string;
  claimantName: string;
  claimantPhone: string;
  claimantId: string;
  injuryType: InjuryTierKey;
  compensationAmount: string;
  description: string;
  hospitalName: string;
  hospitalBankName: string;
  hospitalAccountName: string;
  hospitalAccountNumber: string;
};

type FilePickerProps = {
  id: string;
  label: string;
  hint: string;
  files: File[];
  onChange: (files: File[]) => void;
  accept: string;
};

function FilePicker({ id, label, hint, files, onChange, accept }: FilePickerProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="file"
        multiple
        accept={accept}
        onChange={(e) => onChange(Array.from(e.target.files ?? []))}
        className="bg-background/80"
      />
      <p className="text-xs text-muted-foreground">{hint}</p>
      {files.length > 0 ? (
        <p className="text-xs font-medium">{files.length} file(s) selected</p>
      ) : null}
    </div>
  );
}

type SubmitClaimDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: SubmitClaimFormState;
  onFormChange: (patch: Partial<SubmitClaimFormState>) => void;
  claimEligibleIncidents: IncidentOption[];
  selectedIncident?: IncidentOption;
  openIncidentCombobox: boolean;
  onOpenIncidentComboboxChange: (open: boolean) => void;
  onIncidentSelect: (incidentId: string) => void;
  claimantMode: 'manual_entry' | 'passenger_manifest';
  manifestPassengers: ManifestPassenger[];
  selectedPassengerId: string;
  onPassengerSelect: (passengerId: string) => void;
  isHospitalClaimer: boolean;
  injuryCompensation: CompensationInfo;
  compensationRange: CompensationInfo[InjuryTierKey];
  onInjuryTypeChange: (injuryType: InjuryTierKey) => void;
  evidenceFiles: File[];
  medicalReceiptFiles: File[];
  medicalReportFiles: File[];
  onEvidenceChange: (files: File[]) => void;
  onMedicalReceiptChange: (files: File[]) => void;
  onMedicalReportChange: (files: File[]) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
};

export function SubmitClaimDialog({
  open,
  onOpenChange,
  formData,
  onFormChange,
  claimEligibleIncidents,
  selectedIncident,
  openIncidentCombobox,
  onOpenIncidentComboboxChange,
  onIncidentSelect,
  claimantMode,
  manifestPassengers,
  selectedPassengerId,
  onPassengerSelect,
  isHospitalClaimer,
  injuryCompensation,
  compensationRange,
  onInjuryTypeChange,
  evidenceFiles,
  medicalReceiptFiles,
  medicalReportFiles,
  onEvidenceChange,
  onMedicalReceiptChange,
  onMedicalReportChange,
  onSubmit,
  isSubmitting,
}: SubmitClaimDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden rounded-2xl max-h-[min(90dvh,calc(100%-2rem))] flex flex-col">
        <DialogHeader className="border-b border-border/80 bg-gradient-to-br from-muted/50 to-background px-6 py-5 shrink-0">
          <div className="flex items-start gap-4 pr-6">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <FilePlus2 className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <div className="space-y-1 min-w-0">
              <DialogTitle className="text-xl font-semibold tracking-tight">Submit claim</DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                Link the claim to an investigator-confirmed incident, attach medical evidence, and
                provide hospital payment details for RIMA Accounts.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody className="px-6 py-5 space-y-6 max-h-[min(58vh,520px)]">
          <section className="space-y-4">
            <h3 className="text-sm font-semibold tracking-tight">Incident &amp; claimant</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="incidentId">Incident *</Label>
                <Popover modal open={openIncidentCombobox} onOpenChange={onOpenIncidentComboboxChange}>
                  <PopoverTrigger asChild>
                    <Button
                      id="incidentId"
                      variant="outline"
                      role="combobox"
                      aria-expanded={openIncidentCombobox}
                      className="w-full justify-between font-normal bg-background/80"
                    >
                      {selectedIncident ? (
                        <span className="truncate">
                          {selectedIncident.id} — {selectedIncident.location}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Search incident ID or location…</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search by incident ID or location…" />
                      <CommandList>
                        <CommandEmpty>No incident found.</CommandEmpty>
                        <CommandGroup>
                          {claimEligibleIncidents.length === 0 ? (
                            <div className="p-3 text-xs text-muted-foreground">
                              No investigator-confirmed incidents yet. Check the audit table for pending
                              cases.
                            </div>
                          ) : null}
                          {claimEligibleIncidents.map((incident) => (
                            <CommandItem
                              key={incident.id}
                              value={`${incident.id} ${incident.location}`}
                              onSelect={() => onIncidentSelect(incident.id)}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4 shrink-0',
                                  formData.incidentId === incident.id ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              <span className="font-medium">{incident.id}</span>
                              <span className="text-muted-foreground truncate">
                                {' '}
                                — {incident.location}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="claimantName">Claimant name *</Label>
                {claimantMode === 'passenger_manifest' && manifestPassengers.length > 0 ? (
                  <Select value={selectedPassengerId} onValueChange={onPassengerSelect}>
                    <SelectTrigger id="claimantName" className="bg-background/80">
                      <SelectValue placeholder="Select passenger on board" />
                    </SelectTrigger>
                    <SelectContent>
                      {manifestPassengers.map((p) => (
                        <SelectItem key={p.passengerId} value={p.passengerId}>
                          {p.name}
                          {p.seatNumber ? ` (seat ${p.seatNumber})` : ''} — {p.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="claimantName"
                    value={formData.claimantName}
                    onChange={(e) => onFormChange({ claimantName: e.target.value })}
                    placeholder="Full name"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="claimantPhone">Phone *</Label>
                <Input
                  id="claimantPhone"
                  value={formData.claimantPhone}
                  onChange={(e) => onFormChange({ claimantPhone: e.target.value })}
                  placeholder="+233244123456"
                  readOnly={claimantMode === 'passenger_manifest' && Boolean(selectedPassengerId)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="claimantId">ID number</Label>
                <Input
                  id="claimantId"
                  value={formData.claimantId}
                  onChange={(e) => onFormChange({ claimantId: e.target.value })}
                  placeholder="Ghana Card, passport, etc."
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
            <h3 className="text-sm font-semibold tracking-tight">Hospital &amp; payment account</h3>
            <div className="space-y-2">
              <Label htmlFor="hospitalName">Hospital name{isHospitalClaimer ? ' *' : ''}</Label>
              <Input
                id="hospitalName"
                value={formData.hospitalName}
                onChange={(e) => onFormChange({ hospitalName: e.target.value })}
                placeholder="e.g. Korle Bu Teaching Hospital"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="hospitalBankName">Bank name *</Label>
                <Input
                  id="hospitalBankName"
                  value={formData.hospitalBankName}
                  onChange={(e) => onFormChange({ hospitalBankName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hospitalAccountName">Account name *</Label>
                <Input
                  id="hospitalAccountName"
                  value={formData.hospitalAccountName}
                  onChange={(e) => onFormChange({ hospitalAccountName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hospitalAccountNumber">Account number *</Label>
                <Input
                  id="hospitalAccountNumber"
                  value={formData.hospitalAccountNumber}
                  onChange={(e) => onFormChange({ hospitalAccountNumber: e.target.value })}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold tracking-tight">Injury &amp; compensation</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="injuryType">Injury type</Label>
                <Select
                  value={formData.injuryType}
                  onValueChange={(value: InjuryTierKey) => onInjuryTypeChange(value)}
                >
                  <SelectTrigger className="bg-background/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(injuryCompensation) as InjuryTierKey[]).map((type) => {
                      const info = injuryCompensation[type];
                      return (
                        <SelectItem key={type} value={type}>
                          <span className="capitalize font-medium">{type}</span>
                          <span className="text-muted-foreground text-xs ml-1">
                            GH₵{info.minAmount}–{info.maxAmount}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{compensationRange.description}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="compensationAmount">Amount (GH₵)</Label>
                <Input
                  id="compensationAmount"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={compensationRange.minAmount}
                  max={compensationRange.maxAmount}
                  value={formData.compensationAmount}
                  onChange={(e) => onFormChange({ compensationAmount: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description of injuries</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => onFormChange({ description: e.target.value })}
                rows={3}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold tracking-tight">Supporting documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FilePicker
                id="evidence"
                label="Photos / videos *"
                hint="Images or video for decision making"
                files={evidenceFiles}
                onChange={onEvidenceChange}
                accept="image/*,video/*"
              />
              <FilePicker
                id="receipts"
                label="Medical receipts *"
                hint="Care receipts (PDF or image)"
                files={medicalReceiptFiles}
                onChange={onMedicalReceiptChange}
                accept="image/*,application/pdf,.doc,.docx"
              />
              <FilePicker
                id="reports"
                label="Medical reports *"
                hint="Clinical reports (PDF or image)"
                files={medicalReportFiles}
                onChange={onMedicalReportChange}
                accept="image/*,application/pdf,.doc,.docx"
              />
            </div>
          </section>
        </DialogBody>

        <DialogFooter className="gap-2 sm:gap-2 bg-muted/20 shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting…
              </>
            ) : (
              'Submit claim'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
