"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Package, 
  RefreshCw, 
  AlertCircle,
  FileText,
  Calendar,
  DollarSign,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import api from '@/utils/api';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import useAuthStore from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

const STATUS_CONFIG = {
  PENDING_ACCEPTANCE: {
    label: 'PENDING',
    color: 'bg-green-500',
    textColor: 'text-white',
  },
  IN_PROGRESS: {
    label: 'IN PROGRESS',
    color: 'bg-blue-500',
    textColor: 'text-white',
  },
  DELIVERED: {
    label: 'DELIVERED',
    color: 'bg-purple-500',
    textColor: 'text-white',
  },
  REVISION_REQUESTED: {
    label: 'REVISION REQUESTED',
    color: 'bg-orange-500',
    textColor: 'text-white',
  },
  COMPLETED: {
    label: 'COMPLETED',
    color: 'bg-green-600',
    textColor: 'text-white',
  },
  CANCELLED: {
    label: 'CANCELLED',
    color: 'bg-red-500',
    textColor: 'text-white',
  },
  DISPUTED: {
    label: 'DISPUTED',
    color: 'bg-red-600',
    textColor: 'text-white',
  },
};

export function OrderCard({ order, conversationId, onOrderUpdate }) {
  const { user, role } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [revisionReason, setRevisionReason] = useState('');

  if (!order) return null;

  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING_ACCEPTANCE;
  const isClient = role === 'CLIENT';
  const isFreelancer = role === 'FREELANCER';
  const isClientOrder = order.clientId === user?.id;
  const isFreelancerOrder = order.freelancerId === user?.id;

  // Get service title from contract or service
  const serviceTitle = order.contract?.serviceTitle || order.service?.title || 'Service Order';
  const deliveryDate = order.deliveryDate ? format(new Date(order.deliveryDate), 'd MMM, yyyy') : null;

  // Handle accept order (CLIENT accepts freelancer's contract)
  const handleAccept = async () => {
    if (!isClient || !isClientOrder) return;

    setIsLoading(true);
    try {
      const response = await api.post(`/orders/${order.id}/accept`);
      if (response.data.success) {
        toast.success('Contract accepted successfully');
        onOrderUpdate?.(response.data.order);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to accept contract');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reject order (CLIENT rejects freelancer's contract)
  const handleReject = async () => {
    if (!isClient || !isClientOrder || !rejectionReason.trim()) return;

    setIsLoading(true);
    try {
      const response = await api.post(`/orders/${order.id}/reject`, {
        rejectionReason: rejectionReason.trim(),
      });
      if (response.data.success) {
        toast.success('Contract rejected');
        onOrderUpdate?.(response.data.order);
        setShowRejectDialog(false);
        setRejectionReason('');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject contract');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle complete order (client only)
  const handleComplete = async () => {
    if (!isClient || !isClientOrder) return;

    const latestDeliverable = order.deliverables?.[0];
    if (!latestDeliverable) {
      toast.error('No deliverable found');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post(`/orders/${order.id}/complete`, {
        deliverableId: latestDeliverable.id,
      });
      if (response.data.success) {
        toast.success('Order completed successfully');
        onOrderUpdate?.(response.data.order);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to complete order');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle request revision (client only)
  const handleRequestRevision = async () => {
    if (!isClient || !isClientOrder || !revisionReason.trim()) return;

    setIsLoading(true);
    try {
      const response = await api.post(`/orders/${order.id}/revision`, {
        reason: revisionReason.trim(),
      });
      if (response.data.success) {
        toast.success('Revision requested');
        onOrderUpdate?.(response.data.order);
        setShowRevisionDialog(false);
        setRevisionReason('');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to request revision');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user can perform actions
  const canAccept = isClient && isClientOrder && order.status === 'PENDING_ACCEPTANCE';
  const canReject = isClient && isClientOrder && order.status === 'PENDING_ACCEPTANCE';
  const canComplete = isClient && isClientOrder && order.status === 'DELIVERED';
  const canRequestRevision = isClient && isClientOrder && order.status === 'DELIVERED' && 
                            (order.revisionsUsed || 0) < (order.revisionsIncluded || 0);

  return (
    <Card className="p-5 mb-4 border border-gray-200 bg-white rounded-2xl shadow-sm">
      {/* Header: Status Badge and Price */}
      <div className="flex items-start justify-between mb-4">
        <Badge className={`${statusConfig.color} ${statusConfig.textColor} px-3 py-1 rounded-full text-xs font-bold uppercase`}>
          {statusConfig.label}
        </Badge>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">
            {order.currency || 'USD'} {order.price?.toFixed(0) || '0'}
          </div>
        </div>
      </div>

      {/* Service Title */}
      <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
        {serviceTitle}
      </h3>

      {/* Due Date */}
      {deliveryDate && (
        <div className="flex items-center gap-2 text-gray-600 mb-4">
          <Clock className="h-4 w-4" />
          <span className="text-sm">Due {deliveryDate}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        {canAccept && (
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={isLoading}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white"
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Accept Contract
          </Button>
        )}

        {canReject && (
          <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                disabled={isLoading}
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reject Contract</AlertDialogTitle>
                <AlertDialogDescription>
                  Please provide a reason for rejecting this contract.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4">
                <Textarea
                  placeholder="Reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReject}
                  disabled={!rejectionReason.trim() || isLoading}
                  className="bg-destructive text-destructive-foreground"
                >
                  Reject Contract
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {canComplete && (
          <Button
            size="sm"
            onClick={handleComplete}
            disabled={isLoading}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white"
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Accept & Complete
          </Button>
        )}

        {canRequestRevision && (
          <AlertDialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                disabled={isLoading}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Request Revision
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Request Revision</AlertDialogTitle>
                <AlertDialogDescription>
                  Please describe what changes you need.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4">
                <Textarea
                  placeholder="What changes do you need?"
                  value={revisionReason}
                  onChange={(e) => setRevisionReason(e.target.value)}
                  rows={3}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRequestRevision}
                  disabled={!revisionReason.trim() || isLoading}
                >
                  Request Revision
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* View Order Button - Always visible */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push(`/orders/${order.id}`)}
          className="bg-green-500 hover:bg-green-600 text-white border-0"
        >
          <Eye className="h-4 w-4 mr-1" />
          View Order
        </Button>
      </div>
    </Card>
  );
}
