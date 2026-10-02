import React from 'react';
import { BarChart3, MessageSquare, Star, ThumbsUp } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { DashboardStatCard } from '../../Dashboard/DashboardStatCard';
import type { FeedbackStats } from '../types';

interface FeedbackKpiDashboardProps {
  stats: FeedbackStats;
}

export function FeedbackKpiDashboard({ stats }: FeedbackKpiDashboardProps) {
  const pipelineTotal = Math.max(stats.totalComplaints, 1);
  const inProgress = Math.max(
    0,
    stats.totalComplaints - stats.pendingComplaints - stats.resolvedComplaints
  );
  const segments = [
    { label: 'Pending', value: stats.pendingComplaints, color: 'bg-amber-500' },
    { label: 'In progress', value: inProgress, color: 'bg-primary' },
    { label: 'Resolved', value: stats.resolvedComplaints, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-4 sm:p-5 ring-1 ring-border/40">
        <h2 className="text-sm font-semibold tracking-tight mb-4">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <DashboardStatCard
            title="Average rating"
            value={stats.avgRating.toFixed(1)}
            icon={Star}
            accent="amber"
            hint="Out of 5.0 maximum"
          />
          <DashboardStatCard
            title="Total ratings"
            value={stats.totalRatings}
            icon={ThumbsUp}
            accent="emerald"
            hint="Passenger submissions"
          />
          <DashboardStatCard
            title="Pending complaints"
            value={stats.pendingComplaints}
            icon={MessageSquare}
            accent="violet"
            hint="Awaiting response"
          />
          <DashboardStatCard
            title="Resolution rate"
            value={`${Math.round(stats.resolutionRate)}%`}
            icon={BarChart3}
            accent="blue"
            hint={`${stats.resolvedComplaints}/${stats.totalComplaints} resolved`}
          />
        </div>
      </section>

      {stats.totalComplaints > 0 ? (
        <Card className="rounded-2xl shadow-sm ring-1 ring-border/50 border-0">
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm font-semibold tracking-tight mb-3">Complaint pipeline</p>
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
              {segments.map((seg) =>
                seg.value > 0 ? (
                  <div
                    key={seg.label}
                    className={`${seg.color} transition-all`}
                    style={{ width: `${(seg.value / pipelineTotal) * 100}%` }}
                    title={`${seg.label}: ${seg.value}`}
                  />
                ) : null
              )}
            </div>
            <div className="flex flex-wrap gap-4 mt-3">
              {segments.map((seg) => (
                <div key={seg.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={`h-2 w-2 rounded-full ${seg.color}`} />
                  <span>{seg.label}</span>
                  <span className="font-medium text-foreground tabular-nums">{seg.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
