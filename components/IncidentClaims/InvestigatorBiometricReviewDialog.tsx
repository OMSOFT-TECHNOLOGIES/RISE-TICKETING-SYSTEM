import React, { useState } from 'react';
import { Fingerprint, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import {
  enrollPassengerBiometric,
  verifyBiometricReference,
} from '../shared/biometricEnrollment';

interface InvestigatorBiometricReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  claimId: string;
  claimantName: string;
  amount: number;
  claimantBiometricReference?: string;
  onConfirm: (payload: {
    approved: boolean;
    claimantBiometricMatched: boolean;
    investigatorBiometricReference: string;
  }) => Promise<void>;
}

export function InvestigatorBiometricReviewDialog({
  open,
  onOpenChange,
  claimId,
  claimantName,
  amount,
  claimantBiometricReference,
  onConfirm,
}: InvestigatorBiometricReviewDialogProps) {
  const [busy, setBusy] = useState(false);
  const [investigatorRef, setInvestigatorRef] = useState<string | undefined>();
  const [claimantMatched, setClaimantMatched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setInvestigatorRef(undefined);
    setClaimantMatched(false);
    setError(null);
  };

  const verifyClaimant = async () => {
    if (!claimantBiometricReference) {
      setError('No biometric on file for this claimant from trip booking.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const ok = await verifyBiometricReference(claimantBiometricReference);
      setClaimantMatched(ok);
      if (!ok) setError('Claimant biometric verification failed.');
    } finally {
      setBusy(false);
    }
  };

  const verifyInvestigator = async () => {
    setBusy(true);
    setError(null);
    try {
      const ref = await enrollPassengerBiometric('Investigator');
      setInvestigatorRef(ref);
    } catch {
      setError('Investigator biometric verification failed.');
    } finally {
      setBusy(false);
    }
  };

  const submit = async (approved: boolean) => {
    if (!investigatorRef) {
      setError('Confirm your identity with investigator biometric first.');
      return;
    }
    if (approved && claimantBiometricReference && !claimantMatched) {
      setError('Verify claimant biometric before approving.');
      return;
    }
    setBusy(true);
    try {
      await onConfirm({
        approved,
        claimantBiometricMatched: claimantMatched || !claimantBiometricReference,
        investigatorBiometricReference: investigatorRef,
      });
      onOpenChange(false);
      reset();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-[#193cb8]" />
            Biometric claim review
          </DialogTitle>
          <DialogDescription>
            Claim {claimId} · {claimantName} · GH₵{amount.toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="space-y-2">
            <Label>1. Claimant biometric</Label>
            <p className="text-xs text-muted-foreground">
              {claimantBiometricReference
                ? 'Verify the injured passenger against enrollment from booking.'
                : 'No booking biometric — manual review only.'}
            </p>
            {claimantBiometricReference ? (
              <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void verifyClaimant()}>
                {claimantMatched ? 'Claimant verified' : 'Verify claimant'}
              </Button>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>2. Investigator biometric</Label>
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void verifyInvestigator()}>
              {investigatorRef ? 'Investigator verified' : 'Confirm investigator identity'}
            </Button>
          </div>

          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" disabled={busy} onClick={() => void submit(false)}>
            Reject claim
          </Button>
          <Button type="button" disabled={busy} onClick={() => void submit(true)}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve claim'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
