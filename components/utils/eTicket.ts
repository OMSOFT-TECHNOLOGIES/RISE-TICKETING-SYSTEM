import { notify } from './notify';
import { passengerApi } from './api/passengers';
import { ticketApi } from './api/tickets';
import { formatApiError } from './api/client';
import { formatTicketDateTime, getTripDepartureIso } from './tripDateTime';
import type {
  ETicket,
  BookPassengerInput,
  IssueETicketOptions,
  SmsStatus,
} from './eTicket.types';

export type { ETicket, BookPassengerInput, SmsStatus } from './eTicket.types';

export const TICKET_ISSUED_EVENT = 'rise-ticket-issued';

export function buildETicketUrl(token: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/e-ticket/${token}`;
}

export function mapApiTicket(data: Record<string, unknown>): ETicket {
  return {
    id: String(data.id ?? ''),
    token: String(data.token ?? ''),
    tripId: String(data.tripId ?? ''),
    passengerName: String(data.passengerName ?? ''),
    passengerPhone: String(data.passengerPhone ?? ''),
    passengerEmail: data.passengerEmail as string | undefined,
    routeFrom: String(data.routeFrom ?? ''),
    routeTo: String(data.routeTo ?? ''),
    departureTime:
      getTripDepartureIso({
        departureTime: data.departureTime,
        departureDate: data.departureDate,
        departureTimeOnly: data.departureTimeOnly,
      }) || String(data.departureTime ?? ''),
    arrivalTime: data.arrivalTime as string | undefined,
    seatNumber: String(data.seatNumber ?? 'TBD'),
    fare: Number(data.fare ?? 0),
    bookingDate: String(data.bookingDate ?? new Date().toISOString()),
    vehicle: String(data.vehicle ?? 'TBD'),
    driver: String(data.driver ?? 'TBD'),
    status: (data.status as ETicket['status']) ?? 'confirmed',
    qrCode: String(data.qrCode ?? ''),
    driverReportToken: data.driverReportToken as string | undefined,
    driverReportExpiresAt: data.driverReportExpiresAt as string | undefined,
    branchPhone: data.branchPhone as string | undefined,
    eTicketUrl: String(data.eTicketUrl ?? buildETicketUrl(String(data.token ?? ''))),
    stationId: String(data.stationId ?? ''),
    stationName: String(data.stationName ?? ''),
    smsStatus: (data.smsStatus as SmsStatus) ?? 'pending',
    smsSentAt: data.smsSentAt as string | undefined,
    notes: data.notes as string | undefined,
    rating: data.rating as number | null | undefined,
    ratingDate: data.ratingDate as string | null | undefined,
    complaint: data.complaint ?? null,
  };
}

function qrImageUrl(data: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(data)}`;
}

function buildTicketPrintHtml(ticket: ETicket): string {
  const departure = formatTicketDateTime(ticket.departureTime);
  const booked = formatTicketDateTime(ticket.bookingDate);
  const reportUrl =
    ticket.qrCode && ticket.qrCode.startsWith('http')
      ? ticket.qrCode
      : ticket.driverReportToken
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/report-driver/${ticket.driverReportToken}`
        : '';
  const safe = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>RISE Ticket ${safe(ticket.id)}</title>
  <style>
    @page { size: 80mm auto; margin: 8mm; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #111;
      margin: 0;
      padding: 0;
    }
    .ticket {
      max-width: 72mm;
      margin: 0 auto;
      border: 1px dashed #193cb8;
      padding: 12px;
    }
    .logos {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .logos img {
      height: 32px;
      width: auto;
      max-width: 48%;
    }
    .brand {
      text-align: center;
      color: #193cb8;
      font-weight: 700;
      font-size: 12px;
      margin-bottom: 4px;
    }
    .station {
      text-align: center;
      font-size: 11px;
      color: #555;
      margin-bottom: 10px;
    }
    .route {
      text-align: center;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 10px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      margin: 4px 0;
      gap: 8px;
    }
    .label { color: #666; }
    .value { font-weight: 600; text-align: right; }
    .qr {
      margin-top: 12px;
      padding: 10px;
      border: 1px solid #ddd;
      text-align: center;
    }
    .qr img {
      width: 120px;
      height: 120px;
      margin: 0 auto 6px;
      display: block;
    }
    .qr-caption {
      font-size: 9px;
      color: #444;
      line-height: 1.3;
    }
    .footer {
      margin-top: 10px;
      text-align: center;
      font-size: 10px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="logos">
      <img src="/logos/rise-ghana.svg" alt="RISE Ghana" />
      <img src="/logos/ministry-transport.svg" alt="Ministry of Transport" />
    </div>
    <div class="brand">RISE GHANA · E-TICKET</div>
    <div class="station">${safe(ticket.stationName || 'RISE Station')}</div>
    ${
      ticket.branchPhone
        ? `<div class="row"><span class="label">Branch office</span><span class="value">${safe(ticket.branchPhone)}</span></div>`
        : ''
    }
    <div class="route">${safe(ticket.routeFrom)} → ${safe(ticket.routeTo)}</div>
    <div class="row"><span class="label">Ticket</span><span class="value">${safe(ticket.id)}</span></div>
    <div class="row"><span class="label">Passenger</span><span class="value">${safe(ticket.passengerName)}</span></div>
    <div class="row"><span class="label">Phone</span><span class="value">${safe(ticket.passengerPhone)}</span></div>
    <div class="row"><span class="label">Seat</span><span class="value">${safe(ticket.seatNumber)}</span></div>
    <div class="row"><span class="label">Departure</span><span class="value">${safe(departure.date)} ${safe(departure.time)}</span></div>
    <div class="row"><span class="label">Fare</span><span class="value">GHS ${ticket.fare.toFixed(2)}</span></div>
    ${
      ticket.vehicle && ticket.vehicle !== 'TBD'
        ? `<div class="row"><span class="label">Vehicle</span><span class="value">${safe(ticket.vehicle)}</span></div>`
        : ''
    }
    ${
      ticket.driver && ticket.driver !== 'TBD'
        ? `<div class="row"><span class="label">Driver</span><span class="value">${safe(ticket.driver)}</span></div>`
        : ''
    }
    ${
      reportUrl
        ? `<div class="qr">
      <img src="${qrImageUrl(reportUrl)}" alt="Driver report QR" />
      <div class="qr-caption">Scan to report unsafe driving (valid 12 hours)</div>
    </div>`
        : ''
    }
    <div class="footer">Booked ${safe(booked.date)} ${safe(booked.time)} · Show at boarding</div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.focus(); window.print(); }, 200);
    };
  </script>
</body>
</html>`;
}

