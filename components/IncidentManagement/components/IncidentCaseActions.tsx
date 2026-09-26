import React, { useEffect, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import type { Incident } from '../types';
import {
  CONFIRMATION_AGENCY_OPTIONS,
  INCIDENT_WORKFLOW_STATUS_OPTIONS,
} from '../constants';
import { getStatusLabel } from '../utils';

interface IncidentCaseActionsProps {
  incident: Incident;
  canManage: boolean;
  onStatusChange: (status: string) => Promise<void>;
  onConfirmPublicReport: (payload: {
    confirmationStatus: 'confirmed' | 'rejected';
    confirmedByAgency: string;
  }) => Promise<void>;
}

export function IncidentCaseActions({
  incident,
  canManage,
  onStatusChange,
  onConfirmPublicReport,
}: IncidentCaseActionsProps) {
  const [statusDraft, setStatusDraft] = useState(incident.status);
  const [agency, setAgency] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setStatusDraft(incident.status);
  }, [incident.id, incident.status]);

  if (!canManage) return null;

  const isPublicPending =
    incident.reportSource === 'public' && incident.confirmationStatus === 'pending';

  const handleStatusSave = async () => {
    if (statusDraft === incident.status) return;
    setBusy(true);
    try {
      await onStatusChange(statusDraft);
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async (decision: 'confirmed' | 'rejected') => {
    if (!agency) return;
    setBusy(true);
    try {
      await onConfirmPublicReport({ confirmationStatus: decision, confirmedByAgency: agency });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
      <div className="flex items-center gap-2 font-medium text-sm">
        <ShieldCheck className="h-4 w-4 text-[#193cb8]" />
        Case workflow
      </div>

      <div className="space-y-2">
        <Label>Incident status</Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={statusDraft} onValueChange={setStatusDraft}>
            <SelectTrigger className="sm:flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INCIDENT_WORKFLOW_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            disabled={busy || statusDraft === incident.status}
            onClick={() => void handleStatusSave()}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update status'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Current: {getStatusLabel(incident.status)}
        </p>
      </div>

      {(isPublicPending || incident.reportSource === 'public') && (
        <div className="space-y-2 pt-2 border-t">
          <Label>Public report verification</Label>
          <p className="text-xs text-muted-foreground">
            MTTD, Fire Services, Road Safety, or Police can confirm or reject citizen reports.
          </p>
          {incident.confirmationStatus && incident.confirmationStatus !== 'pending' ? (
            <p className="text-sm">
              {incident.confirmationStatus === 'confirmed' ? 'Confirmed' : 'Rejected'}
              {incident.confirmedByAgency ? ` by ${incident.confirmedByAgency}` : ''}
            </p>
          ) : (
            <>
              <Select value={agency || undefined} onValueChange={setAgency}>
                <SelectTrigger>
                  <SelectValue placeholder="Verifying agency" />
                </SelectTrigger>
                <SelectContent>
                  {CONFIRMATION_AGENCY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={!agency || busy}
                  onClick={() => void handleConfirm('confirmed')}
                >
                  Confirm report
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!agency || busy}
                  onClick={() => void handleConfirm('rejected')}
                >
                  Reject report
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
