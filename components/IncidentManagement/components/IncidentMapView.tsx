import React from 'react';
import { ScrollArea } from '../../ui/scroll-area';
import type { Incident } from '../types';
import { GhanaMapCanvas } from './GhanaMapCanvas';
import { IncidentListItem } from './IncidentListItem';

interface IncidentMapViewProps {
  incidents: Incident[];
  selectedId: string | null;
  onSelectIncident: (incident: Incident) => void;
}

export function IncidentMapView({ incidents, selectedId, onSelectIncident }: IncidentMapViewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] min-h-[620px]">
      <GhanaMapCanvas
        incidents={incidents}
        selectedId={selectedId}
        onSelectIncident={onSelectIncident}
        height="620px"
        variant="dark"
      />

      <div className="border-l bg-background flex flex-col">
        <div className="px-4 py-3 border-b">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Case Queue
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {incidents.length} incident{incidents.length !== 1 ? 's' : ''} in view
          </p>
        </div>
        <ScrollArea className="flex-1 h-[560px]">
          {incidents.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">No incidents to display</p>
          ) : (
            incidents.map((incident) => (
              <IncidentListItem
                key={incident.id}
                incident={incident}
                isSelected={incident.id === selectedId}
                onClick={() => onSelectIncident(incident)}
              />
            ))
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
