import React, { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
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
  Edit2,
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronsUpDown,
  Check,
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

interface IncidentOption {
  id: string;
  location: string;
}

interface IncidentClaim {
  id: string;
  incidentId: string;
  claimantName: string;
  claimantPhone: string;
  claimantId: string;
  injuryType: 'minor' | 'moderate' | 'severe';
  compensationAmount: number;
  description: string;
  medicalReports: string[];
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  paymentDate?: string;
}

export function IncidentClaims() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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
  const [selectedClaim, setSelectedClaim] = useState<IncidentClaim | null>(null);

  const [openIncidentCombobox, setOpenIncidentCombobox] = useState(false);

  const [formData, setFormData] = useState({
    incidentId: '',
    claimantName: '',
    claimantPhone: '',
    claimantId: '',
    injuryType: 'minor' as 'minor' | 'moderate' | 'severe',
    /** String so the amount field can be edited without forcing 0 while typing */
    compensationAmount: '200',
    description: '',
    medicalReports: [] as string[],
  });

  const injuryCompensation = {
    minor: { min: 200, max: 1000, description: 'Minor injuries (bruises, cuts, minor trauma)' },
    moderate: { min: 1000, max: 5000, description: 'Moderate injuries (fractures, sprains, significant trauma)' },
    severe: { min: 5000, max: 20000, description: 'Severe injuries (major fractures, head injuries, permanent damage)' }
  };

  useEffect(() => {
    let cancelled = false;

    async function fetchIncidents() {
      const response = await incidentApi.getAll();
      if (cancelled || !response.success || response.data === undefined) return;

      const incidentList = parseListResponse<{ id: string; location: string; title?: string }>(
        response.data,
        'incidents'
      );

      setIncidents(
        incidentList.map((incident) => ({
          id: incident.id,
          location: incident.location || incident.title || incident.id,
        }))
      );
    }

    fetchIncidents();

    return () => {
      cancelled = true;
    };
  }, []);

  const resetForm = () => {
    setFormData({
      incidentId: '',
      claimantName: '',
      claimantPhone: '',
      claimantId: '',
      injuryType: 'minor',
      compensationAmount: String(injuryCompensation.minor.min),
      description: '',
      medicalReports: [],
    });
  };

  const handleInjuryTypeChange = (injuryType: 'minor' | 'moderate' | 'severe') => {
    const compensation = injuryCompensation[injuryType];
    setFormData((prev) => ({
      ...prev,
      injuryType,
      compensationAmount: String(compensation.min),
    }));
  };

  const parseCompensationAmount = (): number | null => {
    const trimmed = formData.compensationAmount.trim();
    if (!trimmed) return null;
    const amount = Number(trimmed);
    if (!Number.isFinite(amount)) return null;
    return amount;
  };

  const handleAdd = async () => {
    if (!formData.incidentId || !formData.claimantName || !formData.claimantPhone) {
      notify.error('Please fill in all required fields');
      return;
    }

    const compensationAmount = parseCompensationAmount();
    if (compensationAmount === null || compensationAmount <= 0) {
      notify.error('Enter a valid compensation amount');
      return;
    }

    const range = injuryCompensation[formData.injuryType];
    if (compensationAmount < range.min || compensationAmount > range.max) {
      notify.error(`Compensation must be between GH₵${range.min} and GH₵${range.max} for ${formData.injuryType} injuries`);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await incidentClaimApi.create({
        ...formData,
        compensationAmount,
      });

      if (response.success) {
        notify.success('Incident claim submitted successfully');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'approved': return 'green';
      case 'rejected': return 'red';
      case 'paid': return 'blue';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'paid': return <DollarSign className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const totalClaims = claims.length;
  const pendingClaims = claims.filter(c => c.status === 'pending').length;
  const approvedClaims = claims.filter(c => c.status === 'approved').length;
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1>Incident Claims Management</h1>
          <p className="text-muted-foreground">
            Manage compensation claims for transport incidents
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Claim
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Submit Incident Claim</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
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
                            {incidents.map((incident) => (
                              <CommandItem
                                key={incident.id}
                                value={`${incident.id} ${incident.location}`}
                                onSelect={() => {
                                  setFormData((prev) => ({ ...prev, incidentId: incident.id }));
                                  setOpenIncidentCombobox(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4 shrink-0',
                                    formData.incidentId === incident.id ? 'opacity-100' : 'opacity-0'
                                  )}
                                />
                                <span className="font-medium">{incident.id}</span>
                                <span className="text-muted-foreground truncate"> — {incident.location}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="claimantName">Claimant Name *</Label>
                  <Input
                    id="claimantName"
                    value={formData.claimantName}
                    onChange={(e) => setFormData({ ...formData, claimantName: e.target.value })}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="claimantPhone">Phone Number *</Label>
                  <Input
                    id="claimantPhone"
                    value={formData.claimantPhone}
                    onChange={(e) => setFormData({ ...formData, claimantPhone: e.target.value })}
                    placeholder="+233244123456"
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

              <div className="space-y-2">
                <Label htmlFor="injuryType">Injury Type</Label>
                <Select 
                  value={formData.injuryType} 
                  onValueChange={(value: 'minor' | 'moderate' | 'severe') => handleInjuryTypeChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(injuryCompensation).map(([type, info]) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex flex-col">
                          <span className="capitalize font-medium">{type}</span>
                          <span className="text-sm text-muted-foreground">
                            GH₵{info.min} - GH₵{info.max}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {injuryCompensation[formData.injuryType].description}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="compensationAmount">Compensation Amount (GH₵)</Label>
                <Input
                  id="compensationAmount"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={compensationRange.min}
                  max={compensationRange.max}
                  value={formData.compensationAmount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, compensationAmount: e.target.value }))
                  }
                  placeholder={`${compensationRange.min} – ${compensationRange.max}`}
                />
                <p className="text-sm text-muted-foreground">
                  Allowed range for {formData.injuryType} injuries: GH₵{compensationRange.min} – GH₵
                  {compensationRange.max}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description of Injuries</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of injuries and impact..."
                  rows={3}
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
      </div>

      {/* Stats Cards */}
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
            <CardTitle>Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
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

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <Input
          placeholder="Search claims..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Claims Table */}
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
                    <Badge variant="outline" style={{ color: getStatusColor(claim.status) }}>
                      <span className="flex items-center">
                        {getStatusIcon(claim.status)}
                        <span className="ml-1 capitalize">{claim.status}</span>
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(claim.submittedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedClaim(claim);
                          setIsViewDialogOpen(true);
                        }}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      {claim.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusUpdate(claim.id, 'approved')}
                            className="text-green-600"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusUpdate(claim.id, 'rejected')}
                            className="text-red-600"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {claim.status === 'approved' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusUpdate(claim.id, 'paid')}
                          className="text-[#193cb8]"
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
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

      {/* View Claim Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Claim Details - {selectedClaim?.id}</DialogTitle>
          </DialogHeader>
          {selectedClaim && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Claimant Information</Label>
                  <div className="mt-2 space-y-1">
                    <p><strong>Name:</strong> {selectedClaim.claimantName}</p>
                    <p><strong>Phone:</strong> {selectedClaim.claimantPhone}</p>
                    <p><strong>ID:</strong> {selectedClaim.claimantId}</p>
                  </div>
                </div>
                <div>
                  <Label>Claim Information</Label>
                  <div className="mt-2 space-y-1">
                    <p><strong>Incident:</strong> {selectedClaim.incidentId}</p>
                    <p><strong>Injury Type:</strong> {selectedClaim.injuryType}</p>
                    <p><strong>Amount:</strong> GH₵{Number(selectedClaim.compensationAmount).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <Label>Description</Label>
                <p className="mt-2 text-sm bg-muted p-3 rounded">
                  {selectedClaim.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <div className="mt-2">
                    <Badge variant="outline" style={{ color: getStatusColor(selectedClaim.status) }}>
                      <span className="flex items-center">
                        {getStatusIcon(selectedClaim.status)}
                        <span className="ml-1 capitalize">{selectedClaim.status}</span>
                      </span>
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Submitted</Label>
                  <p className="mt-2 text-sm">{new Date(selectedClaim.submittedAt).toLocaleString()}</p>
                </div>
              </div>

              {selectedClaim.reviewedAt && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Reviewed By</Label>
                    <p className="mt-2 text-sm">{selectedClaim.reviewedBy}</p>
                  </div>
                  <div>
                    <Label>Reviewed At</Label>
                    <p className="mt-2 text-sm">{new Date(selectedClaim.reviewedAt).toLocaleString()}</p>
                  </div>
                </div>
              )}

              {selectedClaim.paymentDate && (
                <div>
                  <Label>Payment Date</Label>
                  <p className="mt-2 text-sm">{new Date(selectedClaim.paymentDate).toLocaleString()}</p>
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