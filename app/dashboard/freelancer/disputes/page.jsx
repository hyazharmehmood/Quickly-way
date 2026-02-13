"use client";

import React, { useState, useEffect } from 'react';
import { AlertCircle, Calendar, Eye, Search, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/utils/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

const STATUS_CONFIG = {
  OPEN: { label: 'OPEN', color: 'bg-red-100 text-red-600 border-red-200' },
  IN_REVIEW: { label: 'IN REVIEW', color: 'bg-orange-100 text-orange-600 border-orange-200' },
  RESOLVED: { label: 'RESOLVED', color: 'bg-green-100 text-green-600 border-green-200' },
  CLOSED: { label: 'CLOSED', color: 'bg-gray-100 text-gray-600 border-gray-200' },
};

export default function FreelancerDisputesPage() {
  const router = useRouter();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDisputes();
  }, [statusFilter]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const response = await api.get('/disputes', { params });
      if (response.data.success) {
        setDisputes(response.data.disputes || []);
      }
    } catch (error) {
      console.error('Error fetching disputes:', error);
      toast.error('Failed to fetch disputes');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.OPEN;
    return (
      <Badge variant="secondary" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const filteredDisputes = disputes.filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.reason?.toLowerCase().includes(q) ||
      d.description?.toLowerCase().includes(q) ||
      d.order?.orderNumber?.toLowerCase().includes(q) ||
      d.client?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="animate-in fade-in duration-300 space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dispute Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Disputes (tickets) on your orders. View and reply from the order page.
        </p>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="px-6 flex flex-row flex-wrap justify-between items-center gap-4">
          <CardTitle className="text-lg font-medium">Your Disputes</CardTitle>
          <div className="flex flex-wrap gap-3">
            <div className="relative w-56">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9 h-10 rounded-xl border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 w-36 rounded-xl border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_REVIEW">In Review</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchDisputes}
              className="h-10 w-10 rounded-xl"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border">
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredDisputes.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              {disputes.length === 0 ? 'No disputes yet' : 'No disputes match your filters'}
            </div>
          ) : (
            filteredDisputes.map((dispute) => (
              <div
                key={dispute.id}
                className="p-6 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {getStatusBadge(dispute.status)}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {format(new Date(dispute.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <h3 className="font-medium text-foreground truncate">{dispute.reason}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{dispute.description}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span>Order: {dispute.order?.orderNumber || dispute.orderId?.slice(0, 8)}</span>
                    <span>•</span>
                    <span>Client: {dispute.client?.name || '—'}</span>
                  </div>
                  {dispute.adminResolution && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-xs font-medium text-green-800 dark:text-green-200">Admin resolution</p>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-0.5 line-clamp-2">
                        {dispute.adminResolution}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex shrink-0">
                  <Button
                    size="sm"
                    className="rounded-xl"
                    onClick={() => router.push(`/dashboard/freelancer/orders/${dispute.orderId}`)}
                  >
                    <Eye className="w-4 h-4 mr-2" /> View order
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
