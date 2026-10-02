import type { GhanaRegion } from './ghanaRegions';
import districtsData from './ghanaDistricts.data.json';

/** All 261 MMDAs in Ghana, grouped by region (source: Wikipedia / Ghana district assemblies). */
export const DISTRICTS_BY_REGION: Record<GhanaRegion | string, string[]> =
  districtsData as Record<GhanaRegion | string, string[]>;

export function getDistrictsForRegion(region: string | undefined | null): string[] {
  if (!region?.trim()) return [];
  return DISTRICTS_BY_REGION[region] ?? [];
}

export const GHANA_MMDA_COUNT = Object.values(DISTRICTS_BY_REGION).reduce(
  (total, list) => total + list.length,
  0
);
