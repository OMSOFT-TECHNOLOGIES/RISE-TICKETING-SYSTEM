import React from 'react';
import { CalendarDays } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { greetingForHour } from './dashboardUtils';

type Period = 'daily' | 'monthly' | 'yearly';

type DashboardWelcomeProps = {
  fullName?: string;
  subtitle: string;
  isAdmin: boolean;
  selectedPeriod: Period;
  onPeriodChange: (period: Period) => void;
  statsError?: string | null;
};

export function DashboardWelcome({
  fullName,
  subtitle,
  isAdmin,
  selectedPeriod,
  onPeriodChange,
  statsError,
}: DashboardWelcomeProps) {
  const greeting = greetingForHour(new Date().getHours());
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <section className="rounded-xl border bg-card px-5 py-4 shadow-sm sm:px-6 sm:py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{greeting}</p>
          <h2 className="text-lg font-semibold tracking-tight truncate">
            {fullName ?? 'Welcome'}
          </h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
          {statsError ? (
            <p className="text-xs text-destructive pt-1">{statsError}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:items-end shrink-0">
          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            {today}
          </div>
          {isAdmin ? (
            <Tabs
              value={selectedPeriod}
              onValueChange={(v) => onPeriodChange(v as Period)}
            >
              <TabsList className="h-8">
                <TabsTrigger value="daily" className="text-xs px-3">
                  Daily
                </TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs px-3">
                  Monthly
                </TabsTrigger>
                <TabsTrigger value="yearly" className="text-xs px-3">
                  Yearly
                </TabsTrigger>
              </TabsList>
            </Tabs>
          ) : null}
        </div>
      </div>
    </section>
  );
}
