import React from 'react';
import { Building2, MapPin, PlusCircle, Users } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import type { RevenueSource } from '../types';
import { formatCurrency, getStatusBadge } from '../utils';

interface RevenueSourcesSectionProps {
  sources: RevenueSource[];
  onAddSource: () => void;
}

const typeIcons = {
  station: Building2,
  union: Users,
  region: MapPin,
  district: Building2,
} as const;

export function RevenueSourcesSection({ sources, onAddSource }: RevenueSourcesSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Revenue Sources</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {sources.length} active source{sources.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <Button onClick={onAddSource} className="bg-[#193cb8] hover:bg-[#152f94]">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Source
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources.map((source) => {
          const Icon = typeIcons[source.type] ?? Building2;
          const progress = source.monthlyTarget > 0
            ? Math.min((source.totalContribution / source.monthlyTarget) * 100, 100)
            : 0;

          return (
            <Card key={source.id} className="border shadow-none hover:border-[#193cb8]/20 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-muted/60 p-2">
                      <Icon className="h-4 w-4 text-[#193cb8]" />
                    </div>
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground capitalize">
                      {source.type}
                    </span>
                  </div>
                  {getStatusBadge(source.status)}
                </div>

                <h4 className="font-medium leading-snug">{source.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {source.region}
                  {source.district ? ` · ${source.district}` : ''}
                </p>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contribution</span>
                    <span className="font-medium text-emerald-600 tabular-nums">
                      {formatCurrency(source.totalContribution)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly target</span>
                    <span className="font-medium tabular-nums">{formatCurrency(source.monthlyTarget)}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                    <span>Target progress</span>
                    <span className="tabular-nums">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t flex justify-between text-xs text-muted-foreground">
                  <span>{source.contactPerson}</span>
                  <span>{source.phone}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
