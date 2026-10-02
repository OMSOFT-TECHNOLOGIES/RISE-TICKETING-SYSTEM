import { GHANA_REGIONS } from '../constants/ghanaRegions';
import { getDistrictsForRegion } from '../constants/ghanaDistricts';

/** Always use the full Ghana region list in user forms (ignore API subset). */
export const USER_FORM_REGIONS: readonly string[] = GHANA_REGIONS;

export function userFormDistrictsForRegion(region: string | undefined | null): string[] {
  return getDistrictsForRegion(region);
}
