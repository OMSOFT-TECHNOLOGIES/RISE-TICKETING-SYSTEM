export const calculateTripTier = (baseFare: number): { tier: 1 | 2 | 3; penalty: number } => {
  if (baseFare <= 29) {
    return { tier: 1, penalty: 0.5 };
  }
  if (baseFare <= 59) {
    return { tier: 2, penalty: 1.0 };
  }
  return { tier: 3, penalty: 2.0 };
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
