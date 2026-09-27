import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Settings2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  Plus,
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronsUpDown,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command';
import { cn } from './ui/utils';
import { incidentApi, incidentClaimApi } from './utils/api';
import { parseListResponse } from './utils/api/client';
import { usePaginatedEntityList } from './shared/hooks/usePaginatedEntityList';
import { TablePagination } from './shared/TablePagination';
import { notify } from './utils/notify';
import { useAuth } from './AuthContext';
import {
  parseClaimCompensationTiers,
  tiersToRecord,
  type ClaimCompensationTier,
  type InjuryTierKey,
} from './utils/claimCompensation';
import { claimStatusBadgeClass, claimStatusLabel } from './IncidentClaims/claimStatus';
import { ActionIconButton } from './IncidentClaims/ActionIconButton';
import { ClaimDocumentGallery } from './IncidentClaims/ClaimDocumentGallery';

interface IncidentOption {
  id: string;
  location: string;
}

interface ManifestPassenger {
  passengerId: string;
  name: string;
  phone: string;
  seatNumber?: string;
}

interface IncidentClaim {
  id: string;
  incidentId: string;
  claimantName: string;
  claimantPhone: string;
  claimantId: string;
  injuryType: InjuryTierKey;
  compensationAmount: number;
  description: string;
  medicalReports: string[];
  medicalReceipts: string[];
  evidenceMedia: string[];
  hospitalBankName?: string;
  hospitalAccountName?: string;
  hospitalAccountNumber?: string;
  investigatorNotes?: string;
  status: string;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  paymentDate?: string;
}

function FilePicker({
  id,
  label,
  hint,
  files,
  onChange,
  accept,
}: {
  id: string;
  label: string;
  hint: string;
  files: File[];
  onChange: (files: File[]) => void;
  accept: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="file"
        multiple
        accept={accept}
        onChange={(e) => onChange(Array.from(e.target.files ?? []))}
      />
      <p className="text-xs text-muted-foreground">{hint}</p>
      {files.length > 0 && (
        <p className="text-xs font-medium">{files.length} file(s) selected</p>
      )}
    </div>
  );
}

