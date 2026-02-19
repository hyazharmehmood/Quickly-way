"use client";

import React, { useState, useEffect } from 'react';
import { AlertCircle, Calendar, Search, RefreshCw, ChevronRight } from 'lucide-react';
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
import Link from 'next/link';

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
    <div className="animate-in fade-in duration-300 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dispute Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Disputes on your orders. View and reply from the order page.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative w-full sm:w-56">
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
          <Button variant="outline" size="icon" onClick={fetchDisputes} className="h-10 w-10 rounded-xl" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : filteredDisputes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center text-muted-foreground">
            <AlertCircle className="h-14 w-14 mx-auto mb-4 opacity-50" />
            <p className="font-medium">{disputes.length === 0 ? 'No disputes yet' : 'No disputes match your filters'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDisputes.map((dispute) => (
            <Link key={dispute.id} href={`/dashboard/seller/orders/${dispute.orderId}`} className="group block h-full">
              <Card className="h-full overflow-hidden border-border hover:border-primary/40 hover:shadow-lg transition-all duration-200">
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    {getStatusBadge(dispute.status)}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {format(new Date(dispute.createdAt), 'dd MMM yyyy')}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground line-clamp-1">{dispute.reason}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 flex-1 min-h-10 mt-1">{dispute.description}</p>
                  <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                    <p>Order: {dispute.order?.orderNumber || dispute.orderId?.slice(0, 8)}</p>
                    <p>Client: {dispute.client?.name || '—'}</p>
                  </div>
                  {dispute.adminResolution && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2 line-clamp-1">Admin resolution added</p>
                  )}
                  <div className="flex items-center justify-end mt-3 pt-3 border-t border-border">
                    <span className="text-sm font-medium text-primary flex items-center gap-1">
                      View order <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
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
