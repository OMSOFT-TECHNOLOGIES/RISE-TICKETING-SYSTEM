import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, LayoutGrid, MessageSquare, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useAuth } from './AuthContext';
import { AccessRestricted } from './AccessRestricted';
import { notify } from './utils/notify';
import { feedbackApi } from './utils/api';
import { usePaginatedEntityList } from './shared/hooks/usePaginatedEntityList';
import { RisePreloader, RiseStatusAlert } from './shared/feedback';
import { FEEDBACK_TAB_TRIGGER_CLASS } from './RatingsComplaints/constants';
import type {
  Complaint,
  ComplaintFilters,
  Rating,
  RatingFilters,
} from './RatingsComplaints/types';
import {
  buildComplaintCategories,
  buildRatingDistribution,
  buildRatingTrends,
  calculateStats,
  mapApiComplaintCategories,
  mapApiRatingDistribution,
  mapApiRatingTrends,
  mergeStatsFromApi,
} from './RatingsComplaints/utils';
import { FeedbackCommandHeader } from './RatingsComplaints/components/FeedbackCommandHeader';
import { FeedbackKpiDashboard } from './RatingsComplaints/components/FeedbackKpiDashboard';
import { OverviewTab } from './RatingsComplaints/components/OverviewTab';
import { RatingsTab } from './RatingsComplaints/components/RatingsTab';
import { ComplaintsTab } from './RatingsComplaints/components/ComplaintsTab';
import { AnalyticsTab } from './RatingsComplaints/components/AnalyticsTab';
import { ComplaintDetailSheet } from './RatingsComplaints/components/ComplaintDetailSheet';

