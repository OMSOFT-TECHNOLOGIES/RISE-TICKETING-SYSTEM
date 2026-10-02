import type { ApiResponse } from './api/types';
import { parseListResponse, parsePagination } from './api/client';
import { driverApi, stationApi, vehicleApi } from './api';

type Row = Record<string, unknown>;

const PAGE_SIZE = 200;
const MAX_PAGES = 30;
const FAN_OUT_CONCURRENCY = 8;

function rowsFromResponse(data: unknown, entityKey: string): Row[] {
  const parsed = parseListResponse<Row>(data, entityKey);
  if (parsed.length > 0) return parsed;
  if (Array.isArray(data)) return data as Row[];
  return [];
}

function driverMergeKey(row: Row): string {
  const id = String(row.id ?? row.driverId ?? '').trim();
  if (id) return `id:${id.toUpperCase()}`;
  const license = String(row.licenseNumber ?? row.license ?? '').trim();
  if (license) return `lic:${license.toUpperCase()}`;
  const phone = String(row.phone ?? '').trim();
  if (phone) return `ph:${phone}`;
  return '';
}

function mergeDrivers(lists: Row[][]): Row[] {
  const byKey = new Map<string, Row>();
  for (const list of lists) {
    for (const row of list) {
      const key = driverMergeKey(row);
      if (!key) continue;
      byKey.set(key, row);
    }
  }
  return Array.from(byKey.values());
}

function mergeVehicles(lists: Row[][]): Row[] {
  const byKey = new Map<string, Row>();
  for (const list of lists) {
    for (const row of list) {
      const reg = String(
        row.registrationNumber ?? row.registration ?? row.plateNumber ?? row.id ?? ''
      ).trim();
      const key = reg || String(row.id ?? '').trim();
      if (!key) continue;
      byKey.set(key.toUpperCase(), row);
    }
  }
  return Array.from(byKey.values());
}

async function fetchAllPages(
  fetchPage: (page: number) => Promise<ApiResponse>,
  entityKey: string
): Promise<{ rows: Row[]; anySuccess: boolean }> {
  const rows: Row[] = [];
  let anySuccess = false;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await fetchPage(page);
    if (!res.success) break;
    anySuccess = true;
    const batch = rowsFromResponse(res.data, entityKey);
    rows.push(...batch);
    const pag = parsePagination(res.data);
    if (batch.length === 0) break;
    if (pag) {
      if (page >= pag.totalPages) break;
    } else if (batch.length < PAGE_SIZE) {
      break;
    }
  }

  return { rows, anySuccess };
}

async function gatherListRows(
  requests: Promise<ApiResponse>[],
  entityKey: string
): Promise<{ lists: Row[][]; anySuccess: boolean }> {
  const settled = await Promise.all(
    requests.map((req) =>
      req.catch(() => ({ success: false as const, error: 'Request failed' }))
    )
  );
  const out: Row[][] = [];
  let anySuccess = false;
  for (const res of settled) {
    if (res.success) anySuccess = true;
    if (res.success && res.data !== undefined) {
      const rows = rowsFromResponse(res.data, entityKey);
      if (rows.length > 0) out.push(rows);
    }
  }
  return { lists: out, anySuccess };
}

async function fetchAllStationIds(): Promise<string[]> {
  const ids = new Set<string>();

  for (const allRegions of [true, false]) {
    const { rows } = await fetchAllPages(
      (page) =>
        stationApi.getAll({
          page,
          limit: PAGE_SIZE,
          status: 'active',
          ...(allRegions ? { allRegions: true } : {}),
        }),
      'stations'
    );
    for (const row of rows) {
      const id = String(row.id ?? '').trim();
      if (id) ids.add(id);
    }
  }

  return Array.from(ids);
}

async function runPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>
): Promise<void> {
  const queue = [...items];
  const runners = Array.from({ length: Math.min(concurrency, queue.length || 1) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (item === undefined) break;
      await worker(item);
    }
  });
  await Promise.all(runners);
}

/**
 * Many backends scope GET /drivers and GET /vehicles by the user's region but still
 * return per-station lists when stationId is set. Aggregate across all stations the
 * caller can see (and allRegions station lists) for trip assignment dropdowns.
 */
async function fanOutFleetByStation(
  stationIds: string[],
  entity: 'drivers' | 'vehicles'
): Promise<Row[]> {
  if (stationIds.length === 0) return [];

  const lists: Row[][] = [];
  await runPool(stationIds, FAN_OUT_CONCURRENCY, async (stationId) => {
    const api = entity === 'drivers' ? driverApi : vehicleApi;
    const res = await api.getAll({
      stationId,
      page: 1,
      limit: PAGE_SIZE,
      allRegions: true,
    });
    if (res.success && res.data !== undefined) {
      const rows = rowsFromResponse(res.data, entity);
      if (rows.length > 0) lists.push(rows);
    }
  });

  return entity === 'drivers' ? mergeDrivers(lists) : mergeVehicles(lists);
}

