import { notify } from './notify';
import { formatTripDepartureDisplay } from './tripDateTime';
import { tripApi } from './api';
import { readPassengerSeatCount, sumPassengerSeatsFromManifest } from './tripSeats';
import {
  calculateTierInfo,
  getDefaultTripTiers,
  type TripCommissionTier,
} from './tripTier';

export type PoliceReceiptPassenger = {
  name: string;
  seatNumber: string;
  seats: number;
  idNumber?: string;
};

export type PoliceReceiptCheckInput = {
  tripId: string;
  route: string;
  routeFrom?: string;
  routeTo?: string;
  departureDisplay: string;
  stationName: string;
  branchPhone?: string;
  vehicle: string;
  driver: string;
  driverLicense?: string;
  fare?: number;
  tripStatus?: string;
  capacity: number;
  /** Total seats occupied (sum of each booking’s seat count). */
  seatsBooked: number;
  passengerCount: number;
  tripRevenue?: number;
  riseCommission?: number;
  passengers: PoliceReceiptPassenger[];
  policeCheckToken?: string;
  policeCheckExpiresAt?: string;
};

function safe(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function qrImageUrl(data: string, size = 72): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
}

function buildOrigin(): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  return '';
}

export async function issuePoliceCheckToken(
  tripId: string
): Promise<{ token: string; expiresAt: string } | null> {
  const response = await tripApi.issuePoliceCheck(tripId);
  if (!response.success || !response.data) {
    notify.error(
      typeof response.error === 'string'
        ? response.error
        : 'Could not generate police check QR code'
    );
    return null;
  }
  const row = response.data as Record<string, unknown>;
  const token = String(row.token ?? '');
  if (!token) return null;
  return { token, expiresAt: String(row.expiresAt ?? '') };
}

function manifestVerifyUrl(token: string): string {
  return `${buildOrigin()}/police-check/${token}`;
}

