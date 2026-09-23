import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useAuth } from './AuthContext';
import { AccessRestricted } from './AccessRestricted';
import { notify } from './utils/notify';
import { feedbackApi } from './utils/api';
import { useEntityList } from './shared/hooks/useEntityList';
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
  filterComplaints,
  filterRatings,
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

  const fetchRatings = useCallback(
    () => feedbackApi.getRatings({ limit: 500, stationId: user?.stationId }),
    [user?.stationId]
  );
  const fetchComplaints = useCallback(
    () =>
      feedbackApi.getComplaints({
        limit: 500,
        stationId: user?.stationId,
      }),
    [user?.stationId]
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
  } = useEntityList<Rating>({
    fetchFn: fetchRatings,
    entityKey: 'ratings',
    errorMessage: 'Failed to load ratings',
  });

  const {
    items: complaints,
    loading: complaintsLoading,
    error: complaintsError,
    refresh: refreshComplaints,
    isSubmitting,
    setIsSubmitting,
  } = useEntityList<Complaint>({
    fetchFn: fetchComplaints,
    entityKey: 'complaints',
    errorMessage: 'Failed to load complaints',
  });

  const [ratingFilters, setRatingFilters] = useState<RatingFilters>({ search: '' });
  const [complaintFilters, setComplaintFilters] = useState<ComplaintFilters>({
    search: '',
    status: 'all',
    priority: 'all',
    category: 'all',
  });
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [responseText, setResponseText] = useState('');

  const loading = ratingsLoading || complaintsLoading;
  const error = ratingsError || complaintsError;

  const stats = useMemo(
    () => mergeStatsFromApi(calculateStats(ratings, complaints), apiStats),
    [ratings, complaints, apiStats]
  );
  const ratingDistribution = useMemo(
    () => mapApiRatingDistribution(apiRatingDistribution, buildRatingDistribution(ratings)),
    [ratings, apiRatingDistribution]
  );
  const complaintCategories = useMemo(
    () => mapApiComplaintCategories(apiComplaintCategories, buildComplaintCategories(complaints)),
    [complaints, apiComplaintCategories]
  );
  const ratingTrends = useMemo(
    () => mapApiRatingTrends(apiRatingTrends, buildRatingTrends(ratings)),
    [ratings, apiRatingTrends]
  );

  const filteredRatings = useMemo(
    () => filterRatings(ratings, ratingFilters),
    [ratings, ratingFilters]
  );

  const filteredComplaints = useMemo(
    () => filterComplaints(complaints, complaintFilters),
    [complaints, complaintFilters]
  );

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

  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return (
      <AccessRestricted message="Only administrators can access ratings and complaints management." />
    );
  }

  if (loading) {
    return (
      <div className="min-h-full bg-muted/30 flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#193cb8]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full bg-muted/30 flex flex-col items-center justify-center py-24 px-6 text-center">
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <button
          type="button"
          onClick={handleRetry}
          className="text-sm font-medium text-[#193cb8] hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-muted/30">
      <FeedbackCommandHeader
        stats={stats}
        onExportRatings={() => exportData('ratings')}
        onExportComplaints={() => exportData('complaints')}
      />

      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        <FeedbackKpiDashboard stats={stats} />

        <Card className="border shadow-none">
          <CardContent className="p-0">
            <Tabs defaultValue="overview" className="w-full">
              <div className="px-5 pt-5 pb-0 border-b">
                <TabsList className="grid w-full grid-cols-4 h-auto gap-1 bg-muted/50 p-1.5 rounded-lg border shadow-none">
                  <TabsTrigger value="overview" className={FEEDBACK_TAB_TRIGGER_CLASS}>
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="ratings" className={FEEDBACK_TAB_TRIGGER_CLASS}>
                    Ratings
                  </TabsTrigger>
                  <TabsTrigger value="complaints" className={FEEDBACK_TAB_TRIGGER_CLASS}>
                    Complaints
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className={FEEDBACK_TAB_TRIGGER_CLASS}>
                    Analytics
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-5">
                <TabsContent value="overview" className="mt-0">
                  <OverviewTab
                    ratingDistribution={ratingDistribution}
                    complaintCategories={complaintCategories}
                  />
                </TabsContent>

                <TabsContent value="ratings" className="mt-0">
                  <RatingsTab
                    ratings={filteredRatings}
                    filters={ratingFilters}
                    onFiltersChange={(updates) =>
                      setRatingFilters((prev) => ({ ...prev, ...updates }))
                    }
                    onExport={() => exportData('ratings')}
                  />
                </TabsContent>

                <TabsContent value="complaints" className="mt-0">
                  <ComplaintsTab
                    complaints={filteredComplaints}
                    filters={complaintFilters}
                    onFiltersChange={(updates) =>
                      setComplaintFilters((prev) => ({ ...prev, ...updates }))
                    }
                    onViewComplaint={handleViewComplaint}
                    onExport={() => exportData('complaints')}
                  />
                </TabsContent>

                <TabsContent value="analytics" className="mt-0">
                  <AnalyticsTab
                    stats={stats}
                    ratingTrends={ratingTrends}
                    complaintCategories={complaintCategories}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <ComplaintDetailSheet
        complaint={selectedComplaint}
        open={showDetail}
        responseText={responseText}
        onResponseTextChange={setResponseText}
        onOpenChange={setShowDetail}
        onSubmitResponse={handleResponseSubmit}
      />
    </div>
  );
}
