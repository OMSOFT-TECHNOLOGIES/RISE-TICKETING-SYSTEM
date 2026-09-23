export type ComplaintStatus = 'pending' | 'in_progress' | 'resolved';
export type ComplaintPriority = 'low' | 'medium' | 'high';

export interface Rating {
  id: string;
  ticketId: string;
  tripId: string;
  passengerName: string;
  passengerPhone: string;
  route: string;
  vehicle: string;
  driver: string;
  rating: number;
  ratingDate: string;
  stationId: string;
  stationName: string;
}

export interface Complaint {
  id: string;
  ticketId: string;
  tripId: string;
  passengerName: string;
  passengerPhone: string;
  passengerEmail: string;
  route: string;
  vehicle: string;
  driver: string;
  category: string;
  description: string;
  submittedDate: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  stationId: string;
  stationName: string;
  response: string | null;
  responseDate: string | null;
  respondedBy: string | null;
}

export interface FeedbackStats {
  totalRatings: number;
  avgRating: number;
  totalComplaints: number;
  pendingComplaints: number;
  resolvedComplaints: number;
  resolutionRate: number;
  satisfactionRate: number;
}

export interface ComplaintFilters {
  search: string;
  status: string;
  priority: string;
  category: string;
}

export interface RatingFilters {
  search: string;
}

export interface RatingDistributionItem {
  rating: string;
  count: number;
  percentage: number;
  color: string;
}

export interface ComplaintCategoryItem {
  category: string;
  count: number;
  color: string;
}

export interface RatingTrendPoint {
  month: string;
  avgRating: number;
  totalRatings: number;
}
