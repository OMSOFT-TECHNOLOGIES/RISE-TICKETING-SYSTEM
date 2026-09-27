import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from './AuthContext';
import { dashboardApi } from './utils/api';
import { UserActivityPanel } from './Dashboard/UserActivityPanel';
import { DashboardHero } from './Dashboard/DashboardHero';
import { DashboardPeriodBar } from './Dashboard/DashboardPeriodBar';
import { DashboardStatCard } from './Dashboard/DashboardStatCard';
import { DashboardChartsSection } from './Dashboard/DashboardChartsSection';
import { DashboardQuickActions } from './Dashboard/DashboardQuickActions';
import { DashboardActivityFeed } from './Dashboard/DashboardActivityFeed';
import { DashboardSystemStatus } from './Dashboard/DashboardSystemStatus';
import { DashboardWorkspace } from './Dashboard/DashboardWorkspace';
import {
  dashboardEyebrow,
  dashboardSubtitle,
  resolveDashboardLayout,
  resolveDashboardStatsSource,
  showExecutiveCharts,
  showSystemStatusPanel,
  statDefinitions,
  type Period,
} from './Dashboard/dashboardProfile';
import {
  formatStatValue,
  normalizeActivities,
  normalizeChartData,
  normalizeRegionData,
  type ActivityItem,
  type ChartPoint,
  type RegionPoint,
} from './Dashboard/dashboardUtils';

export function Dashboard() {
  const { user, isSuperAdmin, hasPermission } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('daily');

  const statsSource = resolveDashboardStatsSource(user?.role, hasPermission);
  const layout = resolveDashboardLayout(user?.role);
  const showCharts = showExecutiveCharts(statsSource);

  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [regionData, setRegionData] = useState<RegionPoint[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [statsRefreshing, setStatsRefreshing] = useState(false);
  const statsLoadedOnce = useRef(false);
  const [chartsLoading, setChartsLoading] = useState(showCharts);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      if (statsLoadedOnce.current) {
        setStatsRefreshing(true);
      }
      setStatsError(null);
      try {
        const response =
          statsSource === 'admin'
            ? await dashboardApi.getAdmin(selectedPeriod)
            : statsSource === 'station'
              ? await dashboardApi.getStation({
                  stationId: user?.stationId,
                  period: selectedPeriod,
                })
              : await dashboardApi.getOverview(selectedPeriod);

        if (!cancelled) {
          if (response.success && response.data) {
            setStats(response.data as Record<string, number>);
          } else {
            setStatsError(response.error ?? 'Failed to load dashboard stats');
            setStats(null);
          }
        }
      } catch {
        if (!cancelled) {
          setStatsError('Failed to load dashboard stats');
          setStats(null);
        }
      } finally {
        if (!cancelled) {
          statsLoadedOnce.current = true;
          setInitialLoading(false);
          setStatsRefreshing(false);
        }
      }
    };

    void loadStats();
    return () => {
      cancelled = true;
    };
  }, [statsSource, user?.stationId, selectedPeriod]);

  useEffect(() => {
    if (!showCharts) {
      setChartsLoading(false);
      setChartData([]);
      setRegionData([]);
      return;
    }

    let cancelled = false;

    const loadCharts = async () => {
      setChartsLoading(true);
      try {
        const [chartRes, regionRes] = await Promise.all([
          dashboardApi.getTripsRevenueChart({ period: selectedPeriod }),
          dashboardApi.getRegionsChart({ period: selectedPeriod }),
        ]);

        if (!cancelled) {
          if (chartRes.success) setChartData(normalizeChartData(chartRes.data));
          if (regionRes.success) setRegionData(normalizeRegionData(regionRes.data));
        }
      } finally {
        if (!cancelled) setChartsLoading(false);
      }
    };

    void loadCharts();
    return () => {
      cancelled = true;
    };
  }, [showCharts, selectedPeriod]);

  useEffect(() => {
    let cancelled = false;

    const loadActivities = async () => {
      const response = await dashboardApi.getActivities({
        limit: 10,
        stationId: statsSource === 'station' ? user?.stationId : undefined,
      });

      if (!cancelled && response.success && response.data !== undefined) {
        setActivities(normalizeActivities(response.data));
      }
    };

    void loadActivities();
    return () => {
      cancelled = true;
    };
  }, [statsSource, user?.stationId]);

  const statCards = useMemo(
    () => statDefinitions(statsSource, layout, selectedPeriod),
    [statsSource, layout, selectedPeriod]
  );

  const heroHighlight = useMemo(() => {
    if (!stats) return null;
    if (layout === 'safety' || statsSource === 'overview') {
      const open = stats.openIncidents ?? stats.activeIncidents ?? 0;
      return { label: 'Open incidents', value: open };
    }
    if (statsSource === 'station') {
      return { label: "Today's trips", value: stats.todayTrips ?? 0 };
    }
    if (statsSource === 'admin') {
      return { label: 'Active investigations', value: stats.activeIncidents ?? 0 };
    }
    return null;
  }, [stats, layout, statsSource]);

  const activeIncidents =
    stats?.activeIncidents ??
    stats?.openIncidents ??
    stats?.investigatingIncidents ??
    0;

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] p-6 bg-[var(--rise-surface)]/40">
        <Loader2 className="h-7 w-7 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[var(--rise-surface)]/40">
      <div className="p-4 sm:p-6 space-y-5 max-w-[1600px] mx-auto">
        <DashboardHero
          fullName={user?.fullName}
          eyebrow={dashboardEyebrow(layout)}
          subtitle={dashboardSubtitle(layout, {
            stationName: user?.stationName,
            region: user?.region,
            district: user?.district,
          })}
          layout={layout}
          statsError={statsError}
          highlight={heroHighlight}
        />

        <DashboardPeriodBar
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          refreshing={statsRefreshing || chartsLoading}
        />

        <div
          className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 transition-opacity ${statsRefreshing ? 'opacity-60 pointer-events-none' : ''}`}
        >
          {statCards.map((def) => (
            <DashboardStatCard
              key={def.key}
              title={def.title}
              value={formatStatValue(stats?.[def.key], def.format)}
              icon={def.icon}
              accent={def.accent}
            />
          ))}
        </div>

        <DashboardWorkspace />

        {isSuperAdmin() && (
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden [&>div]:border-0 [&>div]:shadow-none">
            <UserActivityPanel />
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-4">
            {showCharts && (
              <DashboardChartsSection
                loading={chartsLoading}
                chartData={chartData}
                regionData={regionData}
              />
            )}
            {showSystemStatusPanel(statsSource, layout) && (
              <DashboardSystemStatus activeIncidents={activeIncidents} />
            )}
          </div>
          <div className="space-y-4">
            <DashboardQuickActions layout={layout} />
            <DashboardActivityFeed activities={activities} />
          </div>
        </div>
      </div>
    </div>
  );
}
