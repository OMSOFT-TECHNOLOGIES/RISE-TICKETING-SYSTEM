import { notify } from './notify';
import { formatTripDepartureDisplay } from './tripDateTime';

export type DriverBookingSummaryInput = {
  tripId: string;
  originStationName: string;
  destinationStation: string;
  driverName: string;
  departureDisplay: string;
  vehicleRegistration?: string;
  totalSeats: number;
  passengersBooked: number;
};

function safe(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHtml(input: DriverBookingSummaryInput): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Trip booking summary — ${safe(input.tripId)}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 24px; color: #111; }
    h1 { font-size: 18px; margin: 0 0 8px; }
    .sub { color: #555; font-size: 13px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    td { padding: 10px 8px; border-bottom: 1px solid #ddd; vertical-align: top; }
    td:first-child { color: #666; width: 42%; font-size: 12px; text-transform: uppercase; }
    .footer { margin-top: 24px; font-size: 11px; color: #666; border-top: 1px solid #ddd; padding-top: 12px; }
  </style>
</head>
<body>
  <h1>Driver trip summary — fully booked</h1>
  <p class="sub">For police / MTTD inspection · RISE Ghana</p>
  <table>
    <tr><td>Station name</td><td>${safe(input.originStationName)}</td></tr>
    <tr><td>Destination station</td><td>${safe(input.destinationStation)}</td></tr>
    <tr><td>Driver name</td><td>${safe(input.driverName)}</td></tr>
    <tr><td>Date &amp; time</td><td>${safe(input.departureDisplay)}</td></tr>
    <tr><td>Vehicle total seats</td><td>${input.totalSeats}</td></tr>
    <tr><td>Passengers booked</td><td>${input.passengersBooked}</td></tr>
    <tr><td>Trip ID</td><td>${safe(input.tripId)}</td></tr>
    ${input.vehicleRegistration ? `<tr><td>Vehicle</td><td>${safe(input.vehicleRegistration)}</td></tr>` : ''}
  </table>
  <div class="footer">Printed ${new Date().toLocaleString('en-GH')} · Present to driver before departure.</div>
  <script>window.onload=function(){setTimeout(function(){window.focus();window.print();},200);};</script>
</body>
</html>`;
}

export function printDriverBookingSummary(input: DriverBookingSummaryInput): void {
  if (typeof document === 'undefined') return;
  const html = buildHtml(input);
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none';
  document.body.appendChild(iframe);
  const win = iframe.contentWindow;
  if (!win) {
    notify.warning('Unable to open print view');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  const cleanup = () => iframe.parentNode?.removeChild(iframe);
  win.onafterprint = cleanup;
  setTimeout(cleanup, 60_000);
}

export function destinationFromTrip(trip: Record<string, unknown>): string {
  const routeTo = trip.routeTo != null ? String(trip.routeTo) : '';
  if (routeTo) return routeTo;
  const route = String(trip.route ?? '');
  const parts = route.split(/\s*(?:→|to)\s*/i);
  return parts[1]?.trim() || route || '—';
}

export function summaryFromTrip(
  trip: Record<string, unknown>,
  originStationName: string,
  passengersBooked: number
): DriverBookingSummaryInput {
  const stats = {
    capacity: Number(trip.capacity ?? 0),
    booked: passengersBooked,
  };
  return {
    tripId: String(trip.id ?? ''),
    originStationName,
    destinationStation: destinationFromTrip(trip),
    driverName: String(trip.driver ?? trip.driverName ?? '—'),
    departureDisplay: formatTripDepartureDisplay(trip),
    vehicleRegistration: String(trip.vehicle ?? trip.vehicleRegistration ?? ''),
    totalSeats: stats.capacity,
    passengersBooked: stats.booked,
  };
}
