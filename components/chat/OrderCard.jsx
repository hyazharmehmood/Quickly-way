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
    color: 'bg-green-500',
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
console.log("order, conversationId, onOrderUpdate",order, conversationId, onOrderUpdate);
  if (!order) return null;


  let orderStatus = order.status;
  
  // Handle enum values - convert to string if needed
  if (typeof orderStatus === 'number') {
    const statusMap = ['PENDING_ACCEPTANCE', 'IN_PROGRESS', 'DELIVERED', 'REVISION_REQUESTED', 'COMPLETED', 'CANCELLED', 'DISPUTED'];
    orderStatus = statusMap[orderStatus] || 'PENDING_ACCEPTANCE';
  }
  
  // If status is missing, undefined, null, or empty string, default to PENDING_ACCEPTANCE
  if (!orderStatus || orderStatus === '' || !STATUS_CONFIG[orderStatus]) {
    orderStatus = 'PENDING_ACCEPTANCE';
  }
  
  // Debug log to help identify status issues (only in development)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('OrderCard - Order Status Debug:', {
      orderId: order.id,
      rawStatus: order.status,
      orderStatus,
      hasStatusConfig: !!STATUS_CONFIG[orderStatus],
    });
  }
  
  // Get status config - should always have a valid config now
  const statusConfig = STATUS_CONFIG[orderStatus] || STATUS_CONFIG.PENDING_ACCEPTANCE;
  const isClient = role === 'CLIENT';
  const isFreelancer = role === 'FREELANCER';
  const isClientOrder = order.clientId === user?.id;
  const isFreelancerOrder = order.freelancerId === user?.id;

  // Get service title from service
  const serviceTitle = order.service?.title || 'Service Order';
  const deliveryDate = order.deliveryDate ? format(new Date(order.deliveryDate), 'd MMM, yyyy') : null;

  // Handle accept order (CLIENT accepts order)
  const handleAccept = async () => {
    if (!isClient || !isClientOrder) return;

    setIsLoading(true);
    try {
      const response = await api.post(`/orders/${order.id}/accept`);
      if (response.data.success) {
        toast.success('Order accepted successfully');
        onOrderUpdate?.(response.data.order);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to accept order');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reject order (CLIENT rejects order)
  const handleReject = async () => {
    if (!isClient || !isClientOrder || !rejectionReason.trim()) return;

    setIsLoading(true);
    try {
      const response = await api.post(`/orders/${order.id}/reject`, {
        rejectionReason: rejectionReason.trim(),
      });
      if (response.data.success) {
        toast.success('Order rejected');
        onOrderUpdate?.(response.data.order);
        setShowRejectDialog(false);
        setRejectionReason('');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject order');
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

  // Check if user can perform actions - use orderStatus variable
  const canAccept = isClient && isClientOrder && orderStatus === 'PENDING_ACCEPTANCE';
  const canReject = isClient && isClientOrder && orderStatus === 'PENDING_ACCEPTANCE';
  const canComplete = isClient && isClientOrder && orderStatus === 'DELIVERED';
  const canRequestRevision = isClient && isClientOrder && orderStatus === 'DELIVERED' && 
                            (order.revisionsUsed || 0) < (order.revisionsIncluded || 0);

  return (
    <Card className="p-4 sm:p-5 mb-4 border border-gray-200 bg-white rounded-2xl shadow-sm w-full max-w-full">
      {/* Header: Status Badge and Price */}
      <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
        <Badge className={`${statusConfig.color} ${statusConfig.textColor} px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase flex-shrink-0`}>
          {statusConfig.label}
        </Badge>
        <div className="text-right flex-shrink-0">
          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-900">
            {order.currency || 'USD'} {order.price?.toFixed(0) || '0'}
          </div>
        </div>
      </div>

      {/* Service Title */}
      <h3 className="text-lg sm:text-xl font-bold text-blue-900 mb-2 sm:mb-3 leading-tight break-words">
        {serviceTitle}
      </h3>

      {/* Due Date */}
      {deliveryDate && (
        <div className="flex items-center gap-2 text-blue-900 mb-3 sm:mb-4">
          <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium">Due {deliveryDate}</span>
        </div>
      )}

      {/* Action Buttons - Show Accept and Reject side by side for PENDING_ACCEPTANCE */}
      {(canAccept || canReject) && (
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          {canAccept && (
            <Button
              size="sm"
              onClick={handleAccept}
              disabled={isLoading}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm sm:text-base"
            >
              <CheckCircle2 className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Accept Order</span>
              <span className="sm:hidden">Accept</span>
            </Button>
          )}

          {canReject && (
            <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isLoading}
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50 text-sm sm:text-base"
                >
                  <XCircle className="h-4 w-4 mr-1 sm:mr-2" />
                  Reject
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-[95vw] sm:max-w-lg mx-4">
                <AlertDialogHeader>
                  <AlertDialogTitle>Reject Order</AlertDialogTitle>
                  <AlertDialogDescription>
                    Please provide a reason for rejecting this order.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                  <Textarea
                    placeholder="Reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="w-full"
                  />
                </div>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                  <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleReject}
                    disabled={!rejectionReason.trim() || isLoading}
                    className="w-full sm:w-auto bg-destructive text-destructive-foreground"
                  >
                    Reject Order
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}

      {/* Other Action Buttons */}
      {(canComplete || canRequestRevision) && (
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          {canComplete && (
            <Button
              size="sm"
              onClick={handleComplete}
              disabled={isLoading}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm sm:text-base"
            >
              <CheckCircle2 className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Accept & Complete</span>
              <span className="sm:hidden">Complete</span>
            </Button>
          )}

          {canRequestRevision && (
            <AlertDialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isLoading}
                  className="flex-1 text-sm sm:text-base"
                >
                  <RefreshCw className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Request Revision</span>
                  <span className="sm:hidden">Revision</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-[95vw] sm:max-w-lg mx-4">
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
                    className="w-full"
                  />
                </div>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                  <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRequestRevision}
                    disabled={!revisionReason.trim() || isLoading}
                    className="w-full sm:w-auto"
                  >
                    Request Revision
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}
      
      {/* View Order Button - Always show at bottom */}
      <Button
        size="sm"
        onClick={() => {
          if (role === 'FREELANCER') {
            router.push(`/dashboard/freelancer/orders`);
          } else {
            router.push(`/orders/${order.id}`);
          }
        }}
        className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg mt-4 text-sm sm:text-base"
      >
        <Eye className="h-4 w-4 mr-2" />
        View Order
      </Button>
    </Card>
  );
}
