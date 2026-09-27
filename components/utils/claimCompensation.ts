export type InjuryTierKey = 'minor' | 'moderate' | 'severe';

export type ClaimCompensationTier = {
  injuryType: InjuryTierKey;
  minAmount: number;
  maxAmount: number;
  description?: string;
};

export function getDefaultClaimCompensationTiers(): ClaimCompensationTier[] {
  return [
    {
      injuryType: 'minor',
      minAmount: 200,
      maxAmount: 1000,
      description: 'Minor injuries (bruises, cuts, minor trauma)',
    },
    {
      injuryType: 'moderate',
      minAmount: 1000,
      maxAmount: 5000,
      description: 'Moderate injuries (fractures, sprains, significant trauma)',
    },
    {
      injuryType: 'severe',
      minAmount: 5000,
      maxAmount: 20000,
      description: 'Severe injuries (major fractures, head injuries, permanent damage)',
    },
  ];
}

export function parseClaimCompensationTiers(data: unknown): ClaimCompensationTier[] {
  const list = Array.isArray(data) ? data : [];
  const parsed = list
    .map((row): ClaimCompensationTier | null => {
      if (!row || typeof row !== 'object') return null;
      const r = row as Record<string, unknown>;
      const injuryType = String(r.injuryType ?? '') as InjuryTierKey;
      if (!['minor', 'moderate', 'severe'].includes(injuryType)) return null;
      const minAmount = Number(r.minAmount);
      const maxAmount = Number(r.maxAmount);
      if (!Number.isFinite(minAmount) || !Number.isFinite(maxAmount)) return null;
      return {
        injuryType,
        minAmount,
        maxAmount,
        description: r.description != null ? String(r.description) : undefined,
      };
    })
    .filter((t): t is ClaimCompensationTier => t != null);

  if (parsed.length === 0) {
    return getDefaultClaimCompensationTiers();
  }

  const order: InjuryTierKey[] = ['minor', 'moderate', 'severe'];
  return [...parsed].sort(
    (a, b) => order.indexOf(a.injuryType) - order.indexOf(b.injuryType)
  );
}

export function tiersToRecord(
  tiers: ClaimCompensationTier[]
): Record<InjuryTierKey, ClaimCompensationTier> {
  const defaults = getDefaultClaimCompensationTiers();
  const map = Object.fromEntries(defaults.map((t) => [t.injuryType, t])) as Record<
    InjuryTierKey,
    ClaimCompensationTier
  >;
  for (const tier of tiers) {
    map[tier.injuryType] = tier;
  }
  return map;
}
