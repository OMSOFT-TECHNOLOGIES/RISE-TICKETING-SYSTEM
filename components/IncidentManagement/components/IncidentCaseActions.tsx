import React, { useEffect, useMemo, useState } from 'react';
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
  canRespond?: boolean;
  canVerify?: boolean;
  canInvestigatorConfirm?: boolean;
  onStatusChange: (status: string) => Promise<void>;
  onConfirmPublicReport: (payload: {
    confirmationStatus: 'confirmed' | 'rejected';
    confirmedByAgency: string;
  }) => Promise<void>;
  onInvestigatorConfirm?: () => Promise<void>;
}

const EMERGENCY_STATUS_OPTIONS = INCIDENT_WORKFLOW_STATUS_OPTIONS.filter((opt) =>
  ['investigating', 'resolved', 'couldnt_fix', 'closed'].includes(opt.value)
);

export function IncidentCaseActions({
  incident,
  canManage,
  canRespond = false,
  canVerify = false,
  canInvestigatorConfirm = false,
  onStatusChange,
  onConfirmPublicReport,
  onInvestigatorConfirm,
}: IncidentCaseActionsProps) {
  const [statusDraft, setStatusDraft] = useState(incident.status);
  const [agency, setAgency] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setStatusDraft(incident.status);
  }, [incident.id, incident.status]);

  const statusOptions = useMemo(() => {
    if (canManage) return INCIDENT_WORKFLOW_STATUS_OPTIONS;
    if (canRespond) return EMERGENCY_STATUS_OPTIONS;
    return INCIDENT_WORKFLOW_STATUS_OPTIONS;
  }, [canManage, canRespond]);

  const showStatusControl = canManage || canRespond;
  const showPublicVerify =
    (canManage || canVerify) &&
    (incident.reportSource === 'public' || incident.confirmationStatus != null);
  const showInvestigatorConfirm =
    canInvestigatorConfirm &&
    !incident.investigatorConfirmedAt &&
    incident.confirmationStatus !== 'rejected';

  if (!showStatusControl && !showPublicVerify && !showInvestigatorConfirm) return null;

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

  const handleInvestigatorConfirm = async () => {
    if (!onInvestigatorConfirm) return;
    setBusy(true);
    try {
      await onInvestigatorConfirm();
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

      {showInvestigatorConfirm && (
        <div className="space-y-2 rounded-md border border-sky-200 bg-sky-50/50 p-3 dark:bg-sky-950/20">
          <Label>Investigator confirmation</Label>
          <p className="text-xs text-muted-foreground">
            Confirm the incident to publish the official incident ID for hospital claims and open
            the case to MTTD, Fire, Police, Road Safety, and Ambulance teams. Traffic accidents
            are automatically added to Accident Analysis for the district Road Safety Manager
            (no separate accident report needed).
          </p>
          <Button type="button" size="sm" disabled={busy} onClick={() => void handleInvestigatorConfirm()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm incident'}
          </Button>
        </div>
      )}

      {incident.investigatorConfirmedAt && (
        <p className="text-xs text-muted-foreground">
          Investigator confirmed{' '}
          {new Date(incident.investigatorConfirmedAt).toLocaleString('en-GH')}
        </p>
      )}

      {showStatusControl && (
        <div className="space-y-2">
          <Label>Incident status</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={statusDraft} onValueChange={setStatusDraft}>
              <SelectTrigger className="sm:flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
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
            {canRespond && !canManage
              ? ' · Emergency services can progress confirmed cases'
              : ''}
          </p>
        </div>
      )}

      {showPublicVerify && (
        <div className="space-y-2 pt-2 border-t">
          <Label>Public report verification</Label>
          <p className="text-xs text-muted-foreground">
            MTTD, Fire Services, Road Safety, Police, or Ambulance Service can confirm or reject
            citizen reports.
          </p>
          {incident.confirmationStatus && incident.confirmationStatus !== 'pending' ? (
            <p className="text-sm">
              {incident.confirmationStatus === 'confirmed' ? 'Confirmed' : 'Rejected'}
              {incident.confirmedByAgency ? ` by ${incident.confirmedByAgency}` : ''}
            </p>
          ) : isPublicPending || !incident.confirmationStatus ? (
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
          ) : null}
        </div>
      )}
    </div>
  );
}