async function loadNetworkDrivers(): Promise<{ drivers: Row[]; anySuccess: boolean }> {
  const lists: Row[][] = [];
  let anySuccess = false;

  const addRows = (rows: Row[], ok: boolean) => {
    if (ok) anySuccess = true;
    if (rows.length > 0) lists.push(rows);
  };

  const globalAllRegions = await fetchAllPages(
    (page) => driverApi.getAll({ page, limit: PAGE_SIZE, allRegions: true }),
    'drivers'
  );
  addRows(globalAllRegions.rows, globalAllRegions.anySuccess);

  const globalScoped = await fetchAllPages(
    (page) => driverApi.getAll({ page, limit: PAGE_SIZE }),
    'drivers'
  );
  addRows(globalScoped.rows, globalScoped.anySuccess);

  const shortcuts = await gatherListRows(
    [
      driverApi.getAvailable({ allRegions: true }),
      driverApi.getBookable({ allRegions: true }),
      driverApi.getAvailable(),
      driverApi.getBookable(),
    ],
    'drivers'
  );
  if (shortcuts.anySuccess) anySuccess = true;
  lists.push(...shortcuts.lists);

  let drivers = mergeDrivers(lists);
  const stationIds = await fetchAllStationIds();
  const fromStations = await fanOutFleetByStation(stationIds, 'drivers');
  if (fromStations.length > 0) {
    anySuccess = true;
    drivers = mergeDrivers([drivers, fromStations]);
  }

  return { drivers, anySuccess };
}

async function loadNetworkVehicles(): Promise<{ vehicles: Row[]; anySuccess: boolean }> {
  const lists: Row[][] = [];
  let anySuccess = false;

  const addRows = (rows: Row[], ok: boolean) => {
    if (ok) anySuccess = true;
    if (rows.length > 0) lists.push(rows);
  };

  const globalAllRegions = await fetchAllPages(
    (page) => vehicleApi.getAll({ page, limit: PAGE_SIZE, allRegions: true }),
    'vehicles'
  );
  addRows(globalAllRegions.rows, globalAllRegions.anySuccess);

  const globalScoped = await fetchAllPages(
    (page) => vehicleApi.getAll({ page, limit: PAGE_SIZE }),
    'vehicles'
  );
  addRows(globalScoped.rows, globalScoped.anySuccess);

  const shortcuts = await gatherListRows(
    [
      vehicleApi.getBookable({ allRegions: true }),
      vehicleApi.getBookable(),
    ],
    'vehicles'
  );
  if (shortcuts.anySuccess) anySuccess = true;
  lists.push(...shortcuts.lists);

  let vehicles = mergeVehicles(lists);
  const stationIds = await fetchAllStationIds();
  const fromStations = await fanOutFleetByStation(stationIds, 'vehicles');
  if (fromStations.length > 0) {
    anySuccess = true;
    vehicles = mergeVehicles([vehicles, fromStations]);
  }

  return { vehicles, anySuccess };
}

/** Full network driver pool for schedule-trip dropdowns (not limited to trip station/region). */
export async function loadDriversForTripScheduling(): Promise<ApiResponse<{ drivers: Row[] }>> {
  const { drivers, anySuccess } = await loadNetworkDrivers();

  if (!anySuccess) {
    return {
      success: false,
      error: 'Could not load drivers for trip scheduling.',
    };
  }

  return { success: true, data: { drivers } };
}

/** Full network vehicle pool for schedule-trip dropdowns (not limited to trip station/region). */
export async function loadVehiclesForTripScheduling(): Promise<ApiResponse<{ vehicles: Row[] }>> {
  const { vehicles, anySuccess } = await loadNetworkVehicles();

  if (!anySuccess) {
    return {
      success: false,
      error: 'Could not load vehicles for trip scheduling.',
    };
  }

  return { success: true, data: { vehicles } };
}

const DRIVER_BLOCKED = new Set(['suspended', 'inactive', 'terminated']);

export function isDriverSchedulable(driver: Row): boolean {
  const status = String(driver.status ?? 'active').trim().toLowerCase();
  return !DRIVER_BLOCKED.has(status);
}

const VEHICLE_BLOCKED = new Set([
  'inactive',
  'suspended',
  'out_of_service',
  'broken_down',
  'terminated',
]);

export function isVehicleSchedulable(vehicle: Row): boolean {
  const status = String(vehicle.status ?? 'active').trim().toLowerCase();
  return !VEHICLE_BLOCKED.has(status);
}

export function driverRecordId(driver: Row): string {
  const id = String(driver.id ?? driver.driverId ?? '').trim();
  if (id) return id;
  const license = String(driver.licenseNumber ?? driver.license ?? '').trim();
  if (license) return license;
  return String(driver.phone ?? '').trim();
}

export function vehicleRegistrationForTrip(vehicle: Row): string {
  return String(
    vehicle.registrationNumber ?? vehicle.registration ?? vehicle.plateNumber ?? vehicle.id ?? ''
  ).trim();
}
