import { notify } from './notify';
import { formatTripDepartureDisplay } from './tripDateTime';

export type PoliceReceiptPassenger = {
  name: string;
  phone: string;
  seatNumber: string;
  idNumber?: string;
};

export type PoliceReceiptCheckInput = {
  tripId: string;
  route: string;
  departureDisplay: string;
  stationName: string;
  branchPhone?: string;
  vehicle: string;
  driver: string;
  driverLicense?: string;
  capacity: number;
  passengerCount: number;
  passengers: PoliceReceiptPassenger[];
};

function safe(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildPoliceReceiptHtml(input: PoliceReceiptCheckInput): string {
  const rows = input.passengers
    .map(
      (p, index) =>
        `<tr>
          <td>${index + 1}</td>
          <td>${safe(p.name)}</td>
          <td>${safe(p.phone)}</td>
          <td>${safe(p.seatNumber || '—')}</td>
          <td>${safe(p.idNumber || '—')}</td>
        </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Police Receipt Check — ${safe(input.tripId)}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 24px; color: #111; }
    h1 { font-size: 18px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.04em; }
    .sub { color: #444; font-size: 13px; margin-bottom: 16px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; font-size: 13px; margin-bottom: 16px; }
    .label { color: #666; font-size: 11px; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
    th { background: #f3f4f6; }
    .footer { margin-top: 24px; font-size: 11px; color: #555; border-top: 1px solid #ddd; padding-top: 12px; }
    .sign { margin-top: 32px; display: flex; justify-content: space-between; font-size: 12px; }
    .sign span { border-top: 1px solid #333; min-width: 180px; padding-top: 4px; text-align: center; }
  </style>
</head>
<body>
  <h1>Police Receipt Check — Passenger Manifest</h1>
  <p class="sub">RISE Ghana · Ministry of Transport · Roadside inspection copy</p>
  <div class="grid">
    <div><div class="label">Trip</div><div>${safe(input.tripId)}</div></div>
    <div><div class="label">Route</div><div>${safe(input.route)}</div></div>
    <div><div class="label">Departure</div><div>${safe(input.departureDisplay)}</div></div>
    <div><div class="label">Station / branch</div><div>${safe(input.stationName)}${input.branchPhone ? ` · ${safe(input.branchPhone)}` : ''}</div></div>
    <div><div class="label">Vehicle</div><div>${safe(input.vehicle || '—')}</div></div>
    <div><div class="label">Driver</div><div>${safe(input.driver || '—')}${input.driverLicense ? ` · Lic. ${safe(input.driverLicense)}` : ''}</div></div>
    <div><div class="label">Seats</div><div>${input.passengerCount} / ${input.capacity} passengers</div></div>
    <div><div class="label">Status</div><div>Journey started</div></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Passenger name</th>
        <th>Phone</th>
        <th>Seat</th>
        <th>ID (if any)</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="5">No passengers listed</td></tr>'}
    </tbody>
  </table>
  <div class="sign">
    <span>Driver signature</span>
    <span>Station officer</span>
    <span>Police / MTTD</span>
  </div>
  <div class="footer">
    Generated ${new Date().toLocaleString('en-GH')} · Verify manifest against physical passengers before departure.
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.focus(); window.print(); }, 200);
    };
  </script>
</body>
</html>`;
}

export function printPoliceReceiptCheck(input: PoliceReceiptCheckInput): void {
  if (typeof document === 'undefined') return;

  const html = buildPoliceReceiptHtml(input);
  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'Police receipt check');
  iframe.style.cssText =
    'position:fixed;right:0;bottom:0;width:0;height:0;border:none';
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
    iframe.parentNode?.removeChild(iframe);
  };
  frameWindow.onafterprint = cleanup;
  setTimeout(cleanup, 60_000);
}

export function policeReceiptFromTrip(
  trip: Record<string, unknown>,
  passengers: Array<Record<string, unknown>>,
  stationName: string,
  branchPhone?: string
): PoliceReceiptCheckInput {
  const stats = {
    capacity: Number(trip.capacity ?? 0),
    count: passengers.length,
  };
  return {
    tripId: String(trip.id ?? ''),
    route: String(trip.route ?? ''),
    departureDisplay: formatTripDepartureDisplay(trip),
    stationName,
    branchPhone,
    vehicle: String(trip.vehicle ?? trip.vehicleRegistration ?? ''),
    driver: String(trip.driver ?? trip.driverName ?? ''),
    driverLicense: trip.driverLicense != null ? String(trip.driverLicense) : undefined,
    capacity: stats.capacity,
    passengerCount: stats.count,
    passengers: passengers.map((p) => ({
      name: String(p.name ?? ''),
      phone: String(p.phone ?? ''),
      seatNumber: String(p.seatNumber ?? ''),
    })),
  };
}
