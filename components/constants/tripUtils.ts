import { calculateTierInfo, getDefaultTripTiers } from '../utils/tripTier';

export const calculateTripTier = (baseFare: number): { tier: 1 | 2 | 3; penalty: number } => {
  const info = calculateTierInfo(getDefaultTripTiers(), baseFare, 1);
  return {
    tier: info.tier.id as 1 | 2 | 3,
    penalty: info.commissionPerPassenger,
  };
};

export const generateStationCode = (name: string, region: string, index: number): string => {
  const nameAbbr = name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .substring(0, 3)
    .toUpperCase();
  const regionAbbr = region
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
  return `${nameAbbr}-${regionAbbr}${index.toString().padStart(3, '0')}`;
};

export const getPlatformExplanation = (): string =>
  'Platform refers to the designated boarding and alighting areas where passengers wait for and board vehicles. Each platform can handle multiple vehicles simultaneously and helps organize passenger flow and vehicle operations efficiently.';

export const getCapacityExplanation = (): string =>
  'Station capacity refers to the maximum number of vehicles that can be stationed or parked at the station at any given time. This includes both active vehicles waiting for passengers and vehicles in temporary storage.';
