import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, Settings2, FileText, DollarSign, ShieldCheck, Plus, SlidersHorizontal } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
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
import { ClaimStatusBadge } from './IncidentClaims/ClaimStatusBadge';
import { ActionIconButton } from './IncidentClaims/ActionIconButton';
import { ClaimDocumentGallery } from './IncidentClaims/ClaimDocumentGallery';
import { InvestigatorBiometricReviewDialog } from './IncidentClaims/InvestigatorBiometricReviewDialog';
import { ClaimsKpiSection } from './IncidentClaims/ClaimsKpiSection';
import { SubmitClaimDialog } from './IncidentClaims/SubmitClaimDialog';
import { PageHeader } from './shared/PageHeader';
import { RisePreloader, RiseStatusAlert } from './shared/feedback';
import { ScrollableTable } from './shared/ScrollableTable';

interface IncidentOption {
  id: string;
  location: string;
  title?: string;
  status?: string;
  claimEligible?: boolean;
  confirmedByName?: string;
  confirmedByStation?: string;
  confirmedByPhone?: string;
  confirmedByAgency?: string;
  investigatorName?: string;
  investigatorStation?: string;
  investigatorPhone?: string;
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
  hospitalName?: string;
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

export function IncidentClaims() {
  const { user, hasPermission, isSuperAdmin } = useAuth();
  const canSubmit = hasPermission('submit_claims') || hasPermission('manage_claims');
  const canManage = hasPermission('manage_claims');
  const canInvestigatorReview = hasPermission('approve_claims');
  const canProcessPayments = hasPermission('process_claim_payments');
  const isHospitalClaimer =
    user?.role === 'hospital_incident_claimer' ||
    (hasPermission('submit_claims') && !canManage && !isSuperAdmin());

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
    pageSize,
    setPageSize,
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
  const [biometricReviewClaim, setBiometricReviewClaim] = useState<
    (IncidentClaim & { claimantBiometricReference?: string }) | null
  >(null);
  const [biometricReviewOpen, setBiometricReviewOpen] = useState(false);
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
    hospitalName: '',
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

      const incidentList = parseListResponse<IncidentOption>(response.data, 'incidents');

      setIncidents(
        incidentList.map((incident) => ({
          ...incident,
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
      hospitalName: '',
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
    if (isHospitalClaimer && !formData.hospitalName.trim()) {
      notify.error('Hospital name is required');
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
        hospitalName: formData.hospitalName.trim() || undefined,
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

  const handleStatusUpdate = async (claimId: string, newStatus: 'paid') => {
    const response = await incidentClaimApi.updateStatus(claimId, { status: newStatus });

    if (response.success) {
      notify.success('Payment recorded by RIMA Consult Accounts');
      await refresh();
    } else {
      notify.error(response.error || 'Failed to update claim status');
    }
  };

  const openBiometricReview = async (claim: IncidentClaim) => {
    const detail = await incidentClaimApi.getById(claim.id);
    const data = (detail.success && detail.data
      ? detail.data
      : claim) as IncidentClaim & { claimantBiometricReference?: string };
    setBiometricReviewClaim(data);
    setBiometricReviewOpen(true);
  };

  const handleInvestigatorReview = async (payload: {
    approved: boolean;
    claimantBiometricMatched: boolean;
    investigatorBiometricReference: string;
  }) => {
    if (!biometricReviewClaim) return;
    const response = await incidentClaimApi.investigatorReview(biometricReviewClaim.id, payload);
    if (response.success) {
      notify.success(
        payload.approved
          ? 'Claim approved — SMS sent to claimant with compensation amount'
          : 'Claim rejected — SMS sent to claimant'
      );
      setBiometricReviewOpen(false);
      setBiometricReviewClaim(null);
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

  const totalClaims = claims.length;
  const totalListed = pagination?.totalItems;
  const awaitingInvestigatorClaims = claims.filter(
    (c) => c.status === 'awaiting_investigator'
  ).length;
  const pendingClaims = claims.filter(
    (c) => c.status === 'pending' || c.status === 'awaiting_investigator'
  ).length;
  const approvedClaims = claims.filter((c) => c.status === 'approved').length;
  const totalCompensation = claims
    .filter((c) => c.status === 'paid')
    .reduce((sum, c) => sum + Number(c.compensationAmount) || 0, 0);

  const hasActiveFilters = statusFilter !== 'all' || Boolean(searchTerm.trim());

  const claimEligibleIncidents = useMemo(
    () => incidents.filter((i) => i.claimEligible === true),
    [incidents]
  );

  const selectedIncident = incidents.find((i) => i.id === formData.incidentId);
  const compensationRange = injuryCompensation[formData.injuryType];

  if (loading && claims.length === 0 && !error) {
    return (
      <div className="p-6 min-h-[420px] rise-dashboard-page">
        <RisePreloader variant="page" label="Loading claims…" />
      </div>
    );
  }

  return (
    <div className="min-h-full rise-dashboard-page">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <PageHeader
          title="Incident claims"
          description="Investigators approve or reject claims using biometric verification; claimants receive SMS with the decision and amount. Payment is processed by RIMA Consult Accounts only."
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refresh({ toastOnError: true })}
                disabled={loading}
              >
                <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
                Refresh
              </Button>
              {isSuperAdmin() ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTierDraft(compensationTiers);
                    setIsTierDialogOpen(true);
                  }}
                >
                  <Settings2 className="h-4 w-4 mr-2" />
                  Compensation ranges
                </Button>
              ) : null}
              {canSubmit ? (
                <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New claim
                </Button>
              ) : null}
            </div>
          }
        />

        {error ? (
          <RiseStatusAlert type="error" title="Could not load claims">
            {error}
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => void refresh({ toastOnError: true })}
            >
              Try again
            </Button>
          </RiseStatusAlert>
        ) : null}

        {isHospitalClaimer && incidents.length > 0 ? (
          <Card className="rounded-2xl shadow-sm ring-1 ring-border/50 border-0 overflow-hidden">
            <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
              <CardTitle className="text-lg font-semibold">Registered incidents (audit)</CardTitle>
              <CardDescription className="mt-1">
                Agency verification and investigator details. Only rows marked selectable can be used
                when filing a claim.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollableTable
                className="border-0 shadow-none ring-0"
                maxHeightClass="max-h-[min(50vh,420px)]"
                minWidthClass="min-w-[960px]"
              >
                <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Incident ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Confirmed by</TableHead>
                  <TableHead>Station</TableHead>
                  <TableHead>Tel.</TableHead>
                  <TableHead>Investigator</TableHead>
                  <TableHead>Investigator station</TableHead>
                  <TableHead>Investigator tel.</TableHead>
                  <TableHead>Claim</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((inc) => (
                  <TableRow key={inc.id}>
                    <TableCell className="font-mono text-xs">{inc.id}</TableCell>
                    <TableCell>{inc.status ?? '—'}</TableCell>
                    <TableCell>{inc.confirmedByName ?? inc.confirmedByAgency ?? '—'}</TableCell>
                    <TableCell>{inc.confirmedByStation ?? '—'}</TableCell>
                    <TableCell>{inc.confirmedByPhone ?? '—'}</TableCell>
                    <TableCell>{inc.investigatorName ?? '—'}</TableCell>
                    <TableCell>{inc.investigatorStation ?? '—'}</TableCell>
                    <TableCell>{inc.investigatorPhone ?? '—'}</TableCell>
                    <TableCell>
                      {inc.claimEligible ? (
                        <Badge variant="default">Selectable</Badge>
                      ) : (
                        <Badge variant="secondary">Not yet</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
                </Table>
              </ScrollableTable>
            </CardContent>
          </Card>
        ) : null}

        <ClaimsKpiSection
          totalOnPage={totalClaims}
          totalListed={totalListed}
          pendingReview={pendingClaims}
          approved={approvedClaims}
          totalPaidAmount={totalCompensation}
          awaitingInvestigator={awaitingInvestigatorClaims}
        />

        <Card className="rounded-2xl shadow-sm ring-1 ring-border/50 overflow-hidden border-0">
          <CardHeader className="space-y-4 border-b border-border/60 bg-muted/20 pb-4">
            <div>
              <CardTitle className="text-lg font-semibold">Claims registry</CardTitle>
              <CardDescription className="mt-1">
                {totalListed != null
                  ? `${claims.length} of ${totalListed} claim${totalListed === 1 ? '' : 's'}`
                  : `${claims.length} claim${claims.length === 1 ? '' : 's'}`}{' '}
                · search and filter
              </CardDescription>
            </div>
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Claimant, claim ID, incident…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 bg-background/80"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px] h-10 bg-background/80">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="awaiting_investigator">Awaiting investigator</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
              {hasActiveFilters ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 text-muted-foreground"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                >
                  Clear
                </Button>
              ) : null}
            </div>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
              Open a claim to review attachments, investigator notes, and payment status.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className={loading ? 'opacity-60 pointer-events-none transition-opacity' : ''}>
              {claims.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="font-medium">No claims match your criteria</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    Adjust filters or submit a new claim for an eligible incident.
                  </p>
                </div>
              ) : (
                <ScrollableTable
                  className="border-0 shadow-none ring-0"
                  maxHeightClass="max-h-[min(70vh,560px)]"
                  minWidthClass="min-w-[1000px]"
                >
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Claim ID</TableHead>
                        <TableHead>Claimant</TableHead>
                        <TableHead>Incident</TableHead>
                        <TableHead>Injury type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {claims.map((claim) => (
                        <TableRow key={claim.id} className="group">
                          <TableCell className="font-medium font-mono text-xs">{claim.id}</TableCell>
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
                    <ClaimStatusBadge status={claim.status} />
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

                      {claim.status === 'awaiting_investigator' && canInvestigatorReview ? (
                        <ActionIconButton
                          label="Investigator: biometric review (approve or reject)"
                          className="text-primary"
                          onClick={() => void openBiometricReview(claim)}
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </ActionIconButton>
                      ) : null}

                      {claim.status === 'approved' && canProcessPayments ? (
                        <ActionIconButton
                          label="RIMA Accounts: mark claim paid to hospital"
                          className="text-primary"
                          onClick={() => void handleStatusUpdate(claim.id, 'paid')}
                        >
                          <DollarSign className="h-4 w-4" />
                        </ActionIconButton>
                      ) : null}
                    </div>
                  </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollableTable>
              )}
              <TablePagination
                page={page}
                pagination={pagination}
                onPageChange={setPage}
                loading={loading}
                itemLabel="claims"
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                alwaysShow
                className="px-4 sm:px-6 pb-4 pt-2 border-t border-border/60"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={isTierDialogOpen}
        onOpenChange={(open) => {
          setIsTierDialogOpen(open);
          if (open) setTierDraft(compensationTiers);
        }}
      >
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden rounded-2xl">
          <DialogHeader className="border-b border-border/80 bg-gradient-to-br from-muted/50 to-background px-6 py-5">
            <DialogTitle className="text-lg font-semibold">Compensation ranges</DialogTitle>
            <DialogDescription className="text-sm">
              Super Admin — set min and max GH₵ amounts per injury tier.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="px-6 py-5 space-y-4 max-h-[min(50vh,400px)]">
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
                      next[index] = { ...tier, minAmount: Number(e.target.value) };
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
                      next[index] = { ...tier, maxAmount: Number(e.target.value) };
                      setTierDraft(next);
                    }}
                  />
                </div>
              </div>
            ))}
          </DialogBody>
          <DialogFooter className="bg-muted/20">
            <Button variant="outline" onClick={() => setIsTierDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void saveTierDraft()}>Save ranges</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {canSubmit ? (
        <SubmitClaimDialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) resetForm();
          }}
          formData={formData}
          onFormChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
          claimEligibleIncidents={claimEligibleIncidents}
          selectedIncident={selectedIncident}
          openIncidentCombobox={openIncidentCombobox}
          onOpenIncidentComboboxChange={setOpenIncidentCombobox}
          onIncidentSelect={(id) => {
            setFormData((prev) => ({ ...prev, incidentId: id }));
            setOpenIncidentCombobox(false);
            void loadClaimantCandidates(id);
          }}
          claimantMode={claimantMode}
          manifestPassengers={manifestPassengers}
          selectedPassengerId={selectedPassengerId}
          onPassengerSelect={handlePassengerSelect}
          isHospitalClaimer={isHospitalClaimer}
          injuryCompensation={injuryCompensation}
          compensationRange={compensationRange}
          onInjuryTypeChange={handleInjuryTypeChange}
          evidenceFiles={evidenceFiles}
          medicalReceiptFiles={medicalReceiptFiles}
          medicalReportFiles={medicalReportFiles}
          onEvidenceChange={setEvidenceFiles}
          onMedicalReceiptChange={setMedicalReceiptFiles}
          onMedicalReportChange={setMedicalReportFiles}
          onSubmit={() => void handleAdd()}
          isSubmitting={isSubmitting}
        />
      ) : null}

