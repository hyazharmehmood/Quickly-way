'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { CircleDot, CircleOff, ChevronDown } from 'lucide-react';
import { cn } from '@/utils';
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

  const activeLabel =
    state.online && !state.offline
      ? 'Online sellers'
      : state.offline && !state.online
      ? 'Offline sellers'
      : 'Seller status';

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" >
          {activeLabel}
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="">
        <DropdownMenuItem
          onClick={() => handleToggle('online')}
        
         
        >
          <Checkbox checked={state.online} readOnly className="pointer-events-none" />
          
          <span className="flex-1 text-left">Online</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleToggle('offline')}
          
        >
          <Checkbox checked={state.offline} readOnly className="pointer-events-none" />
     
          <span className="flex-1 text-left">Offline</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
