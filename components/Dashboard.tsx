import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RisePreloader } from './shared/feedback';
import { useAuth } from './AuthContext';
import { dashboardApi, tripApi } from './utils/api';
import { UserActivityPanel } from './Dashboard/UserActivityPanel';
import { DashboardHero } from './Dashboard/DashboardHero';
import { DashboardPeriodBar } from './Dashboard/DashboardPeriodBar';
import { DashboardStatCard } from './Dashboard/DashboardStatCard';
import { DashboardChartsSection } from './Dashboard/DashboardChartsSection';
import { DashboardQuickActions } from './Dashboard/DashboardQuickActions';
import { DashboardActivityFeed } from './Dashboard/DashboardActivityFeed';
import { DashboardSystemStatus } from './Dashboard/DashboardSystemStatus';
import { DashboardWorkspace } from './Dashboard/DashboardWorkspace';
import { DashboardTripOperations } from './Dashboard/DashboardTripOperations';
import {
  dashboardEyebrow,
  dashboardSubtitle,
  resolveDashboardLayout,
  resolveDashboardStatsSource,
  showExecutiveCharts,
  showSystemStatusPanel,
  statDefinitions,
  showStationCommissionMetric,
  type Period,
} from './Dashboard/dashboardProfile';
import {
  dashboardPeriodNavigationEnabled,
  resolveDashboardPeriodBounds,
} from './Dashboard/dashboardPeriodRange';
import { computeStationCommissionForPeriod } from './Dashboard/dashboardStationCommission';
import {
  fetchGeoScopedDashboardRaw,
  hasGeoDashboardScope,
} from './Dashboard/dashboardScopedStats';
import {
  dashboardScopeForUser,
  dashboardScopeLabel,
  filterRegionChartForScope,
  shouldScopeDashboardByUserRole,
} from './Dashboard/dashboardScope';
import {
  formatStatValue,
  mergeDashboardStatPayloads,
  normalizeActivities,
  normalizeChartData,
  normalizeDashboardStats,
  normalizeRegionData,
  type ActivityItem,
  type ChartPoint,
  type RegionPoint,
} from './Dashboard/dashboardUtils';

