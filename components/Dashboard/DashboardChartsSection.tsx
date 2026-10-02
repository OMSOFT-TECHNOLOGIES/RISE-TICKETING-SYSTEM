import React from 'react';
import { Loader2, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import type { ChartPoint, RegionPoint } from './dashboardUtils';
import { REGION_COLORS } from './dashboardUtils';

type DashboardChartsSectionProps = {
  loading: boolean;
  chartData: ChartPoint[];
  regionData: RegionPoint[];
};

const chartGrid = 'rgba(148, 163, 184, 0.35)';
const chartMuted = '#64748b';

export function DashboardChartsSection({
  loading,
  chartData,
  regionData,
}: DashboardChartsSectionProps) {
  const hasChartRows = chartData.length > 0;
  const hasRegions = regionData.length > 0;

  if (loading) {
    return (
      <div className="rounded-xl border bg-card flex items-center justify-center py-20 shadow-sm">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  const emptyChartMessage = (
    <div className="flex flex-col items-center justify-center h-[280px] text-center px-4">
      <p className="text-sm font-medium">No data for this period</p>
      <p className="text-xs text-muted-foreground mt-1">
        Trips, tickets, and revenue in the selected range will appear here.
      </p>
    </div>
  );

  if (!hasChartRows && !hasRegions) {
    return (
      <div className="rounded-xl border bg-card px-5 py-10 text-center shadow-sm">
        <p className="text-sm font-medium">No chart data yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Analytics come from trips, passenger tickets, and completed revenue transactions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden ring-1 ring-border/50">
        <div className="flex items-center gap-2 border-b px-5 py-3.5">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Operations analytics</h3>
        </div>
        <div className="p-4 sm:p-5 grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3">Trips & revenue</p>
            {!hasChartRows ? (
              emptyChartMessage
            ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: chartMuted }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: chartMuted }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: chartMuted }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="trips"
                  stroke="#193cb8"
                  strokeWidth={2}
                  dot={false}
                  name="Trips"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  name="Revenue (₵)"
                />
              </LineChart>
            </ResponsiveContainer>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3">Passenger traffic</p>
            {!hasChartRows ? (
              emptyChartMessage
            ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: chartMuted }} />
                <YAxis tick={{ fontSize: 11, fill: chartMuted }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="passengers" fill="#193cb8" radius={[4, 4, 0, 0]} name="Passengers" />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden ring-1 ring-border/50">
        <div className="flex items-center gap-2 border-b px-5 py-3.5">
          <PieChartIcon className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Regional distribution</h3>
        </div>
        <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          {!hasRegions ? (
            emptyChartMessage
          ) : (
          <>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={regionData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={2}
              >
                {regionData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color ?? REGION_COLORS[index % REGION_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--popover))',
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <ul className="space-y-2.5">
            {regionData.map((region, index) => (
              <li
                key={region.name}
                className="flex items-center justify-between text-sm rounded-lg border bg-muted/30 px-3 py-2"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: region.color ?? REGION_COLORS[index % REGION_COLORS.length],
                    }}
                  />
                  <span className="truncate">{region.name}</span>
                </span>
                <span className="font-medium tabular-nums shrink-0 text-xs text-muted-foreground">
                  {region.trips != null
                    ? `${region.trips} trips${region.share != null ? ` · ${region.share}%` : ''}`
                    : `${region.value}`}
                </span>
              </li>
            ))}
          </ul>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
