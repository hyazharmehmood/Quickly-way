'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MessageSquare, Plus, ChevronRight } from 'lucide-react';
import { useContactSupport } from '@/context/ContactSupportContext';
import api from '@/utils/api';
import { format } from 'date-fns';
import Link from 'next/link';
import useAuthStore from '@/store/useAuthStore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function SupportPage() {
  const { openContactSupport } = useContactSupport();
  const { isLoggedIn } = useAuthStore();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchTickets = useCallback(async () => {
    if (!isLoggedIn) {
      setTickets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      const res = await api.get(`/support/tickets?${params.toString()}`);
      if (res.data?.success) setTickets(res.data.tickets || []);
    } catch (e) {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, search]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    const onCreated = () => fetchTickets();
    window.addEventListener('support-ticket-created', onCreated);
    return () => window.removeEventListener('support-ticket-created', onCreated);
  }, [fetchTickets]);

  if (!isLoggedIn) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="heading-3">Help & Support</h3>
          <p className="text-muted-foreground mt-2 mb-6">
            Sign in to view your support history or open a new request.
          </p>
          <Button onClick={openContactSupport}>Contact Support</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="heading-3">My support tickets</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Open any ticket to see details and communicate with support.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-full sm:w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {/* <Button onClick={openContactSupport} className="shrink-0 w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            New request
          </Button> */}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <MessageSquare className="h-14 w-14 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground font-medium">No support tickets yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-6">Create a ticket to get help from our team.</p>
            <Button onClick={openContactSupport}>
              <Plus className="mr-2 h-4 w-4" />
              Contact Support
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tickets.map((t) => (
            <Link key={t.id} href={`/support/${t.id}`} className="group block h-full">
              <Card className="h-full shadow-none overflow-hidden border-border hover:border-primary/40 hover:shadow-lg transition-all duration-200 group-hover:shadow-md">
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs text-muted-foreground">#{t.ticketNo}</span>
                    <Badge
                      variant="outline"
                      className={
                        t.status === 'RESOLVED'
                          ? 'bg-green-500/10 text-green-700 border-green-200'
                          : t.status === 'AGENT_ASSIGNED'
                            ? 'bg-blue-500/10 text-blue-700 border-blue-200'
                            : 'bg-amber-500/10 text-amber-700 border-amber-200'
                      }
                    >
                      {t.status === 'OPEN' ? 'Open' : t.status === 'AGENT_ASSIGNED' ? 'Agent assigned' : 'Resolved'}
                    </Badge>
                  </div>
                  <p className="font-semibold text-foreground line-clamp-1 mb-1">{t.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2 flex-1 min-h-[2.5rem]">
                    {t.description}
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(t.createdAt), 'dd MMM yyyy')} · {format(new Date(t.createdAt), 'h:mm a')}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  {(t._count?.attachments > 0 || t.attachments?.length > 0) && (
                    <p className="text-xs text-muted-foreground mt-1">Has attachments</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
