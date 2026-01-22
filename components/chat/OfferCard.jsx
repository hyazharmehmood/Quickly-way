"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
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
  PENDING: {
    label: 'PENDING',
    color: 'bg-yellow-500',
    textColor: 'text-white',
  },
  ACCEPTED: {
    label: 'ACCEPTED',
    color: 'bg-green-500',
    textColor: 'text-white',
  },
  REJECTED: {
    label: 'REJECTED',
    color: 'bg-red-500',
    textColor: 'text-white',
  },
  EXPIRED: {
    label: 'EXPIRED',
    color: 'bg-gray-500',
    textColor: 'text-white',
  },
};

export function OfferCard({ offer, conversationId, onOfferUpdate }) {
  const { user, role } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  if (!offer) return null;

  const offerStatus = offer.status || 'PENDING';
  const statusConfig = STATUS_CONFIG[offerStatus] || STATUS_CONFIG.PENDING;
  const isClient = role === 'CLIENT';
  const isFreelancer = role === 'FREELANCER';
  const isClientOffer = offer.clientId === user?.id;
  const isFreelancerOffer = offer.freelancerId === user?.id;

  // Calculate delivery date
  const deliveryDate = offer.deliveryTime 
    ? format(new Date(Date.now() + offer.deliveryTime * 24 * 60 * 60 * 1000), 'd MMM, yyyy')
    : null;

  // Handle accept offer (CLIENT accepts freelancer's offer - creates order)
  const handleAccept = async () => {
    if (!isClient || !isClientOffer) return;

    setIsLoading(true);
    try {
      const response = await api.post(`/offers/${offer.id}/accept`);
      if (response.data.success) {
        toast.success('Offer accepted! Order created successfully');
        onOfferUpdate?.(response.data.offer);
        // If order was created, also update with order data
        if (response.data.order) {
          // The order will be shown via real-time update
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to accept offer');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reject offer (CLIENT rejects freelancer's offer - no order created)
  const handleReject = async () => {
    if (!isClient || !isClientOffer || !rejectionReason.trim()) return;

    setIsLoading(true);
    try {
      const response = await api.post(`/offers/${offer.id}/reject`, {
        rejectionReason: rejectionReason.trim(),
      });
      if (response.data.success) {
        toast.success('Offer rejected');
        onOfferUpdate?.(response.data.offer);
        setShowRejectDialog(false);
        setRejectionReason('');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject offer');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user can perform actions
  const canAccept = isClient && isClientOffer && offerStatus === 'PENDING';
  const canReject = isClient && isClientOffer && offerStatus === 'PENDING';
  const isAccepted = offerStatus === 'ACCEPTED';
  const isRejected = offerStatus === 'REJECTED';

  return (
    <Card className="p-4 sm:p-5 mb-4 border border-gray-200 bg-white rounded-2xl shadow-sm w-full max-w-full">
      {/* Header: Status Badge and Price */}
      <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
        <Badge className={`${statusConfig.color} ${statusConfig.textColor} px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase flex-shrink-0`}>
          {statusConfig.label}
        </Badge>
        <div className="text-right flex-shrink-0">
          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-900">
            {offer.currency || 'USD'} {offer.price?.toFixed(0) || '0'}
          </div>
        </div>
      </div>

      {/* Service Title */}
      <h3 className="text-lg sm:text-xl font-bold text-blue-900 mb-2 sm:mb-3 leading-tight break-words">
        {offer.serviceTitle || 'Custom Offer'}
      </h3>

      {/* Scope of Work */}
      {offer.scopeOfWork && (
        <p className="text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-3">
          {offer.scopeOfWork}
        </p>
      )}

      {/* Delivery Time */}
      {deliveryDate && (
        <div className="flex items-center gap-2 text-blue-900 mb-3 sm:mb-4">
          <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium">Delivery in {offer.deliveryTime} days ({deliveryDate})</span>
        </div>
      )}

      {/* Revisions Info */}
      {offer.revisionsIncluded > 0 && (
        <div className="flex items-center gap-2 text-gray-600 mb-3 sm:mb-4">
          <span className="text-xs sm:text-sm">Revisions included: {offer.revisionsIncluded}</span>
        </div>
      )}

      {/* Status Messages */}
      {isAccepted && offer.order && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-green-800 font-medium">
            ✓ Offer accepted! Order has been created.
          </p>
          <p className="text-xs text-green-600 mt-1">
            Order #{offer.order.orderNumber} is now active.
          </p>
        </div>
      )}

      {isRejected && offer.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-800 font-medium">Offer rejected</p>
          <p className="text-xs text-red-600 mt-1">{offer.rejectionReason}</p>
        </div>
      )}

      {/* Action Buttons - Show Accept and Reject side by side for PENDING */}
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
              <span className="hidden sm:inline">Accept Offer</span>
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
                  <AlertDialogTitle>Reject Offer</AlertDialogTitle>
                  <AlertDialogDescription>
                    Please provide a reason for rejecting this offer. No order will be created.
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
                    Reject Offer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}

      {/* View Details Button - Show for freelancer or if offer is accepted/rejected */}
      {(isFreelancerOffer || isAccepted || isRejected) && (
        <Button
          size="sm"
          onClick={() => {
            if (isAccepted && offer.order) {
              router.push(`/orders/${offer.order.id}`);
            } else if (isFreelancer) {
              router.push(`/dashboard/freelancer/offers`);
            } else {
              router.push(`/offers/${offer.id}`);
            }
          }}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg mt-4 text-sm sm:text-base"
        >
          <Eye className="h-4 w-4 mr-2" />
          {isAccepted && offer.order ? 'View Order' : 'View Offer'}
        </Button>
      )}
    </Card>
  );
}

