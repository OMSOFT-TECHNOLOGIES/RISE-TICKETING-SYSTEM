export type SmsStatus = 'sent' | 'failed' | 'pending';

export interface ETicket {
  id: string;
  token: string;
  tripId: string;
  passengerName: string;
  passengerPhone: string;
  passengerEmail?: string;
  routeFrom: string;
  routeTo: string;
  departureTime: string;
  arrivalTime?: string;
  seatNumber: string;
  /** Seats reserved on this booking (defaults to 1). */
  seats: number;
  /** Per-seat fare when `fare` is the booking total. */
  farePerSeat?: number;
  fare: number;
  bookingDate: string;
  vehicle: string;
  driver: string;
  status: 'confirmed' | 'pending' | 'used' | 'cancelled';
  qrCode: string;
  driverReportToken?: string;
  driverReportExpiresAt?: string;
  branchPhone?: string;
  eTicketUrl: string;
  stationId: string;
  stationName: string;
  smsStatus: SmsStatus;
  smsSentAt?: string;
  notes?: string;
  rating?: number | null;
  ratingDate?: string | null;
  complaint?: unknown | null;
}

export interface BookPassengerInput {
  tripId: string;
  passengerName: string;
  passengerPhone: string;
  passengerEmail?: string;
  routeFrom: string;
  routeTo: string;
  departureTime: string;
  arrivalTime?: string;
  seatNumber?: string;
  fare: number;
  vehicle?: string;
  driver?: string;
  stationId: string;
  stationName: string;
  seats?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  biometricReference?: string;
}

export interface IssueETicketOptions {
  /** Show a toast after each successful booking (default true). */
  showSuccessToast?: boolean;
  /** Open print dialog for the ticket (default true). */
  printTicket?: boolean;
  /** Send e-ticket SMS immediately (default false — use Done in booking dialog). */
  sendSms?: boolean;
}

export type IssueETicketResult = {
  ticket: ETicket;
  seatsBooked: number;
  updatedTrip?: Record<string, unknown>;
};
