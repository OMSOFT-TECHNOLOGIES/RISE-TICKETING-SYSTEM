import React from 'react';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

type ActionIconButtonProps = {
  label: string;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
};

export function ActionIconButton({
  label,
  onClick,
  className,
  children,
  disabled,
}: ActionIconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={className}
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}
