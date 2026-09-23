/** Normalize driver create/update payloads for the API */
export function toDriverApiPayload(input: {
  name: string;
  phone: string;
  email?: string;
  licenseNumber: string;
  licenseExpiry?: string;
  experience?: string | number;
  address?: string;
  emergencyContact?: string;
  stationId?: string;
  status?: string;
}) {
  let experience: number | undefined;
  if (input.experience !== undefined && input.experience !== null && String(input.experience).trim() !== '') {
    const parsed = parseInt(String(input.experience), 10);
    if (!Number.isNaN(parsed)) {
      experience = parsed;
    }
  }

  return {
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || undefined,
    licenseNumber: input.licenseNumber.trim(),
    licenseExpiry: input.licenseExpiry?.trim() || undefined,
    experience,
    address: input.address?.trim() || undefined,
    emergencyContact: input.emergencyContact?.trim() || undefined,
    stationId: input.stationId || undefined,
    status: input.status?.trim() || undefined,
  };
}

export function formatDriverLicenseExpiry(expiry: unknown): string {
  if (!expiry) return 'Not set';
  const text = String(expiry).slice(0, 10);
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleDateString();
}

export function driverEmergencyContactLabel(driver: Record<string, unknown>): string {
  if (typeof driver.emergencyContact === 'string' && driver.emergencyContact) {
    return driver.emergencyContact;
  }
  if (typeof driver.emergencyContactPhone === 'string' && driver.emergencyContactPhone) {
    return driver.emergencyContactPhone;
  }
  const ec = driver.emergencyContact;
  if (ec && typeof ec === 'object' && 'phone' in ec) {
    const phone = (ec as { phone?: string }).phone;
    return phone ?? '';
  }
  return '';
}
