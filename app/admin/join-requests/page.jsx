'use client';

import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, UserPlus, Store } from 'lucide-react';
import api from '@/utils/api';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AdminJoinRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/admin/role-agreement-requests');
      if (res.data?.success) setRequests(res.data.requests || []);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load join requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (id, status, reason = '') => {
    if (status === 'REJECTED' && !reason) {
      reason = window.prompt('Enter rejection reason (optional):') || '';
    }
    setActionLoading(true);
    try {
      await api.patch(`/admin/role-agreement-requests/${id}/status`, { status, reason });
      toast.success(`Request ${status.toLowerCase()}!`);
      fetchRequests();
    } catch (error) {
      toast.error(`Failed to ${status.toLowerCase()} request.`);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-normal text-foreground tracking-tight">Join requests</h2>
        <p className="text-muted-foreground mt-1 text-sm font-normal">
          Approve or reject requests from users to join as Client or Seller after they accept the agreement.
        </p>
      </div>

      <Card className="border-none shadow-none">
        <CardHeader className="px-0">
          <CardTitle className="text-xl font-normal">Requests list</CardTitle>
          <CardDescription className="font-normal">
            {pendingCount} request{pendingCount !== 1 ? 's' : ''} pending · {requests.length} total
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/40 hover:bg-secondary/40 border-b border-border">
                  <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">User</TableHead>
                  <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">Requested role</TableHead>
                  <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">Status</TableHead>
                  <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest">Agreed at</TableHead>
                  <TableHead className="px-8 py-5 text-[10px] font-normal text-muted-foreground uppercase tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                      No join requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((req) => (
                    <TableRow key={req.id} className="hover:bg-secondary/10 transition-colors border-b border-border">
                      <TableCell className="px-8 py-6">
                        <div className="font-normal text-foreground">{req.user?.name || '—'}</div>
                        <div className="text-xs text-muted-foreground">{req.user?.email}</div>
                      </TableCell>
                      <TableCell className="px-8 py-6">
                        {req.requestedRole === 'FREELANCER' ? (
                          <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                            <Store className="w-3 h-3" /> Seller
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300">
                            <UserPlus className="w-3 h-3" /> Client
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-8 py-6">
                        <Badge
                          variant="secondary"
                          className={
                            req.status === 'APPROVED'
                              ? 'bg-green-100 text-green-700'
                              : req.status === 'REJECTED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                          }
                        >
                          {req.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-8 py-6 text-sm text-muted-foreground">
                        {req.agreedAt ? format(new Date(req.agreedAt), 'dd MMM yyyy, HH:mm') : '—'}
                      </TableCell>
                      <TableCell className="px-8 py-6 text-right">
                        {req.status === 'PENDING' && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(req.id, 'APPROVED')}
                              disabled={actionLoading}
                              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg h-9"
                            >
                              <Check className="w-4 h-4 mr-1" /> Approve
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateStatus(req.id, 'REJECTED')}
                              disabled={actionLoading}
                              className="text-destructive hover:bg-destructive/10 rounded-lg h-9"
                            >
                              <X className="w-4 h-4 mr-1" /> Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
