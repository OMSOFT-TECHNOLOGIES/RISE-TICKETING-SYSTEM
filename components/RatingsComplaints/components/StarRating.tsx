import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '../../ui/utils';

interface StarRatingProps {
  rating: number;
  showValue?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function StarRating({ rating, showValue = true, size = 'md', className }: StarRatingProps) {
  const starSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            starSize,
            star <= rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'
          )}
        />
      ))}
      {showValue && (
        <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">{rating}</span>
      )}
    </div>
  );
}
