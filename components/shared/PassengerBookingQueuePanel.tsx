import React from 'react';
import { Trash2, Users } from 'lucide-react';
import { Button } from '../ui/button';
import type { QueuedPassengerBooking } from './bulkPassengerBooking';

interface PassengerBookingQueuePanelProps {
  queue: QueuedPassengerBooking[];
  onRemove?: (queueId: string) => void;
}

export function PassengerBookingQueuePanel({
  queue,
  onRemove,
}: PassengerBookingQueuePanelProps) {
  if (queue.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
        <Users className="h-5 w-5 mx-auto mb-2 opacity-60" />
        Booked passengers will appear here after each ticket is printed.
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-muted/30">
      <div className="flex items-center justify-between px-3 py-2 border-b text-sm font-medium">
        <span>Booked this session ({queue.length})</span>
      </div>
      <ul className="max-h-40 overflow-y-auto divide-y">
        {queue.map((entry) => (
          <li
            key={entry.queueId}
            className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
          >
            <div className="min-w-0">
              <p className="font-medium truncate">{entry.name}</p>
              <p className="text-muted-foreground truncate">{entry.phone}</p>
            </div>
            {onRemove && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8 text-muted-foreground hover:text-red-600"
                onClick={() => onRemove(entry.queueId)}
                aria-label={`Remove ${entry.name} from list`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
