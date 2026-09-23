import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CauseAnalysisItem, TrendDataPoint } from '../types';
import { formatCurrency } from '../utils';

interface AccidentAnalyticsTabProps {
  accidentTrendsData: TrendDataPoint[];
  causeAnalysis: CauseAnalysisItem[];
}

export function AccidentAnalyticsTab({
  accidentTrendsData,
  causeAnalysis,
}: AccidentAnalyticsTabProps) {

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Accident Trends</CardTitle>
            <CardDescription>Monthly accident statistics</CardDescription>
          </CardHeader>
          <CardContent>
            {accidentTrendsData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-16 text-center">
                No trend data available yet.
              </p>
            ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={accidentTrendsData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="accidents"
                  stackId="1"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.5}
                  name="Accidents"
                />
                <Area
                  type="monotone"
                  dataKey="injuries"
                  stackId="2"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.5}
                  name="Injuries"
                />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Accident Causes</CardTitle>
            <CardDescription>Analysis of primary accident causes</CardDescription>
          </CardHeader>
          <CardContent>
            {causeAnalysis.length === 0 ? (
              <p className="text-sm text-muted-foreground py-16 text-center">
                No cause data available yet.
              </p>
            ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={causeAnalysis}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="cause" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#193cb8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Cost Impact Analysis</CardTitle>
          <CardDescription>Financial impact of accidents over time</CardDescription>
        </CardHeader>
        <CardContent>
          {accidentTrendsData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-16 text-center">
              No cost impact data available yet.
            </p>
          ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={accidentTrendsData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Cost']} />
              <Legend />
              <Line
                type="monotone"
                dataKey="cost"
                stroke="#193cb8"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                name="Total Cost"
              />
            </LineChart>
          </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
