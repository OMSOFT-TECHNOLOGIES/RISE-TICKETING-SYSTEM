import React from 'react';
import { ArrowUpRight, MoreHorizontal } from 'lucide-react';
import { Button } from '../../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import type { Incident } from '../types';
import { formatIncidentDate, formatRelativeTime, formatTypeLabel } from '../utils';
import { SeverityIndicator } from './SeverityIndicator';
import { StatusBadge } from './StatusBadge';

interface IncidentTableProps {
  incidents: Incident[];
  canManage: boolean;
  onView: (incident: Incident) => void;
}

export function IncidentTable({ incidents, canManage, onView }: IncidentTableProps) {
  if (incidents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <ArrowUpRight className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="font-medium">No incidents match your criteria</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Try adjusting filters or report a new incident to begin tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b bg-muted/30">
            <TableHead className="w-[130px] text-xs font-semibold uppercase tracking-wide">Case ID</TableHead>
            <TableHead className="min-w-[240px] text-xs font-semibold uppercase tracking-wide">Summary</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide">Classification</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide">Severity</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide">Status</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide">Region</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide">Reported</TableHead>
            <TableHead className="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {incidents.map((incident) => (
            <TableRow
              key={incident.id}
              className="cursor-pointer group border-b border-border/50 hover:bg-muted/30"
              onClick={() => onView(incident)}
            >
              <TableCell className="font-mono text-xs text-muted-foreground py-4">
                {incident.id}
              </TableCell>
              <TableCell className="py-4">
                <p className="font-medium text-sm leading-snug line-clamp-1 group-hover:text-[#193cb8] transition-colors">
                  {incident.title}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 max-w-md">
                  {incident.location}
                </p>
              </TableCell>
              <TableCell className="py-4">
                <span className="text-sm text-muted-foreground">{formatTypeLabel(incident.type)}</span>
              </TableCell>
              <TableCell className="py-4">
                <SeverityIndicator severity={incident.severity} />
              </TableCell>
              <TableCell className="py-4">
                <StatusBadge status={incident.status} />
              </TableCell>
              <TableCell className="py-4">
                <span className="text-sm">{incident.region}</span>
                <p className="text-xs text-muted-foreground">{incident.district}</p>
              </TableCell>
              <TableCell className="py-4">
                <p className="text-sm tabular-nums">{formatRelativeTime(incident.reportedAt)}</p>
                <p className="text-[11px] text-muted-foreground">{formatIncidentDate(incident.reportedAt)}</p>
              </TableCell>
              <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(incident)}>Open case file</DropdownMenuItem>
                    {canManage && (
                      <DropdownMenuItem disabled>Assign investigator</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
