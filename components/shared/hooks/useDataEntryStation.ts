import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { stationApi } from '../../utils/api';
import {
  mustSelectStationForDataEntry,
  stationIdForDataEntry,
} from '../../utils/stationScope';
import { parseStationsFromApiResponse, type StationPickerOption } from '../../utils/stationPicker';
import { notify } from '../../utils/notify';

export type StationOption = StationPickerOption;

export function useDataEntryStation() {
  const { user } = useAuth();
  const needsPicker = mustSelectStationForDataEntry(user?.role);
  const [stationId, setStationId] = useState('');
  const [stations, setStations] = useState<StationPickerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadStations = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      let response = await stationApi.getAll({ status: 'active', limit: 500, page: 1 });
      if (response.success && response.data) {
        let parsed = parseStationsFromApiResponse(response.data);
        if (parsed.length === 0) {
          response = await stationApi.getAll({ limit: 500, page: 1 });
          if (response.success && response.data) {
            parsed = parseStationsFromApiResponse(response.data);
          }
        }
        setStations(parsed);
        if (parsed.length === 0) {
          setLoadError('No stations returned from the server.');
        }
        return;
      }
      const message =
        typeof response.error === 'string'
          ? response.error
          : 'Could not load stations from the backend.';
      setStations([]);
      setLoadError(message);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load stations.';
      setStations([]);
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!needsPicker) {
      setStations([]);
      setLoadError(null);
      return;
    }
    void loadStations();
  }, [needsPicker, loadStations]);

  const effectiveStationId = stationIdForDataEntry(user, stationId);

  const requireStationId = useCallback((): string | null => {
    const id = stationIdForDataEntry(user, stationId);
    if (!id) {
      notify.error('Select a station', {
        description:
          loadError ??
          'Choose which station this record belongs to before continuing.',
      });
      return null;
    }
    return id;
  }, [user, stationId, loadError]);

  const selectedStation = stations.find((s) => s.id === effectiveStationId);

  return {
    needsPicker,
    stationId,
    setStationId,
    stations,
    loading,
    loadError,
    reloadStations: loadStations,
    effectiveStationId,
    selectedStation,
    requireStationId,
  };
}
