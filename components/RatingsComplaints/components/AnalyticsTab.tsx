import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Progress } from '../../ui/progress';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ComplaintCategoryItem, FeedbackStats, RatingTrendPoint } from '../types';

interface AnalyticsTabProps {
  stats: FeedbackStats;
  ratingTrends: RatingTrendPoint[];
  complaintCategories: ComplaintCategoryItem[];
}

export function AnalyticsTab({ stats, ratingTrends, complaintCategories }: AnalyticsTabProps) {

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl shadow-sm ring-1 ring-border/50 border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Rating Trends</CardTitle>
          <CardDescription>Average rating and volume over time</CardDescription>
        </CardHeader>
        <CardContent>
          {ratingTrends.length === 0 ? (
            <p className="text-sm text-muted-foreground py-16 text-center">
              No rating trend data available yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={ratingTrends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" domain={[0, 5]} tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="avgRating"
                  stroke="#193cb8"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  name="Average Rating"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="totalRatings"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Total Ratings"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl shadow-sm ring-1 ring-border/50 border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Performance Insights</CardTitle>
            <CardDescription>Key customer experience indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Customer Satisfaction</span>
                <span className="font-semibold tabular-nums">{Math.round(stats.satisfactionRate)}%</span>
              </div>
              <Progress value={Math.round(stats.satisfactionRate)} className="h-1.5" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Complaint Resolution Time</span>
                <span className="font-semibold">2.3 days</span>
              </div>
              <Progress value={85} className="h-1.5" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Response Rate</span>
                <span className="font-semibold tabular-nums">{Math.round(stats.resolutionRate)}%</span>
              </div>
              <Progress value={Math.round(stats.resolutionRate)} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm ring-1 ring-border/50 border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Top Issues</CardTitle>
            <CardDescription>Most common complaint categories</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {complaintCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No complaint category data available yet.
              </p>
            ) : (
              complaintCategories.slice(0, 5).map((category) => (
                <div key={category.category} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />
                    <span>{category.category}</span>
                  </div>
                  <span className="font-semibold tabular-nums">{category.count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
