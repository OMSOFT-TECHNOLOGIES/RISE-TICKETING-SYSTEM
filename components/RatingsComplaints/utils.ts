import type {
  Complaint,
  ComplaintCategoryItem,
  ComplaintFilters,
  FeedbackStats,
  Rating,
  RatingDistributionItem,
  RatingFilters,
  RatingTrendPoint,
} from './types';
import { COMPLAINT_CATEGORIES } from './constants';

const CATEGORY_COLORS = ['#193cb8', '#ef4444', '#f59e0b', '#22c55e', '#8b5cf6', '#64748b', '#ec4899', '#06b6d4'];

const RATING_COLORS: Record<number, string> = {
  1: '#ef4444',
  2: '#f59e0b',
  3: '#eab308',
  4: '#22c55e',
  5: '#193cb8',
};

export function calculateStats(ratings: Rating[], complaints: Complaint[]): FeedbackStats {
  const totalRatings = ratings.length;
  const avgRating = totalRatings
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
    : 0;
  const totalComplaints = complaints.length;
  const pendingComplaints = complaints.filter((c) => c.status === 'pending').length;
  const resolvedComplaints = complaints.filter((c) => c.status === 'resolved').length;

  return {
    totalRatings,
    avgRating,
    totalComplaints,
    pendingComplaints,
    resolvedComplaints,
    resolutionRate: totalComplaints ? (resolvedComplaints / totalComplaints) * 100 : 0,
    satisfactionRate: totalRatings
      ? (ratings.filter((r) => r.rating >= 4).length / totalRatings) * 100
      : 0,
  };
}

export function filterRatings(ratings: Rating[], filters: RatingFilters): Rating[] {
  const term = filters.search.toLowerCase();
  if (!term) return ratings;

  return ratings.filter(
    (r) =>
      r.passengerName.toLowerCase().includes(term) ||
      r.route.toLowerCase().includes(term) ||
      r.ticketId.toLowerCase().includes(term) ||
      r.driver.toLowerCase().includes(term)
  );
}

export function filterComplaints(complaints: Complaint[], filters: ComplaintFilters): Complaint[] {
  const term = filters.search.toLowerCase();

  return complaints.filter((complaint) => {
    const matchesSearch =
      !term ||
      complaint.passengerName.toLowerCase().includes(term) ||
      complaint.route.toLowerCase().includes(term) ||
      complaint.description.toLowerCase().includes(term) ||
      complaint.ticketId.toLowerCase().includes(term);

    const matchesStatus = filters.status === 'all' || complaint.status === filters.status;
    const matchesPriority = filters.priority === 'all' || complaint.priority === filters.priority;
    const matchesCategory = filters.category === 'all' || complaint.category === filters.category;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });
}

export function getCategoryLabel(category: string): string {
  return COMPLAINT_CATEGORIES.find((c) => c.value === category)?.label ?? category.replace(/_/g, ' ');
}

export function buildComplaintCategories(complaints: Complaint[]): ComplaintCategoryItem[] {
  const counts = new Map<string, number>();

  for (const complaint of complaints) {
    const category = complaint.category || 'other';
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([category, count], index) => ({
      category: getCategoryLabel(category),
      count,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }))
    .sort((a, b) => b.count - a.count);
}

export function buildRatingDistribution(ratings: Rating[]): RatingDistributionItem[] {
  const total = ratings.length;
  if (total === 0) return [];

  const counts = new Map<number, number>();
  for (const rating of ratings) {
    const stars = Math.min(5, Math.max(1, Math.round(rating.rating)));
    counts.set(stars, (counts.get(stars) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort(([a], [b]) => a - b)
    .map(([stars, count]) => ({
      rating: `${stars} Star${stars === 1 ? '' : 's'}`,
      count,
      percentage: Math.round((count / total) * 100),
      color: RATING_COLORS[stars] ?? '#64748b',
    }));
}

export function buildRatingTrends(ratings: Rating[]): RatingTrendPoint[] {
  const byMonth = new Map<string, { month: string; sortKey: string; total: number; sum: number }>();

  for (const rating of ratings) {
    const date = new Date(rating.ratingDate);
    if (Number.isNaN(date.getTime())) continue;

    const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const month = date.toLocaleString('en-US', { month: 'short', year: '2-digit' });
    const entry = byMonth.get(sortKey) ?? { month, sortKey, total: 0, sum: 0 };
    entry.total += 1;
    entry.sum += rating.rating;
    byMonth.set(sortKey, entry);
  }

  return Array.from(byMonth.values())
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map(({ month, total, sum }) => ({
      month,
      avgRating: total > 0 ? Math.round((sum / total) * 10) / 10 : 0,
      totalRatings: total,
    }));
}

export function getStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}

export function getStatusStyles(status: string) {
  switch (status) {
    case 'pending':
      return { dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200/60' };
    case 'in_progress':
      return { dot: 'bg-[#193cb8]', text: 'text-[#193cb8]', bg: 'bg-[#193cb8]/5 border-[#193cb8]/20' };
    case 'resolved':
      return { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200/60' };
    default:
      return { dot: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-50 border-slate-200/60' };
  }
}

export function getPriorityStyles(priority: string) {
  switch (priority) {
    case 'high':
      return { dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50 border-red-200/60' };
    case 'medium':
      return { dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200/60' };
    case 'low':
    default:
      return { dot: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-50 border-slate-200/60' };
  }
}

export function formatFeedbackDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function mergeStatsFromApi(
  local: FeedbackStats,
  api: Record<string, unknown> | null
): FeedbackStats {
  if (!api) return local;
  return {
    ...local,
    totalRatings: Number(api.totalRatings ?? local.totalRatings),
    avgRating: Number(api.averageRating ?? api.avgRating ?? local.avgRating),
    totalComplaints: Number(api.totalComplaints ?? local.totalComplaints),
    pendingComplaints: Number(api.openComplaints ?? api.pendingComplaints ?? local.pendingComplaints),
  };
}

export function mapApiRatingDistribution(
  data: unknown,
  fallback: RatingDistributionItem[]
): RatingDistributionItem[] {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return fallback;
  }
  const entries = Object.entries(data as Record<string, unknown>).filter(
    ([key]) => !Number.isNaN(Number(key))
  );
  if (entries.length === 0) return fallback;

  const total = entries.reduce((sum, [, count]) => sum + Number(count ?? 0), 0);
  return entries
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([stars, count]) => {
      const starNum = Number(stars);
      const value = Number(count ?? 0);
      return {
        rating: `${stars} Star${starNum === 1 ? '' : 's'}`,
        count: value,
        percentage: total > 0 ? Math.round((value / total) * 100) : 0,
        color: RATING_COLORS[starNum] ?? '#64748b',
      };
    });
}

export function mapApiRatingTrends(
  data: unknown,
  fallback: RatingTrendPoint[]
): RatingTrendPoint[] {
  if (!Array.isArray(data) || data.length === 0) return fallback;
  return data.map((item) => {
    const row = item as { month?: string; avgRating?: number; totalRatings?: number };
    return {
      month: String(row.month ?? ''),
      avgRating: Number(row.avgRating ?? 0),
      totalRatings: Number(row.totalRatings ?? 0),
    };
  });
}

export function mapApiComplaintCategories(
  data: unknown,
  fallback: ComplaintCategoryItem[]
): ComplaintCategoryItem[] {
  if (!Array.isArray(data) || data.length === 0) return fallback;
  return data.map((item, index) => {
    const row = item as { category?: string; count?: number };
    const category = String(row.category ?? 'other');
    return {
      category: getCategoryLabel(category),
      count: Number(row.count ?? 0),
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    };
  });
}
