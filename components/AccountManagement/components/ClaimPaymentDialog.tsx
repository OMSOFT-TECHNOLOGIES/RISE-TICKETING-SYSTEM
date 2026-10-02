import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Search, Wallet } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { incidentClaimApi } from '../../utils/api/incidentClaims';
import { parseListResponse } from '../../utils/api/client';
import { notify } from '../../utils/notify';

export interface ApprovedClaimOption {
  id: string;
  incidentId: string;
  claimantName: string;
  claimantPhone?: string;
  compensationAmount: number;
  hospitalName?: string;
}

interface ClaimPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentComplete?: () => void;
}

function formatAmount(amount: number): string {
  return `GH₵${Number(amount).toLocaleString()}`;
}

function claimOptionLabel(claim: ApprovedClaimOption): string {
  const hospital = claim.hospitalName ? ` · ${claim.hospitalName}` : '';
  return `${claim.incidentId} — ${claim.claimantName}${hospital} — ${formatAmount(claim.compensationAmount)}`;
}

export function ClaimPaymentDialog({
  open,
  onOpenChange,
  onPaymentComplete,
}: ClaimPaymentDialogProps) {
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [claims, setClaims] = useState<ApprovedClaimOption[]>([]);
  const [selectedClaimId, setSelectedClaimId] = useState('');
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);

  const loadApprovedClaims = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      const trimmed = search?.trim();
      const response = await incidentClaimApi.getAll({
        status: 'approved',
        search: trimmed || undefined,
        limit: 100,
        page: 1,
      });
      if (!response.success || response.data === undefined) {
        notify.error(response.error || 'Failed to load approved claims');
        setClaims([]);
        return;
      }
      const list = parseListResponse<ApprovedClaimOption>(response.data, 'claims');
      setClaims(list);
      setSelectedClaimId((prev) => {
        if (list.length === 0) return '';
        if (list.some((c) => c.id === prev)) return prev;
        return list[0].id;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setSearchInput('');
      setAppliedSearch('');
      void loadApprovedClaims();
    }
  }, [open, loadApprovedClaims]);

  const handleSearch = () => {
    setAppliedSearch(searchInput.trim());
    void loadApprovedClaims(searchInput);
  };

  const selectedClaim = claims.find((c) => c.id === selectedClaimId);

  const handlePay = async () => {
    if (!selectedClaimId) {
      notify.error('Select an approved claim to pay');
      return;
    }
    setPaying(true);
    try {
      const response = await incidentClaimApi.updateStatus(selectedClaimId, { status: 'paid' });
      if (response.success) {
        notify.success(
          'Payment recorded. SMS notifications sent to the patient and hospital contact.'
        );
        onOpenChange(false);
        onPaymentComplete?.();
      } else {
        notify.error(response.error || 'Failed to process payment');
      }
    } finally {
      setPaying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-w-lg flex-col gap-0 p-0">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-[#193cb8]/10 border border-[#193cb8]/20 p-2.5 shrink-0">
              <Wallet className="h-5 w-5 text-[#193cb8]" />
            </div>
            <div>
              <DialogTitle>Pay incident claim</DialogTitle>
              <DialogDescription className="mt-1">
                Select an investigator-approved claim by incident number. Payment triggers SMS to the
                patient and hospital submitter.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 py-5">
          <div className="space-y-2">
            <Label htmlFor="claim-payment-search">Search (incident no., patient, hospital)</Label>
            <div className="flex gap-2">
              <Input
                id="claim-payment-search"
                placeholder="e.g. INC005 or hospital name"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={handleSearch} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
            {appliedSearch ? (
              <p className="text-xs text-muted-foreground">
                Showing approved claims matching &quot;{appliedSearch}&quot;
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Approved claim</Label>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading approved claims…
              </div>
            ) : claims.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No approved claims awaiting payment.
              </p>
            ) : (
              <Select value={selectedClaimId} onValueChange={setSelectedClaimId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select incident / claim" />
                </SelectTrigger>
                <SelectContent>
                  {claims.map((claim) => (
                    <SelectItem key={claim.id} value={claim.id}>
                      {claimOptionLabel(claim)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedClaim ? (
            <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Incident:</span>{' '}
                <span className="font-medium">{selectedClaim.incidentId}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Claim:</span>{' '}
                <span className="font-medium">{selectedClaim.id}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Amount:</span>{' '}
                <span className="font-medium tabular-nums">
                  {formatAmount(selectedClaim.compensationAmount)}
                </span>
              </p>
              {selectedClaim.hospitalName ? (
                <p>
                  <span className="text-muted-foreground">Hospital:</span>{' '}
                  {selectedClaim.hospitalName}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-[#193cb8] hover:bg-[#152f94]"
            disabled={!selectedClaimId || paying || loading}
            onClick={() => void handlePay()}
          >
            {paying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing…
              </>
            ) : (
              'Confirm payment'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
