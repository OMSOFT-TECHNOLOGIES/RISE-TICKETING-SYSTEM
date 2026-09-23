import React from 'react';
import { Download, Eye, Reply, Search } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { COMPLAINT_CATEGORIES } from '../constants';
import type { Complaint, ComplaintFilters } from '../types';
import { formatFeedbackDate, getCategoryLabel } from '../utils';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';

interface ComplaintsTabProps {
  complaints: Complaint[];
  filters: ComplaintFilters;
  onFiltersChange: (updates: Partial<ComplaintFilters>) => void;
  onViewComplaint: (complaint: Complaint) => void;
  onExport: () => void;
}

export function ComplaintsTab({
  complaints,
  filters,
  onFiltersChange,
  onViewComplaint,
  onExport,
}: ComplaintsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="complaints-search" className="text-xs uppercase tracking-wide text-muted-foreground">
            Search Complaints
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="complaints-search"
              placeholder="Search by passenger, route, or description..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ search: e.target.value })}
              className="pl-10 bg-background"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <Select value={filters.status} onValueChange={(v) => onFiltersChange({ status: v })}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.priority} onValueChange={(v) => onFiltersChange({ priority: v })}>
            <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.category} onValueChange={(v) => onFiltersChange({ category: v })}>
            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {COMPLAINT_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={onExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-background overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h3 className="text-sm font-semibold">Complaints Queue</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {complaints.length} complaint{complaints.length !== 1 ? 's' : ''} matching filters
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs uppercase tracking-wide">Passenger</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Category</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Priority</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Status</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Submitted</TableHead>
              <TableHead className="text-xs uppercase tracking-wide w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {complaints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No complaints match your filters.
                </TableCell>
              </TableRow>
            ) : (
              complaints.map((complaint) => (
                <TableRow key={complaint.id} className="group">
                  <TableCell>
                    <p className="font-medium text-sm">{complaint.passengerName}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">{complaint.route}</p>
                  </TableCell>
                  <TableCell className="text-sm">{getCategoryLabel(complaint.category)}</TableCell>
                  <TableCell><PriorityBadge priority={complaint.priority} /></TableCell>
                  <TableCell><StatusBadge status={complaint.status} /></TableCell>
                  <TableCell className="text-sm">{formatFeedbackDate(complaint.submittedDate)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 opacity-70 group-hover:opacity-100">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onViewComplaint(complaint)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {complaint.status !== 'resolved' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onViewComplaint(complaint)}>
                          <Reply className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
