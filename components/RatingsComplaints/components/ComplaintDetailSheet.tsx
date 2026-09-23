import React from 'react';
import { Mail, MapPin, Phone, Send } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../ui/sheet';
import { ScrollArea } from '../../ui/scroll-area';
import { Separator } from '../../ui/separator';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import type { Complaint } from '../types';
import { formatFeedbackDate, getCategoryLabel } from '../utils';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';

interface ComplaintDetailSheetProps {
  complaint: Complaint | null;
  open: boolean;
  responseText: string;
  onResponseTextChange: (text: string) => void;
  onOpenChange: (open: boolean) => void;
  onSubmitResponse: () => void;
}

function DetailField({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm mt-0.5">{value}</p>
    </div>
  );
}

export function ComplaintDetailSheet({
  complaint,
  open,
  responseText,
  onResponseTextChange,
  onOpenChange,
  onSubmitResponse,
}: ComplaintDetailSheetProps) {
  if (!complaint) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col gap-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <span className="font-mono text-xs text-muted-foreground">{complaint.id}</span>
          <SheetTitle className="text-left text-lg leading-snug">{complaint.passengerName}</SheetTitle>
          <SheetDescription className="text-left">{getCategoryLabel(complaint.category)}</SheetDescription>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-5 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <DetailField label="Ticket" value={complaint.ticketId} />
              <DetailField label="Submitted" value={formatFeedbackDate(complaint.submittedDate)} />
              <DetailField
                label="Phone"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    {complaint.passengerPhone}
                  </span>
                }
              />
              <DetailField
                label="Email"
                value={
                  <span className="inline-flex items-center gap-1.5 truncate">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {complaint.passengerEmail}
                  </span>
                }
              />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <DetailField label="Route" value={complaint.route} />
              <DetailField label="Vehicle" value={complaint.vehicle} />
              <DetailField label="Driver" value={complaint.driver} />
              <DetailField label="Station" value={complaint.stationName} />
            </div>

            <Separator />

            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-2">Description</p>
              <p className="text-sm text-muted-foreground leading-relaxed p-3 rounded-lg bg-muted/50 border">
                {complaint.description}
              </p>
            </div>

            {complaint.response && (
              <>
                <Separator />
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-2">Previous Response</p>
                  <div className="p-3 rounded-lg border bg-[#193cb8]/5 border-[#193cb8]/20">
                    <p className="text-sm">{complaint.response}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {complaint.respondedBy} ·{' '}
                      {complaint.responseDate
                        ? new Date(complaint.responseDate).toLocaleString()
                        : ''}
                    </p>
                  </div>
                </div>
              </>
            )}

            {complaint.status !== 'resolved' && (
              <>
                <Separator />
                <div className="space-y-3 pb-2">
                  <Label htmlFor="complaint-response">Your Response</Label>
                  <Textarea
                    id="complaint-response"
                    placeholder="Provide a detailed response to address the customer's concern..."
                    value={responseText}
                    onChange={(e) => onResponseTextChange(e.target.value)}
                    rows={4}
                  />
                  <Button onClick={onSubmitResponse} className="w-full bg-[#193cb8] hover:bg-[#152f94]">
                    <Send className="h-4 w-4 mr-2" />
                    Send Response
                  </Button>
                </div>
              </>
            )}

            <div className="flex items-start gap-2 text-xs text-muted-foreground pb-2">
              <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{complaint.route}</span>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
