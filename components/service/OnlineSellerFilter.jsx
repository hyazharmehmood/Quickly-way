'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const DEFAULT_STATE = { online: false, offline: false };

export function OnlineSellerFilter({ value = DEFAULT_STATE, onChange, className }) {
  const state = { ...DEFAULT_STATE, ...(value || {}) };

  const handleToggle = (key) => {
    const currentlyActive = state[key];
    const next = currentlyActive
      ? { online: false, offline: false }
      : { online: key === 'online', offline: key === 'offline' };
    onChange?.(next);
  };

  const isAll = !state.online && !state.offline;
  const activeLabel = state.online && !state.offline
    ? 'Online sellers'
    : state.offline && !state.online
    ? 'Offline sellers'
    : 'All';

  const handleSelectAll = () => {
    onChange?.({ online: false, offline: false });
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="rounded-sm">
          {activeLabel}
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[160px]">
        <DropdownMenuItem onClick={handleSelectAll} className="flex items-center gap-2">
          <Checkbox checked={isAll} readOnly className="pointer-events-none" />
          <span className="flex-1 text-left">All</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleToggle('online')} className="flex items-center gap-2">
          <Checkbox checked={state.online} readOnly className="pointer-events-none" />
          <span className="flex-1 text-left">Online</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleToggle('offline')} className="flex items-center gap-2">
          <Checkbox checked={state.offline} readOnly className="pointer-events-none" />
          <span className="flex-1 text-left">Offline</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