/** Open the system print dialog for a passenger ticket (receipt-style layout). */
export function printETicket(ticket: ETicket): void {
  if (typeof document === 'undefined') return;

  const html = buildTicketPrintHtml(ticket);
  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'Print ticket');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  if (!frameWindow) {
    document.body.removeChild(iframe);
    notify.warning('Unable to open print view');
    return;
  }

  const doc = frameWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  };

  frameWindow.onafterprint = cleanup;
  setTimeout(cleanup, 60_000);
}

export async function issueETicket(
  input: BookPassengerInput,
  options: IssueETicketOptions = {}
): Promise<ETicket> {
  const { showSuccessToast = true, printTicket = true } = options;
  const response = await passengerApi.addToTrip(input.tripId, {
    name: input.passengerName,
    phone: input.passengerPhone,
    email: input.passengerEmail,
    seatNumber: input.seatNumber,
    boardingPoint: input.routeFrom,
    dropoffPoint: input.routeTo,
    fare: input.fare,
    seats: 1,
    emergencyContactName: input.emergencyContactName,
    emergencyContactPhone: input.emergencyContactPhone,
    emergencyContactRelationship: input.emergencyContactRelationship,
  });

  if (!response.success || !response.data) {
    const message = formatApiError(response.error, 'Failed to book passenger');
    notify.error(message);
    throw new Error(message);
  }

  const payload = response.data as Record<string, unknown>;
  const ticketData = (payload.ticket ?? payload) as Record<string, unknown>;
  const ticket: ETicket = {
    ...mapApiTicket(ticketData),
    routeFrom: String(ticketData.routeFrom ?? input.routeFrom ?? ''),
    routeTo: String(ticketData.routeTo ?? input.routeTo ?? ''),
    departureTime: String(ticketData.departureTime ?? input.departureTime ?? ''),
    arrivalTime: (ticketData.arrivalTime as string | undefined) ?? input.arrivalTime,
    passengerName: String(ticketData.passengerName ?? input.passengerName),
    passengerPhone: String(ticketData.passengerPhone ?? input.passengerPhone),
    passengerEmail: (ticketData.passengerEmail as string | undefined) ?? input.passengerEmail,
    seatNumber: String(ticketData.seatNumber ?? input.seatNumber ?? 'TBD'),
    fare: Number(ticketData.fare ?? input.fare ?? 0),
    vehicle: String(ticketData.vehicle ?? input.vehicle ?? 'TBD'),
    driver: String(ticketData.driver ?? input.driver ?? 'TBD'),
    stationId: String(ticketData.stationId ?? input.stationId ?? ''),
    stationName: String(ticketData.stationName ?? input.stationName ?? 'Station'),
  };

  if (showSuccessToast) {
    if (ticket.smsStatus === 'sent') {
      notify.success(`E-ticket sent via SMS to ${input.passengerPhone}`, {
        description: `${input.passengerName} received their ticket link.`,
      });
    } else if (ticket.smsStatus === 'failed') {
      notify.error('Passenger booked but SMS failed', {
        description: 'Use Resend SMS from the Tickets page.',
      });
    } else {
      notify.success(`${input.passengerName} booked successfully`);
    }
  }

  window.dispatchEvent(new CustomEvent('rise-ticket-issued', { detail: ticket }));

  if (printTicket) {
    try {
      printETicket(ticket);
    } catch {
      notify.warning('Booking saved but ticket print failed', {
        description: 'Print the ticket from Passenger Tickets.',
      });
    }
  }

  return ticket;
}

export async function resendETicketSms(ticket: ETicket): Promise<ETicket> {
  const response = await ticketApi.sendSms(ticket.id, {
    phone: ticket.passengerPhone,
    eTicketUrl: ticket.eTicketUrl,
  });

  if (!response.success || !response.data) {
    const message = formatApiError(response.error, 'Failed to resend SMS');
    notify.error(message);
    throw new Error(message);
  }

  const updated = mapApiTicket({
    ...ticket,
    ...(response.data as Record<string, unknown>),
    smsStatus: 'sent',
    smsSentAt: new Date().toISOString(),
  });

  notify.success(`E-ticket link resent to ${ticket.passengerPhone}`);
  return updated;
}
