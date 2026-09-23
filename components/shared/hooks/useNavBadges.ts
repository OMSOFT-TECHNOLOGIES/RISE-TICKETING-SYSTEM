import { useEffect, useState } from 'react';
import type { PageId } from '../../config/pages';
import { useAuth } from '../../AuthContext';
import { canViewNavItem } from '../../utils/navAccess';
import { deathTrapApi, getAuthToken, incidentClaimApi } from '../../utils/api';
import { extractListTotal, extractStatCount } from '../../utils/api/client';
import { getPageConfig } from '../../config/pages';

type NavBadgeMap = Partial<Record<PageId, string>>;

async function fetchPendingClaimsCount(): Promise<number> {
  const stats = await incidentClaimApi.getStatistics();
  if (stats.success && stats.data) {
    const pending = extractStatCount(stats.data, ['pending', 'pendingClaims', 'open']);
    if (pending > 0) return pending;
  }

  const list = await incidentClaimApi.getAll({ status: 'pending', limit: 1, page: 1 });
  if (list.success) {
    return extractListTotal(list.data, 'claims');
  }

  return 0;
}

async function fetchOpenHazardCount(): Promise<number> {
  const stats = await deathTrapApi.getStatistics();
  if (stats.success && stats.data) {
    const open = extractStatCount(stats.data, [
      'open',
      'active',
      'reported',
      'pending',
      'unresolved',
    ]);
    if (open > 0) return open;
  }

  const list = await deathTrapApi.getAll({ status: 'reported', limit: 1, page: 1 });
  if (list.success) {
    return extractListTotal(list.data, 'deathTraps');
  }

  return 0;
}

export function useNavBadges(): NavBadgeMap {
  const { isAuthenticated, hasPermission, isSuperAdmin, user } = useAuth();
  const [badges, setBadges] = useState<NavBadgeMap>({});

  useEffect(() => {
    if (!isAuthenticated || !getAuthToken()) {
      setBadges({});
      return;
    }

    let cancelled = false;

    const loadBadges = async () => {
      const next: NavBadgeMap = {};
      const claimsPage = getPageConfig('incident-claims');
      const hazardsPage = getPageConfig('death-traps');

      const canViewClaims =
        claimsPage &&
        (isSuperAdmin() || canViewNavItem(claimsPage, hasPermission, user?.role));

      const canViewHazards =
        hazardsPage &&
        (isSuperAdmin() || canViewNavItem(hazardsPage, hasPermission, user?.role));

      try {
        if (canViewClaims) {
          const count = await fetchPendingClaimsCount();
          if (count > 0) next['incident-claims'] = String(count);
        }

        if (canViewHazards) {
          const count = await fetchOpenHazardCount();
          if (count > 0) next['death-traps'] = String(count);
        }
      } catch {
        // Ignore badge fetch failures — sidebar should still render
      }

      if (!cancelled) {
        setBadges(next);
      }
    };

    void loadBadges();
    const intervalId = window.setInterval(() => {
      void loadBadges();
    }, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, hasPermission, isSuperAdmin, user?.id, user?.role]);

  return badges;
}
