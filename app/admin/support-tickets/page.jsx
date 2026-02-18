'use client';

import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, MessageSquare, ChevronRight, Calendar, User, UserCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/utils/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Link from 'next/link';

const STATUS_CONFIG = {
  OPEN: { label: 'Open', color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300' },
  AGENT_ASSIGNED: { label: 'Agent assigned', color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300' },
  RESOLVED: { label: 'Resolved', color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/50 dark:text-green-300' },
};

const DEBOUNCE_MS = 400;

export default function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (debouncedQuery) params.search = debouncedQuery;
      const res = await api.get('/support/tickets', { params });
      if (res.data?.success) setTickets(res.data.tickets || []);
    } catch (e) {
      toast.error('Failed to load tickets');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, debouncedQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Support Tickets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage support requests. Open a ticket to reply or assign an agent.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search ticket #, title, name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl border-border"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-40 rounded-xl border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchTickets} className="h-10 w-10 rounded-xl" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center text-muted-foreground">
            <MessageSquare className="h-14 w-14 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No tickets found</p>
            <p className="text-sm mt-1">Try changing filters or search.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tickets.map((t) => (
            <Link key={t.id} href={`/admin/support-tickets/${t.id}`} className="group block h-full">
              <Card className="h-full overflow-hidden border-border hover:border-primary/40 hover:shadow-lg transition-all duration-200 rounded-xl">
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-sm font-medium text-foreground">#{t.ticketNo}</span>
                    <Badge variant="outline" className={STATUS_CONFIG[t.status]?.color || ''}>
                      {STATUS_CONFIG[t.status]?.label || t.status}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-foreground line-clamp-1">{t.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 flex-1 min-h-10 mt-1">{t.description}</p>
                  <div className="text-xs text-muted-foreground mt-2 space-y-1">
                    <p className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 shrink-0" />
                      {t.fullName}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 shrink-0" />
                      Agent: {t.assignedAgent?.name || 'Unassigned'}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      {format(new Date(t.createdAt), 'dd MMM yyyy')}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                      {t._count?.messages ?? 0} message{(t._count?.messages ?? 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center justify-end mt-3 pt-3 border-t border-border">
                    <span className="text-sm font-medium text-primary flex items-center gap-1">
                      Open ticket <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
