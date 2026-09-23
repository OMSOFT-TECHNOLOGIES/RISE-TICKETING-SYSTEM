import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ComplaintCategoryItem, RatingDistributionItem } from '../types';

interface OverviewTabProps {
  ratingDistribution: RatingDistributionItem[];
  complaintCategories: ComplaintCategoryItem[];
}

export function OverviewTab({ ratingDistribution, complaintCategories }: OverviewTabProps) {

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Rating Distribution</CardTitle>
          <CardDescription>Breakdown of customer ratings</CardDescription>
        </CardHeader>
        <CardContent>
          {ratingDistribution.length === 0 ? (
            <p className="text-sm text-muted-foreground py-16 text-center">
              No rating data available yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={ratingDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ rating, percentage }) => `${rating}: ${percentage}%`}
                  outerRadius={85}
                  dataKey="count"
                >
                  {ratingDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Complaint Categories</CardTitle>
          <CardDescription>Most common complaint types</CardDescription>
        </CardHeader>
        <CardContent>
          {complaintCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground py-16 text-center">
              No complaint category data available yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={complaintCategories}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={90} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#193cb8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
