import React from 'react';
import { BarChart3, MessageSquare, Star, ThumbsUp } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import type { FeedbackStats } from '../types';
import { StarRating } from './StarRating';

interface FeedbackKpiDashboardProps {
  stats: FeedbackStats;
}

export function FeedbackKpiDashboard({ stats }: FeedbackKpiDashboardProps) {
  const kpis = [
    {
      label: 'Average Rating',
      value: stats.avgRating.toFixed(1),
      sub: <StarRating rating={Math.round(stats.avgRating)} size="sm" />,
      icon: Star,
      accent: 'text-amber-600',
    },
    {
      label: 'Total Ratings',
      value: String(stats.totalRatings),
      sub: '+12% this month',
      subClass: 'text-emerald-600',
      icon: ThumbsUp,
      accent: 'text-foreground',
    },
    {
      label: 'Pending Complaints',
      value: String(stats.pendingComplaints),
      sub: 'Need attention',
      subClass: 'text-amber-600',
      icon: MessageSquare,
      accent: 'text-amber-600',
    },
    {
      label: 'Resolution Rate',
      value: `${Math.round(stats.resolutionRate)}%`,
      sub: `${stats.resolvedComplaints}/${stats.totalComplaints} resolved`,
      subClass: 'text-emerald-600',
      icon: BarChart3,
      accent: 'text-[#193cb8]',
    },
  ];

  const pipelineTotal = Math.max(stats.totalComplaints, 1);
  const segments = [
    { label: 'Pending', value: stats.pendingComplaints, color: 'bg-amber-500' },
    {
      label: 'In Progress',
      value: stats.totalComplaints - stats.pendingComplaints - stats.resolvedComplaints,
      color: 'bg-[#193cb8]',
    },
    { label: 'Resolved', value: stats.resolvedComplaints, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, subClass, icon: Icon, accent }) => (
          <Card key={label} className="border shadow-none">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                  </p>
                  <p className={`text-3xl font-semibold tabular-nums mt-2 ${accent}`}>{value}</p>
                  {sub && (
                    <div className={`text-xs mt-1 ${subClass ?? ''}`}>{sub}</div>
                  )}
                </div>
                <div className="rounded-md bg-muted/60 p-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border shadow-none">
        <CardContent className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
            Complaint Pipeline
          </p>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
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
    </div>
  );
}
