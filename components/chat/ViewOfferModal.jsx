"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

export const OFFER_STATUS_CONFIG = {
  PENDING: { label: 'PENDING', color: 'bg-yellow-500', textColor: 'text-white' },
  ACCEPTED: { label: 'ACCEPTED', color: 'bg-green-500', textColor: 'text-white' },
  REJECTED: { label: 'REJECTED', color: 'bg-red-500', textColor: 'text-white' },
  EXPIRED: { label: 'EXPIRED', color: 'bg-gray-500', textColor: 'text-white' },
};

const DetailSection = ({ title, children, className = '' }) => (
  <div className={className}>
    <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
    {children}
  </div>
);

export function ViewOfferModal({ offer, open, onOpenChange }) {
  const router = useRouter();
  if (!offer) return null;

  const status = offer.status || 'PENDING';
  const config = OFFER_STATUS_CONFIG[status] || OFFER_STATUS_CONFIG.PENDING;
  const deliveryDate = offer.deliveryTime
    ? format(new Date(Date.now() + offer.deliveryTime * 24 * 60 * 60 * 1000), 'd MMM, yyyy')
    : null;
  const isAccepted = status === 'ACCEPTED';
  const isRejected = status === 'REJECTED';

  const handleViewOrder = () => {
    onOpenChange(false);
    if (offer.order?.id) router.push(`/orders/${offer.order.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-xl max-h-[calc(100vh-100px)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 pr-6">
            <span>Offer Details</span>
            <Badge className={`${config.color} ${config.textColor} px-2 py-0.5`}>
              {config.label}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <DetailSection title="Service">
            <p className="text-gray-700">{offer.serviceTitle || 'Custom Offer'}</p>
          </DetailSection>

          {offer.serviceDescription && (
            <DetailSection title="Description">
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{offer.serviceDescription}</p>
            </DetailSection>
          )}

          <DetailSection title="Scope of Work">
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{offer.scopeOfWork}</p>
          </DetailSection>

          <div className="grid grid-cols-2 gap-4">
            <DetailSection title="Price">
              <p className="text-lg font-bold text-blue-900">
                {offer.currency || 'USD'} {offer.price?.toFixed(0) || '0'}
              </p>
            </DetailSection>
            <DetailSection title="Delivery">
              <p className="text-sm text-gray-600">
                {offer.deliveryTime} days{deliveryDate && ` (${deliveryDate})`}
              </p>
            </DetailSection>
          </div>

          {offer.revisionsIncluded > 0 && (
            <DetailSection title="Revisions">
              <p className="text-sm text-gray-600">{offer.revisionsIncluded} revisions included</p>
            </DetailSection>
          )}

          {offer.cancellationPolicy && (
            <DetailSection title="Cancellation Policy">
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{offer.cancellationPolicy}</p>
            </DetailSection>
          )}

          {isAccepted && offer.order && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800 font-medium">Offer accepted</p>
              <p className="text-xs text-green-600 mt-1">Order #{offer.order.orderNumber}</p>
              <Button size="sm" className="mt-2" onClick={handleViewOrder}>
                View Order
              </Button>
            </div>
          )}

          {isRejected && offer.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800 font-medium">Rejection reason</p>
              <p className="text-xs text-red-600 mt-1">{offer.rejectionReason}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