      {biometricReviewClaim ? (
        <InvestigatorBiometricReviewDialog
          open={biometricReviewOpen}
          onOpenChange={setBiometricReviewOpen}
          claimId={biometricReviewClaim.id}
          claimantName={biometricReviewClaim.claimantName}
          amount={Number(biometricReviewClaim.compensationAmount)}
          claimantBiometricReference={biometricReviewClaim.claimantBiometricReference}
          onConfirm={handleInvestigatorReview}
        />
      ) : null}

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden rounded-2xl max-h-[min(90dvh,calc(100%-2rem))] flex flex-col">
          <DialogHeader className="border-b border-border/80 bg-gradient-to-br from-muted/50 to-background px-6 py-5 shrink-0">
            <DialogTitle className="text-xl font-semibold tracking-tight">
              Claim details
              {selectedClaim ? (
                <span className="block text-sm font-normal text-muted-foreground mt-1 font-mono">
                  {selectedClaim.id}
                </span>
              ) : null}
            </DialogTitle>
          </DialogHeader>
          {selectedClaim ? (
            <DialogBody className="px-6 py-5 space-y-4 max-h-[min(62vh,560px)]">
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

              {(selectedClaim.hospitalName ||
                selectedClaim.hospitalBankName ||
                selectedClaim.hospitalAccountNumber) && (
                <div>
                  <Label>Hospital &amp; payment account</Label>
                  <div className="mt-2 text-sm space-y-1 bg-muted p-3 rounded">
                    {selectedClaim.hospitalName ? (
                      <p>
                        <strong>Hospital:</strong> {selectedClaim.hospitalName}
                      </p>
                    ) : null}
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
                    <ClaimStatusBadge status={selectedClaim.status} />
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

              {selectedClaim.paymentDate ? (
                <div>
                  <Label>Payment date</Label>
                  <p className="mt-2 text-sm">
                    {new Date(selectedClaim.paymentDate).toLocaleString()}
                  </p>
                </div>
              ) : null}
            </DialogBody>
          ) : null}
          <DialogFooter className="bg-muted/20 shrink-0">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
