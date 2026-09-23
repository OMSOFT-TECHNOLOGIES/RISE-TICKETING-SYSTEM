import { passengerApi } from './api/passengers';

export interface RegisteredPassenger {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  source?: string;
}

export function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

/** Match Ghana numbers with or without country code (+233 / leading 0). */
export function isPhoneOnTripManifest(
  phone: string,
  manifest: Array<{ phone?: string }>
): boolean {
  const trimmed = phone.trim();
  if (!trimmed || normalizePhoneDigits(trimmed).length < 9) {
    return false;
  }
  return manifest.some(
    (entry) => entry.phone && phonesMatch(String(entry.phone), trimmed)
  );
}

export function phonesMatch(a: string, b: string): boolean {
  const da = normalizePhoneDigits(a);
  const db = normalizePhoneDigits(b);
  if (!da || !db) return false;
  if (da === db) return true;
  const tail = (d: string) => (d.length > 9 ? d.slice(-9) : d);
  return tail(da) === tail(db);
}

function parseEmergencyFromApi(data: Record<string, unknown>): {
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
} {
  let emergencyContactName =
    typeof data.emergencyContactName === 'string'
      ? data.emergencyContactName
      : undefined;
  let emergencyContactPhone =
    typeof data.emergencyContactPhone === 'string'
      ? data.emergencyContactPhone
      : undefined;
  let emergencyContactRelationship =
    typeof data.emergencyContactRelationship === 'string'
      ? data.emergencyContactRelationship
      : undefined;

  const emergencyContact = data.emergencyContact;
  if (typeof emergencyContact === 'string' && !emergencyContactPhone) {
    emergencyContactPhone = emergencyContact;
  } else if (emergencyContact && typeof emergencyContact === 'object') {
    const nested = emergencyContact as Record<string, unknown>;
    emergencyContactName =
      emergencyContactName ?? (nested.name != null ? String(nested.name) : undefined);
    emergencyContactPhone =
      emergencyContactPhone ?? (nested.phone != null ? String(nested.phone) : undefined);
    emergencyContactRelationship =
      emergencyContactRelationship ??
      (nested.relationship != null ? String(nested.relationship) : undefined);
  }

  return {
    emergencyContactName,
    emergencyContactPhone,
    emergencyContactRelationship,
  };
}

function isRegisteredPassenger(data: unknown): data is Record<string, unknown> {
  if (!data || typeof data !== 'object') return false;
  const record = data as Record<string, unknown>;
  return Boolean(record.name || record.phone || record.email);
}

export async function fetchPassengerByPhone(
  phone: string
): Promise<RegisteredPassenger | null> {
  const trimmed = phone.trim();
  const digits = normalizePhoneDigits(trimmed);
  if (digits.length < 9) return null;

  const response = await passengerApi.lookupByPhone(trimmed);
  if (!response.success) {
    return null;
  }

  const data = response.data;
  if (!isRegisteredPassenger(data)) {
    return null;
  }

  const emergency = parseEmergencyFromApi(data);

  return {
    id: data.id != null ? String(data.id) : undefined,
    name: data.name != null ? String(data.name) : undefined,
    phone: data.phone != null ? String(data.phone) : trimmed,
    email: data.email != null ? String(data.email) : undefined,
    ...emergency,
    source: data.source != null ? String(data.source) : undefined,
  };
}
