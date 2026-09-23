import React from 'react';
import { AlertCircle, AlertTriangle, BarChart3, Users } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import type { AccidentStats } from '../types';
import { formatCurrency } from '../utils';

interface AccidentKpiDashboardProps {
  stats: AccidentStats;
}

const kpis = [
  { key: 'total' as const, label: 'Total Accidents', icon: AlertTriangle, accent: 'text-foreground', sub: '+2 this month' },
  { key: 'injuries' as const, label: 'Total Injuries', icon: Users, accent: 'text-orange-600', subKey: 'avgInjuries' as const, subSuffix: ' avg per incident' },
  { key: 'fatalities' as const, label: 'Fatalities', icon: AlertCircle, accent: 'text-red-600', subKey: 'fatalityRate' as const, subSuffix: '% fatality rate' },
  { key: 'totalCost' as const, label: 'Total Cost', icon: BarChart3, accent: 'text-[#193cb8]', subKey: 'avgCost' as const, subPrefix: '₵', subSuffix: ' avg cost', isCurrency: true },
];

export function AccidentKpiDashboard({ stats }: AccidentKpiDashboardProps) {
  const pending = stats.total > 0 ? Math.ceil(stats.total * 0.33) : 0;
  const investigating = stats.total > 0 ? Math.ceil(stats.total * 0.33) : 0;
  const closed = Math.max(stats.total - pending - investigating, 0);
  const pipelineTotal = Math.max(stats.total, 1);

  const segments = [
    { label: 'Pending', value: pending, color: 'bg-amber-500' },
    { label: 'Investigating', value: investigating, color: 'bg-[#193cb8]' },
    { label: 'Closed', value: closed, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ key, label, icon: Icon, accent, sub, subKey, subPrefix, subSuffix, isCurrency }) => {
          let subText = sub;
          if (subKey) {
            const val = stats[subKey];
            if (subKey === 'fatalityRate') {
              subText = `${val.toFixed(1)}${subSuffix ?? ''}`;
            } else if (isCurrency) {
              subText = `${formatCurrency(val as number)}${subSuffix ?? ''}`;
            } else {
              subText = `${subPrefix ?? ''}${val}${subSuffix ?? ''}`;
            }
          }

          const displayValue = key === 'totalCost' ? formatCurrency(stats.totalCost) : stats[key];

          return (
            <Card key={key} className="border shadow-none">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {label}
                    </p>
                    <p className={`text-3xl font-semibold tabular-nums mt-2 ${accent}`}>
                      {displayValue}
                    </p>
                    {subText && (
                      <p className="text-xs text-muted-foreground mt-1">{subText}</p>
                    )}
                  </div>
                  <div className="rounded-md bg-muted/60 p-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border shadow-none">
        <CardContent className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
            Investigation Pipeline
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
