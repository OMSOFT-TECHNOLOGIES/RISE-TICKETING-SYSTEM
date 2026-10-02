import { parseListResponse } from './api/client';

export type StationPickerOption = {
  id: string;
  name: string;
  city?: string;
  region?: string;
  district?: string;
  code?: string;
};

/** Align list IDs with backend IdFormatter (STN001) used on users, vehicles, trips. */
export function formatStationRefId(id: unknown): string {
  if (id == null || id === '') return '';
  if (typeof id === 'string' && /^STN/i.test(id)) return id.toUpperCase();
  const numeric = typeof id === 'number' ? id : parseInt(String(id), 10);
  if (!Number.isNaN(numeric)) {
    return `STN${String(numeric).padStart(3, '0')}`;
  }
  return String(id);
}

export function parseStationsFromApiResponse(data: unknown): StationPickerOption[] {
  const list = parseListResponse<Record<string, unknown>>(data, 'stations');
  return list
    .map((station) => {
      const id = formatStationRefId(station.id);
      if (!id) return null;
      return {
        id,
        name: String(station.name ?? station.code ?? id),
        city: station.city != null ? String(station.city) : undefined,
        region: station.region != null ? String(station.region) : undefined,
        district: station.district != null ? String(station.district) : undefined,
        code: station.code != null ? String(station.code) : undefined,
      };
    })
    .filter((s): s is StationPickerOption => s != null);
}