export function IncidentClaims() {
  const { user, hasPermission, isSuperAdmin } = useAuth();
  const canSubmit = hasPermission('submit_claims') || hasPermission('manage_claims');
  const canManage = hasPermission('manage_claims');
  const canInvestigatorReview = hasPermission('approve_claims');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [compensationTiers, setCompensationTiers] = useState<ClaimCompensationTier[]>([]);
  const injuryCompensation = useMemo(
    () => tiersToRecord(compensationTiers),
    [compensationTiers]
  );

  const fetchClaims = useCallback(
    (page: number, limit: number) =>
      incidentClaimApi.getAll({
        page,
        limit,
        search: searchTerm.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }),
    [searchTerm, statusFilter]
  );
  const {
    items: claims,
    loading,
    error,
    refresh,
    isSubmitting,
    setIsSubmitting,
    page,
    setPage,
    pagination,
  } = usePaginatedEntityList<IncidentClaim>({
    fetchFn: fetchClaims,
    entityKey: 'claims',
    errorMessage: 'Failed to load incident claims',
    resetPageDeps: [searchTerm, statusFilter],
  });

  const [incidents, setIncidents] = useState<IncidentOption[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isTierDialogOpen, setIsTierDialogOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<IncidentClaim | null>(null);
  const [tierDraft, setTierDraft] = useState<ClaimCompensationTier[]>([]);

  const [openIncidentCombobox, setOpenIncidentCombobox] = useState(false);
  const [claimantMode, setClaimantMode] = useState<'manual_entry' | 'passenger_manifest'>(
    'manual_entry'
  );
  const [manifestPassengers, setManifestPassengers] = useState<ManifestPassenger[]>([]);
  const [selectedPassengerId, setSelectedPassengerId] = useState('');

  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [medicalReceiptFiles, setMedicalReceiptFiles] = useState<File[]>([]);
  const [medicalReportFiles, setMedicalReportFiles] = useState<File[]>([]);

  const [formData, setFormData] = useState({
    incidentId: '',
    claimantName: '',
    claimantPhone: '',
    claimantId: '',
    injuryType: 'minor' as InjuryTierKey,
    compensationAmount: '200',
    description: '',
    hospitalBankName: '',
    hospitalAccountName: '',
    hospitalAccountNumber: '',
  });

  useEffect(() => {
    let cancelled = false;
    async function loadTiers() {
      const response = await incidentClaimApi.getCompensationTiers();
      if (cancelled || !response.success) return;
      const tiers = parseClaimCompensationTiers(response.data);
      setCompensationTiers(tiers);
      setFormData((prev) => ({
        ...prev,
        compensationAmount: String(tiersToRecord(tiers).minor.minAmount),
      }));
    }
    void loadTiers();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchIncidents() {
      const useClaimOptions =
        user?.role === 'hospital_incident_claimer' ||
        (hasPermission('submit_claims') && !hasPermission('manage_incidents'));

      const response = useClaimOptions
        ? await incidentApi.getClaimOptions({ limit: 100 })
        : await incidentApi.getAll({ limit: 100 });

      if (cancelled || !response.success || response.data === undefined) return;

      const incidentList = parseListResponse<{
        id: string;
        location: string;
        title?: string;
      }>(response.data, 'incidents');

      setIncidents(
        incidentList.map((incident) => ({
          id: incident.id,
          location: incident.location || incident.title || incident.id,
        }))
      );
    }

    if (user) {
      void fetchIncidents();
    }

    return () => {
      cancelled = true;
    };
  }, [user, hasPermission]);

  const loadClaimantCandidates = useCallback(async (incidentId: string) => {
    const response = await incidentApi.getClaimantCandidates(incidentId);
    if (!response.success || !response.data) {
      setClaimantMode('manual_entry');
      setManifestPassengers([]);
      return;
    }
    const data = response.data as {
      selectionMode?: string;
      passengers?: ManifestPassenger[];
    };
    const mode =
      data.selectionMode === 'passenger_manifest' ? 'passenger_manifest' : 'manual_entry';
    setClaimantMode(mode);
    setManifestPassengers(Array.isArray(data.passengers) ? data.passengers : []);
    setSelectedPassengerId('');
    if (mode === 'manual_entry') {
      setFormData((prev) => ({
        ...prev,
        claimantName: '',
        claimantPhone: '',
        claimantId: '',
      }));
    }
  }, []);

  const resetForm = () => {
    const min = injuryCompensation.minor.minAmount;
    setFormData({
      incidentId: '',
      claimantName: '',
      claimantPhone: '',
      claimantId: '',
      injuryType: 'minor',
      compensationAmount: String(min),
      description: '',
      hospitalBankName: '',
      hospitalAccountName: '',
      hospitalAccountNumber: '',
    });
    setEvidenceFiles([]);
    setMedicalReceiptFiles([]);
    setMedicalReportFiles([]);
    setClaimantMode('manual_entry');
    setManifestPassengers([]);
    setSelectedPassengerId('');
  };

  const handleInjuryTypeChange = (injuryType: InjuryTierKey) => {
    const compensation = injuryCompensation[injuryType];
    setFormData((prev) => ({
      ...prev,
      injuryType,
      compensationAmount: String(compensation.minAmount),
    }));
  };

  const handlePassengerSelect = (passengerId: string) => {
    setSelectedPassengerId(passengerId);
    const passenger = manifestPassengers.find((p) => p.passengerId === passengerId);
    if (!passenger) return;
    setFormData((prev) => ({
      ...prev,
      claimantName: passenger.name,
      claimantPhone: passenger.phone,
      claimantId: passenger.passengerId,
    }));
  };

  const parseCompensationAmount = (): number | null => {
    const trimmed = formData.compensationAmount.trim();
    if (!trimmed) return null;
    const amount = Number(trimmed);
    if (!Number.isFinite(amount)) return null;
    return amount;
  };

  const uploadAllDocuments = async (claimId: string) => {
    const uploads: Promise<unknown>[] = [];
    for (const file of evidenceFiles) {
      uploads.push(incidentClaimApi.uploadDocument(claimId, file, 'evidence'));
    }
    for (const file of medicalReceiptFiles) {
      uploads.push(incidentClaimApi.uploadDocument(claimId, file, 'medical_receipt'));
    }
    for (const file of medicalReportFiles) {
      uploads.push(incidentClaimApi.uploadDocument(claimId, file, 'medical_report'));
    }
    const results = await Promise.all(uploads);
    const failed = results.some((r) => (r as { success?: boolean }).success === false);
    if (failed) {
      notify.error('Claim saved but some attachments failed to upload');
    }
  };

  const handleAdd = async () => {
    if (!formData.incidentId || !formData.claimantName || !formData.claimantPhone) {
      notify.error('Please fill in all required fields');
      return;
    }
    if (
      !formData.hospitalBankName.trim() ||
      !formData.hospitalAccountName.trim() ||
      !formData.hospitalAccountNumber.trim()
    ) {
      notify.error('Hospital bank details are required for direct payment');
      return;
    }
    if (evidenceFiles.length === 0) {
      notify.error('Add at least one photo or video for decision making');
      return;
    }
    if (medicalReceiptFiles.length === 0) {
      notify.error('Add at least one medical care receipt');
      return;
    }
    if (medicalReportFiles.length === 0) {
      notify.error('Add at least one medical report');
      return;
    }

    const compensationAmount = parseCompensationAmount();
    if (compensationAmount === null || compensationAmount <= 0) {
      notify.error('Enter a valid compensation amount');
      return;
    }

    const range = injuryCompensation[formData.injuryType];
    if (compensationAmount < range.minAmount || compensationAmount > range.maxAmount) {
      notify.error(
        `Compensation must be between GH₵${range.minAmount} and GH₵${range.maxAmount} for ${formData.injuryType} injuries`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await incidentClaimApi.create({
        incidentId: formData.incidentId,
        claimantName: formData.claimantName,
        claimantPhone: formData.claimantPhone,
        claimantId: formData.claimantId,
        injuryType: formData.injuryType,
        compensationAmount,
        description: formData.description,
        hospitalBankName: formData.hospitalBankName.trim(),
        hospitalAccountName: formData.hospitalAccountName.trim(),
        hospitalAccountNumber: formData.hospitalAccountNumber.trim(),
      });

      if (response.success && response.data) {
        const created = response.data as { id?: string };
        const claimId =
          created.id ??
          (typeof response.data === 'object' &&
          response.data !== null &&
          'claim' in (response.data as object)
            ? (response.data as { claim?: { id?: string } }).claim?.id
            : undefined);
        if (claimId) {
          await uploadAllDocuments(claimId);
        }
        const hospitalOnly =
          hasPermission('submit_claims') && !canManage && !isSuperAdmin();
        notify.success(
          hospitalOnly
            ? 'Claim submitted — awaiting incident investigator approval'
            : 'Incident claim submitted successfully'
        );
        setIsAddDialogOpen(false);
        resetForm();
        await refresh();
      } else {
        notify.error(response.error || 'Failed to submit claim');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (claimId: string, newStatus: 'approved' | 'rejected' | 'paid') => {
    const response = await incidentClaimApi.updateStatus(claimId, { status: newStatus });

    if (response.success) {
      notify.success(`Claim ${newStatus} successfully`);
      await refresh();
    } else {
      notify.error(response.error || 'Failed to update claim status');
    }
  };

  const handleInvestigatorReview = async (claimId: string, approved: boolean) => {
    const response = await incidentClaimApi.investigatorReview(claimId, { approved });
    if (response.success) {
      notify.success(approved ? 'Claim cleared to proceed' : 'Claim rejected by investigator');
      await refresh();
    } else {
      notify.error(response.error || 'Failed to record investigator decision');
    }
  };

  const saveTierDraft = async () => {
    const response = await incidentClaimApi.updateCompensationTiers(tierDraft);
    if (response.success) {
      const tiers = parseClaimCompensationTiers(response.data);
      setCompensationTiers(tiers);
      setIsTierDialogOpen(false);
      notify.success('Claim compensation ranges updated');
    } else {
      notify.error(response.error || 'Failed to update ranges');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'awaiting_investigator':
        return <ShieldCheck className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'paid':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const totalClaims = claims.length;
  const pendingClaims = claims.filter(
    (c) => c.status === 'pending' || c.status === 'awaiting_investigator'
  ).length;
  const approvedClaims = claims.filter((c) => c.status === 'approved').length;
  const totalCompensation = claims
    .filter((c) => c.status === 'paid')
    .reduce((sum, c) => sum + Number(c.compensationAmount) || 0, 0);

  const selectedIncident = incidents.find((i) => i.id === formData.incidentId);
  const compensationRange = injuryCompensation[formData.injuryType];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#193cb8]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <button
          type="button"
          onClick={() => refresh({ toastOnError: true })}
          className="text-sm font-medium text-[#193cb8] hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1>Incident Claims Management</h1>
          <p className="text-muted-foreground">
            Hospital claims require incident investigator approval before processing. Payments go to
            the hospital bank account on file.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isSuperAdmin() && (
            <Dialog
              open={isTierDialogOpen}
              onOpenChange={(open) => {
                setIsTierDialogOpen(open);
                if (open) setTierDraft(compensationTiers);
              }}
            >
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings2 className="h-4 w-4 mr-2" />
                  Compensation ranges
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Claim amount ranges (Super Admin)</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {tierDraft.map((tier, index) => (
                    <div key={tier.injuryType} className="grid grid-cols-3 gap-2 items-end">
                      <div>
                        <Label className="capitalize">{tier.injuryType}</Label>
                        <p className="text-xs text-muted-foreground truncate">{tier.description}</p>
                      </div>
                      <div>
                        <Label>Min (GH₵)</Label>
                        <Input
                          type="number"
                          value={tier.minAmount}
                          onChange={(e) => {
                            const next = [...tierDraft];
                            next[index] = {
                              ...tier,
                              minAmount: Number(e.target.value),
                            };
                            setTierDraft(next);
                          }}
                        />
                      </div>
                      <div>
                        <Label>Max (GH₵)</Label>
                        <Input
                          type="number"
                          value={tier.maxAmount}
                          onChange={(e) => {
                            const next = [...tierDraft];
                            next[index] = {
                              ...tier,
                              maxAmount: Number(e.target.value),
                            };
                            setTierDraft(next);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setIsTierDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => void saveTierDraft()}>Save ranges</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {canSubmit && (
            <Dialog
              open={isAddDialogOpen}
              onOpenChange={(open) => {
                setIsAddDialogOpen(open);
                if (!open) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Claim
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Submit Incident Claim</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <Label htmlFor="incidentId">Incident ID *</Label>
                      <Popover modal open={openIncidentCombobox} onOpenChange={setOpenIncidentCombobox}>
                        <PopoverTrigger asChild>
                          <Button
                            id="incidentId"
                            variant="outline"
                            role="combobox"
                            aria-expanded={openIncidentCombobox}
                            className="w-full justify-between font-normal"
                          >
                            {selectedIncident ? (
                              <span className="truncate">
                                {selectedIncident.id} — {selectedIncident.location}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                Search incident ID or location…
                              </span>
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
                                {incidents.map((incident) => (
                                  <CommandItem
                                    key={incident.id}
                                    value={`${incident.id} ${incident.location}`}
                                    onSelect={() => {
                                      setFormData((prev) => ({ ...prev, incidentId: incident.id }));
                                      setOpenIncidentCombobox(false);
                                      void loadClaimantCandidates(incident.id);
                                    }}
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
                      <p className="text-xs text-muted-foreground">
                        Obtain the incident ID from the investigator before submitting.
                      </p>
                    </div>

                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <Label htmlFor="claimantName">Claimant Name *</Label>
                      {claimantMode === 'passenger_manifest' && manifestPassengers.length > 0 ? (
                        <Select value={selectedPassengerId} onValueChange={handlePassengerSelect}>
                          <SelectTrigger id="claimantName">
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
                          onChange={(e) =>
                            setFormData({ ...formData, claimantName: e.target.value })
                          }
                          placeholder="Full name"
                        />
                      )}
                      {claimantMode === 'passenger_manifest' && (
                        <p className="text-xs text-muted-foreground">
                          Public transport incident — choose from the vehicle manifest.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="claimantPhone">Phone Number *</Label>
                      <Input
                        id="claimantPhone"
                        value={formData.claimantPhone}
                        onChange={(e) =>
                          setFormData({ ...formData, claimantPhone: e.target.value })
                        }
                        placeholder="+233244123456"
                        readOnly={
                          claimantMode === 'passenger_manifest' && Boolean(selectedPassengerId)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="claimantId">ID Number</Label>
                      <Input
                        id="claimantId"
                        value={formData.claimantId}
                        onChange={(e) => setFormData({ ...formData, claimantId: e.target.value })}
                        placeholder="Ghana Card, Passport, etc."
                      />
                    </div>
                  </div>

                  <div className="rounded-md border p-3 space-y-3 bg-muted/30">
                    <p className="text-sm font-medium">Hospital payment account</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="hospitalBankName">Bank name *</Label>
                        <Input
                          id="hospitalBankName"
                          value={formData.hospitalBankName}
                          onChange={(e) =>
                            setFormData({ ...formData, hospitalBankName: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="hospitalAccountName">Account name *</Label>
                        <Input
                          id="hospitalAccountName"
                          value={formData.hospitalAccountName}
                          onChange={(e) =>
                            setFormData({ ...formData, hospitalAccountName: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="hospitalAccountNumber">Account number *</Label>
                        <Input
                          id="hospitalAccountNumber"
                          value={formData.hospitalAccountNumber}
                          onChange={(e) =>
                            setFormData({ ...formData, hospitalAccountNumber: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="injuryType">Injury Type</Label>
                    <Select
                      value={formData.injuryType}
                      onValueChange={(value: InjuryTierKey) => handleInjuryTypeChange(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(injuryCompensation) as InjuryTierKey[]).map((type) => {
                          const info = injuryCompensation[type];
                          return (
                            <SelectItem key={type} value={type}>
                              <div className="flex flex-col">
                                <span className="capitalize font-medium">{type}</span>
                                <span className="text-sm text-muted-foreground">
                                  GH₵{info.minAmount} - GH₵{info.maxAmount}
                                </span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      {compensationRange.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="compensationAmount">Compensation Amount (GH₵)</Label>
                    <Input
                      id="compensationAmount"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min={compensationRange.minAmount}
                      max={compensationRange.maxAmount}
                      value={formData.compensationAmount}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, compensationAmount: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description of Injuries</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FilePicker
                      id="evidence"
                      label="Photos / videos *"
                      hint="Images or video for decision making"
                      files={evidenceFiles}
                      onChange={setEvidenceFiles}
                      accept="image/*,video/*"
                    />
                    <FilePicker
                      id="receipts"
                      label="Medical receipts *"
                      hint="Care receipts (PDF or image)"
                      files={medicalReceiptFiles}
                      onChange={setMedicalReceiptFiles}
                      accept="image/*,application/pdf,.doc,.docx"
                    />
                    <FilePicker
                      id="reports"
                      label="Medical reports *"
                      hint="Clinical reports (PDF or image)"
                      files={medicalReportFiles}
                      onChange={setMedicalReportFiles}
                      accept="image/*,application/pdf,.doc,.docx"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => void handleAdd()} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      'Submit Claim'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Total Claims</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClaims}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Pending review</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingClaims}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedClaims}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-[#193cb8]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GH₵{totalCompensation.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center space-x-4 flex-wrap gap-2">
        <Input
          placeholder="Search claims..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="awaiting_investigator">Awaiting investigator</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Claims Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim ID</TableHead>
                <TableHead>Claimant</TableHead>
                <TableHead>Incident</TableHead>
                <TableHead>Injury Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.map((claim) => (
                <TableRow key={claim.id}>
                  <TableCell className="font-medium">{claim.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{claim.claimantName}</div>
                      <div className="text-sm text-muted-foreground">{claim.claimantPhone}</div>
                    </div>
                  </TableCell>
                  <TableCell>{claim.incidentId}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {claim.injuryType}
                    </Badge>
                  </TableCell>
                  <TableCell>GH₵{Number(claim.compensationAmount).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn('capitalize gap-1', claimStatusBadgeClass(claim.status))}
                    >
                      {getStatusIcon(claim.status)}
                      {claimStatusLabel(claim.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(claim.submittedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <ActionIconButton
                        label="View claim details and attachments"
                        onClick={() => {
                          setSelectedClaim(claim);
                          setIsViewDialogOpen(true);
                        }}
                      >
                        <FileText className="h-4 w-4" />
                      </ActionIconButton>

                      {claim.status === 'awaiting_investigator' && canInvestigatorReview && (
                        <>
                          <ActionIconButton
                            label="Investigator: approve claim to proceed"
                            className="text-green-600"
                            onClick={() => void handleInvestigatorReview(claim.id, true)}
                          >
                            <ShieldCheck className="h-4 w-4" />
                          </ActionIconButton>
                          <ActionIconButton
                            label="Investigator: reject claim"
                            className="text-red-600"
                            onClick={() => void handleInvestigatorReview(claim.id, false)}
                          >
                            <XCircle className="h-4 w-4" />
                          </ActionIconButton>
                        </>
                      )}

                      {claim.status === 'pending' && canManage && (
                        <>
                          <ActionIconButton
                            label="Approve compensation claim"
                            className="text-green-600"
                            onClick={() => void handleStatusUpdate(claim.id, 'approved')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </ActionIconButton>
                          <ActionIconButton
                            label="Reject compensation claim"
                            className="text-red-600"
                            onClick={() => void handleStatusUpdate(claim.id, 'rejected')}
                          >
                            <XCircle className="h-4 w-4" />
                          </ActionIconButton>
                        </>
                      )}

                      {claim.status === 'approved' && canManage && (
                        <ActionIconButton
                          label="Mark claim as paid to hospital account"
                          className="text-[#193cb8]"
                          onClick={() => void handleStatusUpdate(claim.id, 'paid')}
                        >
                          <DollarSign className="h-4 w-4" />
                        </ActionIconButton>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            page={page}
            pagination={pagination}
            onPageChange={setPage}
            loading={loading}
            itemLabel="claims"
          />
        </CardContent>
      </Card>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Claim Details - {selectedClaim?.id}</DialogTitle>
          </DialogHeader>
          {selectedClaim && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Claimant Information</Label>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>
                      <strong>Name:</strong> {selectedClaim.claimantName}
                    </p>
                    <p>
                      <strong>Phone:</strong> {selectedClaim.claimantPhone}
                    </p>
                    <p>
                      <strong>ID:</strong> {selectedClaim.claimantId || '—'}
                    </p>
                  </div>
                </div>
                <div>
                  <Label>Claim Information</Label>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>
                      <strong>Incident:</strong> {selectedClaim.incidentId}
                    </p>
                    <p>
                      <strong>Injury Type:</strong> {selectedClaim.injuryType}
                    </p>
                    <p>
                      <strong>Amount:</strong> GH₵
                      {Number(selectedClaim.compensationAmount).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {(selectedClaim.hospitalBankName ||
                selectedClaim.hospitalAccountNumber) && (
                <div>
                  <Label>Hospital bank account</Label>
                  <div className="mt-2 text-sm space-y-1 bg-muted p-3 rounded">
                    <p>
                      <strong>Bank:</strong> {selectedClaim.hospitalBankName}
                    </p>
                    <p>
                      <strong>Account name:</strong> {selectedClaim.hospitalAccountName}
                    </p>
                    <p>
                      <strong>Account number:</strong> {selectedClaim.hospitalAccountNumber}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <Label>Description</Label>
                <p className="mt-2 text-sm bg-muted p-3 rounded">{selectedClaim.description}</p>
              </div>

              <div className="space-y-6 border-t pt-4">
                <ClaimDocumentGallery
                  claimId={selectedClaim.id}
                  title="Photos & videos"
                  files={selectedClaim.evidenceMedia ?? []}
                  emptyMessage="No photos or videos attached."
                />
                <ClaimDocumentGallery
                  claimId={selectedClaim.id}
                  title="Medical receipts"
                  files={selectedClaim.medicalReceipts ?? []}
                  emptyMessage="No medical receipts attached."
                />
                <ClaimDocumentGallery
                  claimId={selectedClaim.id}
                  title="Medical reports"
                  files={selectedClaim.medicalReports ?? []}
                  emptyMessage="No medical reports attached."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <div className="mt-2">
                    <Badge
                      variant="outline"
                      className={cn('capitalize gap-1', claimStatusBadgeClass(selectedClaim.status))}
                    >
                      {getStatusIcon(selectedClaim.status)}
                      {claimStatusLabel(selectedClaim.status)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Submitted</Label>
                  <p className="mt-2 text-sm">
                    {new Date(selectedClaim.submittedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedClaim.investigatorNotes && (
                <div>
                  <Label>Investigator notes</Label>
                  <p className="mt-2 text-sm bg-muted p-3 rounded">
                    {selectedClaim.investigatorNotes}
                  </p>
                </div>
              )}

              {selectedClaim.reviewedAt && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Reviewed By</Label>
                    <p className="mt-2">{selectedClaim.reviewedBy}</p>
                  </div>
                  <div>
                    <Label>Reviewed At</Label>
                    <p className="mt-2">{new Date(selectedClaim.reviewedAt).toLocaleString()}</p>
                  </div>
                </div>
              )}

              {selectedClaim.paymentDate && (
                <div>
                  <Label>Payment Date</Label>
                  <p className="mt-2 text-sm">
                    {new Date(selectedClaim.paymentDate).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