export function Dashboard() {
  const { user, isSuperAdmin, hasPermission } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('daily');
  const [periodOffset, setPeriodOffset] = useState(0);

  const statsSource = resolveDashboardStatsSource(user?.role, hasPermission);
  const periodBounds = useMemo(
    () => resolveDashboardPeriodBounds(selectedPeriod, periodOffset),
    [selectedPeriod, periodOffset]
  );
  const showPeriodNavigation = dashboardPeriodNavigationEnabled(statsSource);
  const layout = resolveDashboardLayout(user?.role);
  const showCharts = showExecutiveCharts(statsSource);
  const dashboardScope = useMemo(() => dashboardScopeForUser(user), [user]);
  const scopeLabel = useMemo(() => dashboardScopeLabel(dashboardScope), [dashboardScope]);

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
        if (
          shouldScopeDashboardByUserRole(user?.role) &&
          !dashboardScope.region &&
          !dashboardScope.district &&
          !dashboardScope.stationId
        ) {
          if (!cancelled) {
            setStatsError(
              'Your account has no region or district assigned — dashboard cannot be scoped to your area.'
            );
            setStats(null);
          }
          return;
        }

        if (statsSource === 'station') {
          const stationId = user?.stationId?.trim();
          if (!stationId) {
            if (!cancelled) {
              setStatsError('Your account has no station assigned — station KPIs unavailable.');
              setStats(null);
            }
            return;
          }

          const rangeQuery = {
            period: selectedPeriod,
            from: periodBounds.from,
            to: periodBounds.to,
            date: periodBounds.date,
            ...dashboardScope,
          };

          const [dashboardRes, tripStatsRes] = await Promise.all([
            dashboardApi.getStation({ stationId, ...rangeQuery }),
            tripApi.getStatistics({ stationId, ...rangeQuery }),
          ]);

          if (!cancelled) {
            if (dashboardRes.success && dashboardRes.data) {
              const merged = mergeDashboardStatPayloads(
                dashboardRes.data,
                tripStatsRes.success ? tripStatsRes.data : null
              );
              let normalized = normalizeDashboardStats(merged, selectedPeriod, 'station');
              if (showStationCommissionMetric(user?.role)) {
                const computed = await computeStationCommissionForPeriod({
                  stationId,
                  period: selectedPeriod,
                  periodOffset,
                });
                normalized = { ...normalized, stationCommission: computed };
              }
              setStats(normalized);
            } else {
              setStatsError(
                dashboardRes.error ?? 'Failed to load station dashboard stats'
              );
              setStats(null);
            }
          }
          return;
        }

        const rangeQuery = {
          period: selectedPeriod,
          from: periodBounds.from,
          to: periodBounds.to,
          date: periodBounds.date,
          ...dashboardScope,
        };

        const response =
          statsSource === 'admin'
            ? await dashboardApi.getAdmin(rangeQuery)
            : await dashboardApi.getOverview(rangeQuery);

        let mergedPayload: unknown = response.success ? response.data : null;
        if (hasGeoDashboardScope(dashboardScope)) {
          const scopedRaw = await fetchGeoScopedDashboardRaw(dashboardScope, rangeQuery);
          mergedPayload = mergeDashboardStatPayloads(mergedPayload, scopedRaw);
        }

        if (!cancelled) {
          if (mergedPayload) {
            setStats(
              normalizeDashboardStats(mergedPayload, selectedPeriod, statsSource)
            );
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
  }, [
    statsSource,
    user?.stationId,
    user?.role,
    user?.region,
    user?.district,
    selectedPeriod,
    periodOffset,
    periodBounds,
    dashboardScope,
  ]);

  const handlePeriodChange = (period: Period) => {
    setSelectedPeriod(period);
    setPeriodOffset(0);
  };

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
        const chartScope = {
          period: selectedPeriod,
          from: periodBounds.from,
          to: periodBounds.to,
          ...dashboardScope,
        };

        const [chartRes, regionRes] = await Promise.all([
          dashboardApi.getTripsRevenueChart(chartScope),
          dashboardApi.getRegionsChart(chartScope),
        ]);

        if (!cancelled) {
          if (chartRes.success) setChartData(normalizeChartData(chartRes.data));
          if (regionRes.success) {
            const normalized = normalizeRegionData(regionRes.data);
            setRegionData(filterRegionChartForScope(normalized, dashboardScope));
          }
        }
      } finally {
        if (!cancelled) setChartsLoading(false);
      }
    };

    void loadCharts();
    return () => {
      cancelled = true;
    };
  }, [showCharts, selectedPeriod, periodBounds.from, periodBounds.to, dashboardScope]);

  useEffect(() => {
    let cancelled = false;

    const loadActivities = async () => {
      const response = await dashboardApi.getActivities({
        limit: 10,
        ...(statsSource === 'station' && user?.stationId
          ? { stationId: user.stationId }
          : dashboardScope),
      });

      if (!cancelled && response.success && response.data !== undefined) {
        setActivities(normalizeActivities(response.data));
      }
    };

    void loadActivities();
    return () => {
      cancelled = true;
    };
  }, [statsSource, user?.stationId, dashboardScope]);

  const statCards = useMemo(
    () =>
      statDefinitions(statsSource, layout, selectedPeriod, {
        role: user?.role,
        periodOffset,
      }),
    [statsSource, layout, selectedPeriod, user?.role, periodOffset]
  );

  const showStationCommission = showStationCommissionMetric(user?.role);

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
      <RisePreloader
        variant="page"
        label="Loading your dashboard…"
        className="min-h-[420px] bg-[var(--rise-surface)]/40"
      />
    );
  }

  return (
    <div className="min-h-full rise-dashboard-page">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
        <DashboardHero
          fullName={user?.fullName}
          eyebrow={dashboardEyebrow(layout)}
          subtitle={dashboardSubtitle(layout, {
            stationName: user?.stationName,
            region: user?.region,
            district: user?.district,
            role: user?.role,
            scopeLabel,
          })}
          layout={layout}
          statsError={statsError}
          highlight={heroHighlight}
        />

        <DashboardPeriodBar
          selectedPeriod={selectedPeriod}
          onPeriodChange={handlePeriodChange}
          periodOffset={periodOffset}
          showPeriodNavigation={showPeriodNavigation}
          onPeriodStepBack={() => setPeriodOffset((n) => n + 1)}
          onPeriodStepForward={() => setPeriodOffset((n) => Math.max(0, n - 1))}
          refreshing={statsRefreshing || chartsLoading}
        />

        {statsSource === 'admin' ? (
          <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-4 sm:p-5 ring-1 ring-border/40">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold tracking-tight">Key performance indicators</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Network-wide metrics · synced with your selected time range
                </p>
              </div>
            </div>
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 transition-opacity duration-200 ${statsRefreshing ? 'opacity-55 pointer-events-none' : ''}`}
            >
              {statCards.map((def) => (
                <DashboardStatCard
                  key={def.key}
                  title={def.title}
                  value={formatStatValue(stats?.[def.key], def.format)}
                  icon={def.icon}
                  accent={def.accent}
                  hint={def.hint}
                />
              ))}
            </div>
          </div>
        ) : (
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity duration-200 ${statsRefreshing ? 'opacity-55 pointer-events-none' : ''}`}
        >
          {statCards.map((def) => (
            <DashboardStatCard
              key={def.key}
              title={def.title}
              value={formatStatValue(stats?.[def.key], def.format)}
              icon={def.icon}
              accent={def.accent}
              hint={def.hint}
            />
          ))}
        </div>
        )}

        {layout === 'station' && (
          <DashboardTripOperations
            stats={stats}
            periodBounds={periodBounds}
            showCommission={showStationCommission}
            periodOffset={periodOffset}
          />
        )}

        <DashboardWorkspace />

        {isSuperAdmin() && (
          <section className="rounded-2xl border bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden ring-1 ring-border/60">
            <UserActivityPanel />
          </section>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
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
