type TripLike = {
  departureTime?: unknown;
  departureDate?: unknown;
  departureTimeOnly?: unknown;
};

type WallClockParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

/** Parse API/local datetime without UTC shifting (Ghana wall-clock). */
export function parseLocalWallClock(value: unknown): WallClockParts | null {
  if (value == null) return null;

  if (Array.isArray(value)) {
    const nums = value.map((v) => Number(v));
    if (nums.length >= 5 && nums.every((n) => Number.isFinite(n))) {
      const [year, month, day, hour, minute] = nums;
      return {
        year,
        month: month > 0 && month <= 12 ? month - 1 : month,
        day,
        hour,
        minute,
      };
    }
    return null;
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const year = Number(record.year);
    const month = Number(record.monthValue ?? record.month);
    const day = Number(record.dayOfMonth ?? record.day);
    const hour = Number(record.hour);
    const minute = Number(record.minute);
    if ([year, month, day, hour, minute].every((n) => Number.isFinite(n))) {
      return {
        year,
        month: month >= 1 && month <= 12 ? month - 1 : month,
        day,
        hour,
        minute,
      };
    }
  }

  const text = String(value).trim();
  if (!text) return null;

  const iso = text.match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2})(?::(\d{2}))?/
  );
  if (iso) {
    return {
      year: Number(iso[1]),
      month: Number(iso[2]) - 1,
      day: Number(iso[3]),
      hour: Number(iso[4]),
      minute: Number(iso[5]),
    };
  }

  const timeOnly = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (timeOnly) {
    return {
      year: 0,
      month: 0,
      day: 0,
      hour: Number(timeOnly[1]),
      minute: Number(timeOnly[2]),
    };
  }

  return null;
}

function partsFromTripFields(trip: TripLike): WallClockParts | null {
  const dateStr =
    typeof trip.departureDate === 'string' ? trip.departureDate.trim().slice(0, 10) : '';
  const timeStr =
    typeof trip.departureTimeOnly === 'string'
      ? trip.departureTimeOnly.trim()
      : '';

  if (dateStr && timeStr) {
    const dateParts = parseLocalWallClock(`${dateStr}T${timeStr.slice(0, 5)}:00`);
    if (dateParts) return dateParts;
  }

  return parseLocalWallClock(trip.departureTime);
}

/** ISO-like string for APIs (local wall clock, no timezone suffix). */
export function getTripDepartureIso(trip: TripLike): string {
  const parts = partsFromTripFields(trip);
  if (!parts || parts.year <= 0) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${parts.year}-${pad(parts.month + 1)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}:00`;
}

export function formatTripDepartureDisplay(trip: TripLike): string {
  const parts = partsFromTripFields(trip);
  if (!parts) return '—';

  if (parts.year > 0) {
    const dt = new Date(parts.year, parts.month, parts.day, parts.hour, parts.minute, 0, 0);
    return dt.toLocaleString('en-GH', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  const dt = new Date(2000, 0, 1, parts.hour, parts.minute, 0, 0);
  return dt.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' });
}

export function formatTicketDateTime(value: unknown): { date: string; time: string } {
  const parts = parseLocalWallClock(value);
  if (!parts) {
    const fallback = value != null ? String(value) : '';
    return { date: fallback, time: '' };
  }
  if (parts.year > 0) {
    const dt = new Date(parts.year, parts.month, parts.day, parts.hour, parts.minute, 0, 0);
    return {
      date: dt.toLocaleDateString('en-GH'),
      time: dt.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' }),
    };
  }
  const dt = new Date(2000, 0, 1, parts.hour, parts.minute, 0, 0);
  return {
    date: '',
    time: dt.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' }),
  };
}
