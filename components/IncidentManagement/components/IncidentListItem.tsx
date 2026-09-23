import React from 'react';
import { ChevronRight, MapPin } from 'lucide-react';
import { cn } from '../../ui/utils';
import type { Incident } from '../types';
import { formatRelativeTime, formatTypeLabel } from '../utils';
import { SeverityIndicator } from './SeverityIndicator';
import { StatusBadge } from './StatusBadge';

interface IncidentListItemProps {
  incident: Incident;
  isSelected?: boolean;
  onClick: () => void;
}

export function IncidentListItem({ incident, isSelected, onClick }: IncidentListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-3 border-b transition-colors hover:bg-muted/40',
        isSelected && 'bg-[#193cb8]/5 border-l-2 border-l-[#193cb8]'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono text-muted-foreground">{incident.id}</span>
            <SeverityIndicator severity={incident.severity} />
          </div>
          <p className="text-sm font-medium line-clamp-1">{incident.title}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="line-clamp-1">{incident.location}</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={incident.status} />
            <span className="text-[11px] text-muted-foreground">
              {formatTypeLabel(incident.type)} · {formatRelativeTime(incident.reportedAt)}
            </span>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
      </div>
    </button>
  );
}
