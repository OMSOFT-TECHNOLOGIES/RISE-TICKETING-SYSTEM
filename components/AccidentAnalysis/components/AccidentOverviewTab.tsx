import React from 'react';
import { Calendar, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { Accident, SeverityDistribution } from '../types';
import { formatAccidentDate } from '../utils';
import { SeverityBadge } from './SeverityBadge';

interface AccidentOverviewTabProps {
  accidents: Accident[];
  severityDistribution: SeverityDistribution[];
  onViewAccident: (accident: Accident) => void;
}

export function AccidentOverviewTab({
  accidents,
  severityDistribution,
  onViewAccident,
}: AccidentOverviewTabProps) {
  const recentAccidents = accidents.slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Recent Accidents</CardTitle>
          <CardDescription>Latest reports requiring attention</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentAccidents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No accidents recorded.</p>
          ) : (
            recentAccidents.map((accident) => (
              <button
                key={accident.id}
                type="button"
                onClick={() => onViewAccident(accident)}
                className="w-full text-left flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/40 transition-colors"
              >
                <span className="h-2 w-2 rounded-full bg-red-500 mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono text-sm font-medium">{accident.id}</span>
                    <SeverityBadge severity={accident.severity} />
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{accident.location}</p>
                  <p className="text-xs text-muted-foreground truncate">{accident.route}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatAccidentDate(accident.date)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {accident.injuries} injured
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Severity Distribution</CardTitle>
          <CardDescription>Breakdown by severity level</CardDescription>
        </CardHeader>
        <CardContent>
          {severityDistribution.length === 0 ? (
            <p className="text-sm text-muted-foreground py-16 text-center">
              No severity data available yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <RechartsPieChart>
                <Pie
                  data={severityDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ severity, percentage }) => `${severity}: ${percentage}%`}
                  outerRadius={85}
                  fill="#193cb8"
                  dataKey="count"
                >
                  {severityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
