import React from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { PageHeader } from '../../shared/PageHeader';
import { cn } from '../../ui/utils';
import type { FeedbackStats } from '../types';

interface FeedbackCommandHeaderProps {
  stats: FeedbackStats;
  onExportRatings: () => void;
  onExportComplaints: () => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export function FeedbackCommandHeader({
  stats,
  onExportRatings,
  onExportComplaints,
  onRefresh,
  loading = false,
}: FeedbackCommandHeaderProps) {
  return (
    <PageHeader
      title="Ratings & complaints"
      description="Monitor customer feedback, triage complaints, and track satisfaction across RISE stations."
      titleAddon={
        stats.pendingComplaints > 0 ? (
          <Badge variant="secondary" className="font-normal tabular-nums text-sm">
            {stats.pendingComplaints} pending
          </Badge>
        ) : undefined
      }
      actions={
        <>
          {onRefresh ? (
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
              <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
              Refresh
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={onExportRatings}>
            <Download className="h-4 w-4 mr-2" />
            Export ratings
          </Button>
          <Button variant="outline" size="sm" onClick={onExportComplaints}>
            <Download className="h-4 w-4 mr-2" />
            Export complaints
          </Button>
        </>
      }
    />
  );
}
