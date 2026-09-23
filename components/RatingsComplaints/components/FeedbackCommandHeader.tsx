import React from 'react';
import { Download, MessageSquare } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import type { FeedbackStats } from '../types';

interface FeedbackCommandHeaderProps {
  stats: FeedbackStats;
  onExportRatings: () => void;
  onExportComplaints: () => void;
}

export function FeedbackCommandHeader({
  stats,
  onExportRatings,
  onExportComplaints,
}: FeedbackCommandHeaderProps) {
  return (
    <div className="border-b bg-background">
      <div className="max-w-[1600px] mx-auto px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span>Customer Experience</span>
              <span className="text-border">/</span>
              <span className="text-foreground">Feedback Center</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Ratings &amp; Complaints
              </h1>
              {stats.pendingComplaints > 0 && (
                <Badge variant="secondary" className="font-normal gap-1.5">
                  <MessageSquare className="h-3 w-3 text-amber-600" />
                  {stats.pendingComplaints} pending
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground max-w-xl">
              Monitor customer feedback, triage complaints, and track satisfaction across all RISE stations.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" onClick={onExportRatings}>
              <Download className="h-4 w-4 mr-2" />
              Export Ratings
            </Button>
            <Button variant="outline" onClick={onExportComplaints}>
              <Download className="h-4 w-4 mr-2" />
              Export Complaints
            </Button>
          </div>
        </div>

        {stats.pendingComplaints > 0 && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-200/80 bg-amber-50/50 px-4 py-3">
            <MessageSquare className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                {stats.pendingComplaints} complaint{stats.pendingComplaints !== 1 ? 's' : ''} awaiting response
              </p>
              <p className="text-xs text-amber-700/80 mt-0.5">
                Review and respond to maintain customer satisfaction.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
