'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CircleDot, CircleOff, Users } from 'lucide-react';
import { cn } from '@/utils';

/**
 * Online/Offline seller filter
 * Filters services by freelancer presence status (real-time via Socket.IO)
 */
export function OnlineSellerFilter({ value, onChange, className }) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v)}
      className={cn('flex gap-1', className)}
    >
      <ToggleGroupItem
        value="all"
        aria-label="All sellers"
        className="gap-1.5 px-3 py-1.5 text-xs sm:text-sm"
      >
        <Users className="h-3.5 w-3.5" />
        All
      </ToggleGroupItem>
      <ToggleGroupItem
        value="online"
        aria-label="Online sellers only"
        className="gap-1.5 px-3 py-1.5 text-xs sm:text-sm"
      >
        <CircleDot className="h-3.5 w-3.5 text-green-500" />
        Online
      </ToggleGroupItem>
      <ToggleGroupItem
        value="offline"
        aria-label="Offline sellers only"
        className="gap-1.5 px-3 py-1.5 text-xs sm:text-sm"
      >
        <CircleOff className="h-3.5 w-3.5" />
        Offline
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
