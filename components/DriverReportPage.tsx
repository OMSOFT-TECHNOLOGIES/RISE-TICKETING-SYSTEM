import React, { useEffect, useState } from 'react';
import { AlertTriangle, Shield } from 'lucide-react';
import { RisePreloader } from './shared/feedback';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { notify } from './utils/notify';
import { appEnv } from './utils/env';

const REPORT_LABELS: Record<string, string> = {
  overspeeding: 'Over speeding',
  reckless_overtaking: 'Reckless overtaking',
  drunk_driving: 'Drunk while driving',
  impaired_driving: 'Impaired driving',
  impatient: 'Impatient / aggressive driving',
};

interface DriverReportPageProps {
  token: string;
}

export function DriverReportPage({ token }: DriverReportPageProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<Record<string, unknown> | null>(null);
  const [category, setCategory] = useState('');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const base = appEnv.apiBaseUrl.replace(/\/$/, '');
        const res = await fetch(`${base}/api/public/driver-report/${encodeURIComponent(token)}`);
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json.success) {
          setError(json.message || json.error || 'This report link is invalid or expired.');
          setContext(null);
          return;
        }
        setContext(json.data as Record<string, unknown>);
      } catch {
        if (!cancelled) setError('Unable to load report form.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async () => {
    if (!category) {
      notify.error('Select a report type');
      return;
    }
    setSubmitting(true);
    try {
      const base = appEnv.apiBaseUrl.replace(/\/$/, '');
      const res = await fetch(`${base}/api/public/driver-report/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, details }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        notify.error(json.message || json.error || 'Failed to submit report');
        return;
      }
      setSubmitted(true);
      notify.success('Report submitted to RISE Ghana');
    } catch {
      notify.error('Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <RisePreloader variant="fullscreen" label="Loading report form…" showBrand />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Report unavailable
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{error}</CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <Shield className="h-5 w-5" />
              Thank you
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Your report was received. RISE Ghana and the Ministry of Transport partners will review it.
          </CardContent>
        </Card>
      </div>
    );
  }

  const categories = Array.isArray(context?.categories)
    ? (context.categories as string[])
    : Object.keys(REPORT_LABELS);

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Report driver conduct</CardTitle>
          <p className="text-sm text-muted-foreground">
            {String(context?.routeFrom ?? '')} → {String(context?.routeTo ?? '')}
            {context?.driver ? ` · Driver: ${String(context.driver)}` : ''}
          </p>
          <p className="text-xs text-muted-foreground">
            QR valid for 12 hours from ticket issue. Reports are confidential.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Issue type</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select concern" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((key) => (
                  <SelectItem key={key} value={key}>
                    {REPORT_LABELS[key] ?? key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Details (optional)</Label>
            <Textarea
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe what happened…"
            />
          </div>
          <Button
            className="w-full bg-[#193cb8] hover:bg-[#152f94]"
            disabled={submitting}
            onClick={() => void handleSubmit()}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit report'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
