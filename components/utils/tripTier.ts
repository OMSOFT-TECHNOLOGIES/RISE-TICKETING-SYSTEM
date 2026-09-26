export type TripCommissionTier = {
  id: number;
  name: string;
  minFare: number;
  maxFare: number | null;
  commission: number;
  description: string;
  color: string;
};

const TIER_COLORS: Record<number, string> = {
  1: 'bg-green-100 text-green-800 border-green-200',
  2: 'bg-[#193cb8]/10 text-[#193cb8] border-[#193cb8]/20',
  3: 'bg-[#193cb8]/10 text-[#193cb8] border-[#193cb8]/20',
};

export function getDefaultTripTiers(): TripCommissionTier[] {
  return [
    {
      id: 1,
      name: 'Tier 1',
      minFare: 0.01,
      maxFare: 29,
      commission: 0.5,
      color: TIER_COLORS[1],
      description: 'Basic routes - Local & short distance',
    },
    {
      id: 2,
      name: 'Tier 2',
      minFare: 30,
      maxFare: 59,
      commission: 1,
      color: TIER_COLORS[2],
      description: 'Medium routes - Inter-district',
    },
    {
      id: 3,
      name: 'Tier 3',
      minFare: 60,
      maxFare: null,
      commission: 2,
      color: TIER_COLORS[3],
      description: 'Premium routes - Long distance',
    },
  ];
}

export function parseTripTiersFromApi(data: unknown): TripCommissionTier[] {
  const list = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as { tiers?: unknown[] }).tiers)
      ? (data as { tiers: unknown[] }).tiers
      : [];

  if (list.length === 0) {
    return getDefaultTripTiers();
  }

  return list
    .map((item) => {
      const row = item as Record<string, unknown>;
      const id = Number(row.tierLevel ?? row.id ?? 0);
      if (!id) return null;
      const maxRaw = row.maxFare;
      return {
        id,
        name: String(row.name ?? `Tier ${id}`),
        minFare: Number(row.minFare ?? 0),
        maxFare: maxRaw == null || maxRaw === '' ? null : Number(maxRaw),
        commission: Number(row.commission ?? row.commissionPerPassenger ?? 0),
        description: String(row.description ?? ''),
        color: TIER_COLORS[id] ?? TIER_COLORS[1],
      } satisfies TripCommissionTier;
    })
    .filter((tier): tier is TripCommissionTier => tier != null)
    .sort((a, b) => a.id - b.id);
}

export function calculateTierInfo(
  tiers: TripCommissionTier[],
  fare: number,
  passengerCount: number = 1
) {
  const safeTiers = tiers.length > 0 ? tiers : getDefaultTripTiers();
  const tier =
    safeTiers.find(
      (t) =>
        fare >= t.minFare && (t.maxFare == null || fare <= t.maxFare)
    ) ?? safeTiers[0];

  const commissionPerPassenger = tier.commission;
  const count = Math.max(passengerCount, 1);
  const totalCommission = commissionPerPassenger * count;
  const tripRevenue = fare * count;
  const netRevenue = tripRevenue - totalCommission;

  return {
    tier,
    commissionPerPassenger,
    totalCommission,
    tripRevenue,
    netRevenue,
    farePerPassenger: fare,
    passengerCount: count,
  };
}

export type TripTierEditRow = {
  tierLevel: number;
  name: string;
  minFare: string;
  maxFare: string;
  commission: string;
  description: string;
};

export function tiersToEditRows(tiers: TripCommissionTier[]): TripTierEditRow[] {
  return tiers.map((tier) => ({
    tierLevel: tier.id,
    name: tier.name,
    minFare: String(tier.minFare),
    maxFare: tier.maxFare == null ? '' : String(tier.maxFare),
    commission: String(tier.commission),
    description: tier.description,
  }));
}

export function editRowsToApiPayload(rows: TripTierEditRow[]) {
  return {
    tiers: rows.map((row) => ({
      tierLevel: row.tierLevel,
      name: row.name.trim(),
      minFare: Number(row.minFare),
      maxFare: row.maxFare.trim() === '' ? null : Number(row.maxFare),
      commissionPerPassenger: Number(row.commission),
      description: row.description.trim() || undefined,
    })),
  };
}
