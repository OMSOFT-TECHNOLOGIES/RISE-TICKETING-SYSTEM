import { notify } from '../utils/notify';
import { issueETicket, sendSessionTicketSms } from '../utils/eTicket';
import type { BookPassengerInput } from '../utils/eTicket.types';
import { isPhoneOnTripManifest, phonesMatch } from '../utils/passengerLookup';
import type { PassengerBookingFormValues } from './PassengerBookingFormFields';

export interface QueuedPassengerBooking extends PassengerBookingFormValues {
  queueId: string;
  /** Ticket created for this booking (SMS sent when session completes). */
  ticketId?: string;
}

export function createQueueId(): string {
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface PassengerBookingValidationOptions {
  /** Passenger already registered in RISE — phone lookup succeeded */
  returningPassenger?: boolean;
  /** Profile includes emergency contact on file */
  hasStoredEmergency?: boolean;
}

export function validatePassengerBookingForm(
  values: PassengerBookingFormValues,
  options: PassengerBookingValidationOptions = {}
): string | null {
  if (!values.phone?.trim()) return 'Phone number is required';

  const returning = options.returningPassenger === true;
  if (!returning && !values.name?.trim()) return 'Passenger name is required';
  if (returning && !values.name?.trim()) {
    return 'Could not resolve passenger name — enter full details for a new passenger';
  }

  if (
    values.emergencyContactPhone?.trim() &&
    phonesMatch(values.phone, values.emergencyContactPhone)
  ) {
    return 'Emergency contact cannot use the same number as the passenger';
  }

  const needsEmergency =
    !returning || !options.hasStoredEmergency;

  if (needsEmergency) {
    if (!values.emergencyContactName?.trim()) {
      return 'Emergency contact name is required';
    }
    if (!values.emergencyContactPhone?.trim()) {
      return 'Emergency contact phone is required';
    }
    if (!values.emergencyContactRelationship?.trim()) {
      return 'Emergency contact relationship is required';
    }
  }

  return null;
}

export function validateBiometricPassengerBooking(
  values: PassengerBookingFormValues,
  options: PassengerBookingValidationOptions = {}
): string | null {
  if (!values.biometricReference?.trim()) {
    return 'Capture passenger biometric before booking';
  }
  return validatePassengerBookingForm(values, options);
}

export function isPhoneBookedForTrip(
  phone: string,
  manifest: Array<{ phone?: string }>,
  queue: QueuedPassengerBooking[],
  excludeQueueId?: string
): boolean {
  if (isPhoneOnTripManifest(phone, manifest)) return true;
  return queue.some(
    (item) =>
      item.queueId !== excludeQueueId &&
      item.phone &&
      phonesMatch(String(item.phone), phone)
  );
}

export async function submitQueuedPassengerBookings(
  queue: QueuedPassengerBooking[],
  mapToInput: (entry: PassengerBookingFormValues) => BookPassengerInput
): Promise<{
  succeeded: number;
  failed: { queueId: string; name: string; error: string }[];
}> {
  const failed: { queueId: string; name: string; error: string }[] = [];
  let succeeded = 0;

  for (const entry of queue) {
    try {
      await issueETicket(mapToInput(entry), {
        showSuccessToast: false,
        printTicket: true,
      });
      succeeded += 1;
    } catch (error) {
      failed.push({
        queueId: entry.queueId,
        name: entry.name,
        error: error instanceof Error ? error.message : 'Booking failed',
      });
    }
  }

  if (succeeded > 0 && failed.length === 0) {
    notify.success(
      succeeded === 1
        ? '1 passenger booked successfully'
        : `${succeeded} passengers booked successfully`
    );
  } else if (succeeded > 0 && failed.length > 0) {
    notify.warning(`${succeeded} booked, ${failed.length} failed`, {
      description: failed.map((f) => f.name).join(', '),
    });
  } else if (failed.length > 0) {
    notify.error('No bookings were completed');
  }

  return { succeeded, failed };
}

/** Send e-ticket SMS for tickets booked this session, then clear the queue reference. */
export async function completePassengerBookingSession(
  queue: QueuedPassengerBooking[]
): Promise<void> {
  const ticketIds = queue
    .map((entry) => entry.ticketId)
    .filter((id): id is string => Boolean(id));
  if (ticketIds.length > 0) {
    await sendSessionTicketSms(ticketIds);
  }
}