export function RatingsComplaints() {
  const { user } = useAuth();

  const [ratingFilters, setRatingFilters] = useState<RatingFilters>({ search: '' });
  const [complaintFilters, setComplaintFilters] = useState<ComplaintFilters>({
    search: '',
    status: 'all',
    priority: 'all',
    category: 'all',
  });

  const fetchRatingsPage = useCallback(
    (page: number, limit: number) =>
      feedbackApi.getRatings({
        page,
        limit,
        stationId: user?.stationId,
        search: ratingFilters.search.trim() || undefined,
      }),
    [user?.stationId, ratingFilters.search]
  );

  const fetchComplaintsPage = useCallback(
    (page: number, limit: number) =>
      feedbackApi.getComplaints({
        page,
        limit,
        stationId: user?.stationId,
        search: complaintFilters.search.trim() || undefined,
        status: complaintFilters.status,
        priority: complaintFilters.priority,
        category: complaintFilters.category,
      }),
    [user?.stationId, complaintFilters]
  );

  const [apiStats, setApiStats] = useState<Record<string, unknown> | null>(null);
  const [apiRatingTrends, setApiRatingTrends] = useState<unknown>(null);
  const [apiRatingDistribution, setApiRatingDistribution] = useState<unknown>(null);
  const [apiComplaintCategories, setApiComplaintCategories] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const stationParams = user?.stationId ? { stationId: user.stationId } : undefined;
      const [statsRes, trendsRes, distributionRes, categoriesRes] = await Promise.all([
        feedbackApi.getStatistics(stationParams),
        feedbackApi.getRatingTrends(),
        feedbackApi.getRatingDistribution(stationParams),
        feedbackApi.getComplaintCategories(stationParams),
      ]);

      if (cancelled) return;

      if (statsRes.success && statsRes.data && typeof statsRes.data === 'object') {
        setApiStats(statsRes.data as Record<string, unknown>);
      }
      if (trendsRes.success) setApiRatingTrends(trendsRes.data);
      if (distributionRes.success) setApiRatingDistribution(distributionRes.data);
      if (categoriesRes.success) setApiComplaintCategories(categoriesRes.data);
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.stationId]);

  const {
    items: ratings,
    loading: ratingsLoading,
    error: ratingsError,
    refresh: refreshRatings,
    page: ratingsPage,
    setPage: setRatingsPage,
    pagination: ratingsPagination,
    pageSize: ratingsPageSize,
    setPageSize: setRatingsPageSize,
  } = usePaginatedEntityList<Rating>({
    fetchFn: fetchRatingsPage,
    entityKey: 'ratings',
    errorMessage: 'Failed to load ratings',
    resetPageDeps: [ratingFilters.search],
  });

  const {
    items: complaints,
    loading: complaintsLoading,
    error: complaintsError,
    refresh: refreshComplaints,
    isSubmitting,
    setIsSubmitting,
    page: complaintsPage,
    setPage: setComplaintsPage,
    pagination: complaintsPagination,
    pageSize: complaintsPageSize,
    setPageSize: setComplaintsPageSize,
  } = usePaginatedEntityList<Complaint>({
    fetchFn: fetchComplaintsPage,
    entityKey: 'complaints',
    errorMessage: 'Failed to load complaints',
    resetPageDeps: [
      complaintFilters.search,
      complaintFilters.status,
      complaintFilters.priority,
      complaintFilters.category,
    ],
  });

  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [responseText, setResponseText] = useState('');

  const loading = ratingsLoading || complaintsLoading;
  const error = ratingsError || complaintsError;
  const hasAnyData = ratings.length > 0 || complaints.length > 0;

  const stats = useMemo(
    () => mergeStatsFromApi(calculateStats(ratings, complaints), apiStats),
    [ratings, complaints, apiStats]
  );

  const ratingDistribution = useMemo(() => {
    if (ratings.length === 0) return [];
    return mapApiRatingDistribution(apiRatingDistribution, buildRatingDistribution(ratings));
  }, [ratings, apiRatingDistribution]);

  const complaintCategories = useMemo(() => {
    if (complaints.length === 0) return [];
    return mapApiComplaintCategories(apiComplaintCategories, buildComplaintCategories(complaints));
  }, [complaints, apiComplaintCategories]);

  const ratingTrends = useMemo(() => {
    if (ratings.length === 0) return [];
    return mapApiRatingTrends(apiRatingTrends, buildRatingTrends(ratings)).filter(
      (point) => point.totalRatings > 0
    );
  }, [ratings, apiRatingTrends]);

  const handleViewComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setResponseText('');
    setShowDetail(true);
  };

  const handleResponseSubmit = async () => {
    if (!responseText.trim()) {
      notify.error('Please enter a response');
      return;
    }

    if (!selectedComplaint) return;

    setIsSubmitting(true);
    try {
      const response = await feedbackApi.respondToComplaint(selectedComplaint.id, {
        response: responseText,
        status: 'resolved',
      });

      if (response.success) {
        setResponseText('');
        setShowDetail(false);
        setSelectedComplaint(null);
        notify.success('Response sent successfully');
        await refreshComplaints();
      } else {
        notify.error(response.error || 'Failed to send response');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportData = async (type: 'ratings' | 'complaints') => {
    const response = await feedbackApi.export({ type, format: 'csv' });
    if (response.success) {
      notify.success(`${type.charAt(0).toUpperCase() + type.slice(1)} export completed`);
    } else {
      notify.error(response.error || 'Export failed');
    }
  };

  const handleRetry = () => {
    refreshRatings({ toastOnError: true });
    refreshComplaints({ toastOnError: true });
  };

  const handleRefresh = () => {
    handleRetry();
  };

  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return (
      <AccessRestricted message="Only administrators can access ratings and complaints management." />
    );
  }

  if (loading && !hasAnyData && !error) {
    return (
      <div className="p-6 min-h-[420px] rise-dashboard-page">
        <RisePreloader variant="page" label="Loading feedback…" />
      </div>
    );
  }

  return (
    <div className="min-h-full rise-dashboard-page">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <FeedbackCommandHeader
          stats={stats}
          onExportRatings={() => void exportData('ratings')}
          onExportComplaints={() => void exportData('complaints')}
          onRefresh={handleRefresh}
          loading={loading}
        />

        {error && !hasAnyData ? (
          <RiseStatusAlert type="error" title="Could not load feedback">
            {error}
            <Button variant="outline" size="sm" className="mt-3" onClick={handleRetry}>
              Try again
            </Button>
          </RiseStatusAlert>
        ) : null}

        {error && hasAnyData && !loading ? (
          <RiseStatusAlert type="warning" title="Some feedback data may be incomplete">
            {error}
          </RiseStatusAlert>
        ) : null}

        {stats.pendingComplaints > 0 ? (
          <RiseStatusAlert type="warning" title="Complaints awaiting response">
            {stats.pendingComplaints} complaint{stats.pendingComplaints !== 1 ? 's' : ''} need
            attention. Open the Complaints tab to review and respond.
          </RiseStatusAlert>
        ) : null}

        <FeedbackKpiDashboard stats={stats} />

        <Card className="rounded-2xl shadow-sm ring-1 ring-border/50 overflow-hidden border-0">
          <Tabs defaultValue="overview" className="w-full">
            <CardHeader className="border-b border-border/60 bg-muted/20 pb-4 space-y-4">
              <div>
                <CardTitle className="text-lg font-semibold">Feedback workspace</CardTitle>
                <CardDescription className="mt-1">
                  Overview charts, ratings registry, complaint queue, and analytics.
                </CardDescription>
              </div>
              <div className="rise-segment-tabs w-full overflow-x-auto">
                <TabsList className="grid w-full min-w-[640px] grid-cols-4">
                  <TabsTrigger value="overview" className={FEEDBACK_TAB_TRIGGER_CLASS}>
                    <LayoutGrid className="h-4 w-4 shrink-0 opacity-80 hidden sm:block" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="ratings" className={FEEDBACK_TAB_TRIGGER_CLASS}>
                    <Star className="h-4 w-4 shrink-0 opacity-80 hidden sm:block" />
                    Ratings
                    <span className="rise-segment-tab-count">
                      {ratingsPagination?.totalItems ?? ratings.length}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="complaints" className={FEEDBACK_TAB_TRIGGER_CLASS}>
                    <MessageSquare className="h-4 w-4 shrink-0 opacity-80 hidden sm:block" />
                    Complaints
                    <span className="rise-segment-tab-count">
                      {complaintsPagination?.totalItems ?? complaints.length}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className={FEEDBACK_TAB_TRIGGER_CLASS}>
                    <BarChart3 className="h-4 w-4 shrink-0 opacity-80 hidden sm:block" />
                    Analytics
                  </TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
              <TabsContent value="overview" className="mt-0">
                <OverviewTab
                  ratingDistribution={ratingDistribution}
                  complaintCategories={complaintCategories}
                />
              </TabsContent>

              <TabsContent value="ratings" className="mt-0">
                <RatingsTab
                  ratings={ratings}
                  filters={ratingFilters}
                  onFiltersChange={(updates) =>
                    setRatingFilters((prev) => ({ ...prev, ...updates }))
                  }
                  onExport={() => void exportData('ratings')}
                  page={ratingsPage}
                  pagination={ratingsPagination}
                  onPageChange={setRatingsPage}
                  pageSize={ratingsPageSize}
                  onPageSizeChange={setRatingsPageSize}
                  loading={ratingsLoading}
                />
              </TabsContent>

              <TabsContent value="complaints" className="mt-0">
                <ComplaintsTab
                  complaints={complaints}
                  filters={complaintFilters}
                  onFiltersChange={(updates) =>
                    setComplaintFilters((prev) => ({ ...prev, ...updates }))
                  }
                  onViewComplaint={handleViewComplaint}
                  onExport={() => void exportData('complaints')}
                  page={complaintsPage}
                  pagination={complaintsPagination}
                  onPageChange={setComplaintsPage}
                  pageSize={complaintsPageSize}
                  onPageSizeChange={setComplaintsPageSize}
                  loading={complaintsLoading}
                />
              </TabsContent>

              <TabsContent value="analytics" className="mt-0">
                <AnalyticsTab
                  stats={stats}
                  ratingTrends={ratingTrends}
                  complaintCategories={complaintCategories}
                />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      <ComplaintDetailSheet
        complaint={selectedComplaint}
        open={showDetail}
        responseText={responseText}
        onResponseTextChange={setResponseText}
        onOpenChange={setShowDetail}
        onSubmitResponse={() => void handleResponseSubmit()}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