function formatTripStatusLabel(status: string | undefined): string {
  if (!status) return '—';
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatRouteLine(input: PoliceReceiptCheckInput): string {
  const from = input.routeFrom?.trim();
  const to = input.routeTo?.trim();
  if (from && to) return `${from} → ${to}`;
  return input.route.trim() || '—';
}

type ManifestLayout = {
  columns: number;
  tableFontSize: number;
  cellPadding: string;
  qrSize: number;
};

function getManifestLayout(passengerCount: number): ManifestLayout {
  if (passengerCount <= 14) {
    return { columns: 1, tableFontSize: 10, cellPadding: '4px 7px', qrSize: 92 };
  }
  if (passengerCount <= 28) {
    return { columns: 2, tableFontSize: 9, cellPadding: '2px 5px', qrSize: 84 };
  }
  if (passengerCount <= 42) {
    return { columns: 3, tableFontSize: 8, cellPadding: '2px 4px', qrSize: 76 };
  }
  if (passengerCount <= 56) {
    return { columns: 4, tableFontSize: 7.5, cellPadding: '1px 3px', qrSize: 72 };
  }
  return { columns: 4, tableFontSize: 7, cellPadding: '1px 2px', qrSize: 68 };
}

function chunkPassengers<T>(items: T[], columns: number): T[][] {
  if (columns <= 1) return [items];
  const size = Math.ceil(items.length / columns);
  const chunks: T[][] = [];
  for (let i = 0; i < columns; i += 1) {
    const slice = items.slice(i * size, (i + 1) * size);
    if (slice.length > 0) chunks.push(slice);
  }
  return chunks.length > 0 ? chunks : [[]];
}

function buildManifestTables(
  passengers: PoliceReceiptPassenger[],
  layout: ManifestLayout
): string {
  if (passengers.length === 0) {
    return `<p class="manifest-empty">No passengers listed on this manifest.</p>`;
  }

  const chunks = chunkPassengers(passengers, layout.columns);
  let rowOffset = 0;

  const tables = chunks
    .map((chunk) => {
      const rows = chunk
        .map((p, index) => {
          const n = rowOffset + index + 1;
          const seatLabel =
            p.seats > 1
              ? `${p.seatNumber || '—'} (×${p.seats})`
              : p.seatNumber || '—';
          return `<tr>
            <td class="col-num">${n}</td>
            <td class="col-name">${safe(p.name)}</td>
            <td class="col-seats">${p.seats}</td>
            <td class="col-seat">${safe(seatLabel)}</td>
            <td class="col-id">${safe(p.idNumber || '—')}</td>
          </tr>`;
        })
        .join('');
      rowOffset += chunk.length;

      return `<div class="manifest-col">
        <table class="manifest-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Passenger</th>
              <th>Seats</th>
              <th>Assignment</th>
              <th>ID</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
    })
    .join('');

  return `<div class="manifest-cols">${tables}</div>`;
}

function buildPoliceReceiptHtml(input: PoliceReceiptCheckInput): string {
  const expiryNote = input.policeCheckExpiresAt
    ? new Date(input.policeCheckExpiresAt).toLocaleString('en-GH', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '24 hours from issue';

  const generatedAt = new Date().toLocaleString('en-GH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const verifyUrl = input.policeCheckToken
    ? manifestVerifyUrl(input.policeCheckToken)
    : '';

  const layout = getManifestLayout(input.passengers.length);
  const manifestHtml = buildManifestTables(input.passengers, layout);

  const seatsBooked = input.seatsBooked;
  const occupancy =
    input.capacity > 0
      ? `${seatsBooked} seat${seatsBooked === 1 ? '' : 's'} occupied · ${Math.max(0, input.capacity - seatsBooked)} vacant · ${input.capacity} capacity · ${input.passengerCount} booking${input.passengerCount === 1 ? '' : 's'}`
      : `${seatsBooked} seat${seatsBooked === 1 ? '' : 's'} · ${input.passengerCount} passenger${input.passengerCount === 1 ? '' : 's'}`;

  const fareLine =
    input.fare != null && Number.isFinite(input.fare) && input.fare > 0
      ? `GHS ${input.fare.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / seat`
      : '—';

  const revenueLine =
    input.tripRevenue != null && input.tripRevenue > 0
      ? `GHS ${input.tripRevenue.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : '—';

  const commissionLine =
    input.riseCommission != null && input.riseCommission >= 0
      ? `GHS ${input.riseCommission.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : '—';

  const qrBlock = verifyUrl
    ? `<div class="qr-panel">
        <img src="${safe(qrImageUrl(verifyUrl, layout.qrSize))}" alt="Manifest verification QR" width="${layout.qrSize}" height="${layout.qrSize}" />
        <p class="qr-caption">Scan to verify manifest on RISE</p>
        <p class="qr-expiry">Valid until ${safe(expiryNote)}</p>
      </div>`
    : `<div class="qr-panel qr-panel--placeholder">
        <p class="qr-caption">Digital verification unavailable</p>
      </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Police Receipt Check — ${safe(input.tripId)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 7mm 9mm;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      color: #0f172a;
      font-family: "Segoe UI", Arial, Helvetica, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet {
      display: flex;
      flex-direction: column;
      max-width: 100%;
    }
    .header {
      display: flex;
      gap: 12px;
      align-items: stretch;
      border: 1px solid #193cb8;
      border-radius: 4px;
      overflow: hidden;
      flex-shrink: 0;
    }
    .header-brand {
      flex: 1;
      background: linear-gradient(135deg, #193cb8 0%, #0f2a8a 100%);
      color: #fff;
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 6px;
    }
    .header-logos {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .header-logos img {
      height: 28px;
      width: auto;
      max-width: 120px;
      filter: brightness(0) invert(1);
    }
    .doc-title {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .doc-subtitle {
      margin: 0;
      font-size: 10px;
      opacity: 0.92;
      line-height: 1.35;
    }
    .header-meta {
      width: ${layout.qrSize + 36}px;
      flex-shrink: 0;
      padding: 8px;
      background: #f8fafc;
      border-left: 1px solid #cbd5e1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .qr-panel img {
      display: block;
      margin: 0 auto;
    }
    .qr-caption {
      margin: 4px 0 0;
      font-size: 7.5px;
      font-weight: 600;
      color: #334155;
      line-height: 1.25;
    }
    .qr-expiry {
      margin: 2px 0 0;
      font-size: 7px;
      color: #64748b;
    }
    .qr-panel--placeholder {
      min-height: 60px;
      justify-content: center;
    }
    .trip-bar {
      margin-top: 8px;
      padding: 8px 10px;
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      border-radius: 4px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px 10px;
      font-size: 9px;
      flex-shrink: 0;
    }
    .trip-bar .field .label {
      display: block;
      font-size: 7px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #475569;
      margin-bottom: 1px;
    }
    .trip-bar .field .value {
      font-size: 9.5px;
      font-weight: 600;
      color: #0f172a;
      line-height: 1.25;
      word-break: break-word;
    }
    .trip-bar .field--wide {
      grid-column: span 2;
    }
    .route-highlight {
      font-size: 11px;
      color: #193cb8;
    }
    .manifest-section {
      margin-top: 8px;
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }
    .manifest-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 8px;
      padding-bottom: 4px;
      border-bottom: 2px solid #193cb8;
      flex-shrink: 0;
    }
    .manifest-head h2 {
      margin: 0;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #193cb8;
    }
    .manifest-head span {
      font-size: 8.5px;
      color: #475569;
      font-weight: 600;
    }
    .manifest-cols {
      display: flex;
      gap: 6px;
      margin-top: 4px;
      flex: 1;
      min-height: 0;
      align-items: flex-start;
    }
    .manifest-col {
      flex: 1;
      min-width: 0;
    }
    .manifest-table {
      width: 100%;
      border-collapse: collapse;
      font-size: ${layout.tableFontSize}px;
      table-layout: fixed;
    }
    .manifest-table th,
    .manifest-table td {
      border: 1px solid #cbd5e1;
      padding: ${layout.cellPadding};
      text-align: left;
      vertical-align: middle;
      line-height: 1.2;
    }
    .manifest-table th {
      background: #e2e8f0;
      font-size: ${Math.max(7, layout.tableFontSize - 1)}px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #334155;
    }
    .manifest-table tbody tr:nth-child(even) td {
      background: #f8fafc;
    }
    .col-num { width: 6%; text-align: center; }
    .col-name { width: 32%; }
    .col-seats { width: 8%; text-align: center; font-weight: 700; }
    .col-seat { width: 18%; text-align: center; }
    .col-id { width: 28%; font-size: ${Math.max(7, layout.tableFontSize - 0.5)}px; }
    .manifest-empty {
      margin: 8px 0 0;
      font-size: 10px;
      color: #64748b;
    }
    .signatures {
      margin-top: 8px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      flex-shrink: 0;
    }
    .signatures .line {
      border-top: 1px solid #334155;
      padding-top: 3px;
      font-size: 8px;
      text-align: center;
      color: #475569;
      font-weight: 600;
    }
    .footer {
      margin-top: 6px;
      padding-top: 5px;
      border-top: 1px solid #cbd5e1;
      font-size: 7.5px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      gap: 8px;
      flex-shrink: 0;
    }
    @media print {
      .sheet {
        page-break-after: avoid;
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <header class="header">
      <div class="header-brand">
        <div class="header-logos">
          <img src="/logos/rise-ghana.svg" alt="RISE Ghana" />
          <img src="/logos/ministry-transport.svg" alt="Ministry of Transport" />
        </div>
        <h1 class="doc-title">Police Receipt Check</h1>
        <p class="doc-subtitle">Passenger manifest · Roadside inspection · Ghana Police Service / MTTD</p>
      </div>
      <div class="header-meta">${qrBlock}</div>
    </header>

    <section class="trip-bar">
      <div class="field"><span class="label">Trip reference</span><span class="value">${safe(input.tripId)}</span></div>
      <div class="field"><span class="label">Trip status</span><span class="value">${safe(formatTripStatusLabel(input.tripStatus))}</span></div>
      <div class="field field--wide"><span class="label">Route</span><span class="value route-highlight">${safe(formatRouteLine(input))}</span></div>
      <div class="field"><span class="label">Scheduled departure</span><span class="value">${safe(input.departureDisplay)}</span></div>
      <div class="field field--wide"><span class="label">Station / terminal</span><span class="value">${safe(input.stationName)}${input.branchPhone ? ` · Tel. ${safe(input.branchPhone)}` : ''}</span></div>
      <div class="field"><span class="label">Base fare</span><span class="value">${safe(fareLine)}</span></div>
      <div class="field"><span class="label">Vehicle registration</span><span class="value">${safe(input.vehicle || '—')}</span></div>
      <div class="field field--wide"><span class="label">Driver</span><span class="value">${safe(input.driver || '—')}${input.driverLicense ? ` · Licence ${safe(input.driverLicense)}` : ''}</span></div>
      <div class="field field--wide"><span class="label">Occupancy</span><span class="value">${safe(occupancy)}</span></div>
      <div class="field"><span class="label">Passenger revenue</span><span class="value">${safe(revenueLine)}</span></div>
      <div class="field"><span class="label">RISE commission due</span><span class="value route-highlight">${safe(commissionLine)}</span></div>
    </section>

    <section class="manifest-section">
      <div class="manifest-head">
        <h2>Passenger manifest</h2>
        <span>${input.seatsBooked} seat${input.seatsBooked === 1 ? '' : 's'} · ${input.passengerCount} booking${input.passengerCount === 1 ? '' : 's'} · verify IDs at checkpoint</span>
      </div>
      ${manifestHtml}
    </section>

    <div class="signatures">
      <div class="line">Driver signature &amp; date</div>
      <div class="line">Station / booking officer</div>
      <div class="line">Police / MTTD officer</div>
    </div>

    <footer class="footer">
      <span>RISE Ghana · Ministry of Transport · Generated ${safe(generatedAt)}</span>
      <span>Official copy for checkpoint verification · QR validates full manifest</span>
    </footer>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.focus(); window.print(); }, 250);
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
  branchPhone?: string,
  policeCheck?: { token: string; expiresAt: string } | null,
  tiers: TripCommissionTier[] = getDefaultTripTiers()
): PoliceReceiptCheckInput {
  const token = policeCheck?.token;
  const routeParts = String(trip.route ?? '').split(/\s*(?:→|to)\s*/i);
  const farePerSeat = Number(trip.fare ?? trip.totalFare ?? trip.baseFare ?? 0);

  let tripRevenue = 0;
  let riseCommission = 0;

  const manifestRows: PoliceReceiptPassenger[] = passengers.map((p) => {
    const seats = readPassengerSeatCount(p);
    if (Number.isFinite(farePerSeat) && farePerSeat > 0 && seats > 0) {
      tripRevenue += farePerSeat * seats;
      riseCommission += calculateTierInfo(tiers, farePerSeat, seats).totalCommission;
    }
    return {
      name: String(p.name ?? p.passengerName ?? ''),
      seatNumber: String(p.seatNumber ?? ''),
      seats,
      idNumber:
        p.nationalId != null
          ? String(p.nationalId)
          : p.claimantId != null
            ? String(p.claimantId)
            : undefined,
    };
  });

  const seatsBooked = sumPassengerSeatsFromManifest(passengers);

  return {
    tripId: String(trip.id ?? ''),
    route: String(trip.route ?? ''),
    routeFrom: trip.routeFrom != null ? String(trip.routeFrom) : routeParts[0]?.trim(),
    routeTo: trip.routeTo != null ? String(trip.routeTo) : routeParts[1]?.trim(),
    departureDisplay: formatTripDepartureDisplay(trip),
    stationName,
    branchPhone,
    vehicle: String(trip.vehicle ?? trip.vehicleRegistration ?? trip.vehicleNumber ?? ''),
    driver: String(trip.driver ?? trip.driverName ?? ''),
    driverLicense: trip.driverLicense != null ? String(trip.driverLicense) : undefined,
    fare: Number.isFinite(farePerSeat) && farePerSeat > 0 ? farePerSeat : undefined,
    tripStatus: trip.status != null ? String(trip.status) : undefined,
    capacity: Math.max(0, Number(trip.capacity ?? 0)),
    seatsBooked,
    passengerCount: passengers.length,
    tripRevenue: Math.round(tripRevenue * 100) / 100,
    riseCommission: Math.round(riseCommission * 100) / 100,
    policeCheckToken: token,
    policeCheckExpiresAt: policeCheck?.expiresAt,
    passengers: manifestRows,
  };
}
