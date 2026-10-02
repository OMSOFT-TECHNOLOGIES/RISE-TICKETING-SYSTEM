import React, { useState } from 'react';
import { Fingerprint, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import {
  enrollPassengerBiometric,
  isBiometricSupported,
  type BiometricReference,
} from './biometricEnrollment';

interface BiometricCaptureProps {
  label?: string;
  subjectName: string;
  value?: BiometricReference;
  onChange: (reference: BiometricReference | undefined) => void;
  required?: boolean;
}

export function BiometricCapture({
  label = 'Biometric enrollment',
  subjectName,
  value,
  onChange,
  required = false,
}: BiometricCaptureProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const capture = async () => {
    setBusy(true);
    setError(null);
    try {
      const ref = await enrollPassengerBiometric(subjectName || 'Passenger');
      onChange(ref);
    } catch {
      setError('Could not complete biometric capture. Try again.');
      onChange(undefined);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2 rounded-lg border border-[#193cb8]/20 bg-[#193cb8]/5 p-4">
      <div className="flex items-center gap-2">
        <Fingerprint className="h-4 w-4 text-[#193cb8]" />
        <Label className="text-[#193cb8]">
          {label}
          {required ? ' *' : ''}
        </Label>
      </div>
      <p className="text-xs text-muted-foreground">
        {isBiometricSupported()
          ? 'Use device fingerprint / face unlock when prompted, or station scanner if configured.'
          : 'This browser will store a secure enrollment token for verification at claims time.'}
      </p>
      {value ? (
        <div className="flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Biometric enrolled for this passenger
        </div>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void capture()}>
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Capturing…
          </>
        ) : value ? (
          'Re-capture biometric'
        ) : (
          'Capture biometric'
        )}
      </Button>
    </div>
  );
}
