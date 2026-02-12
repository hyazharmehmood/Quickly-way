"use client";

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Calendar, RefreshCw, AlertCircle, CreditCard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import api from '@/utils/api';
import useAuthStore from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

const OrderModal = ({ isOpen, onClose, service, conversationId, onOrderCreated }) => {
  const { user, isLoggedIn } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    deliveryTime: service?.deliveryTime || 7,
    revisionsIncluded: 2,
    cancellationPolicy: 'Standard cancellation policy applies. Order can be cancelled within 24 hours of acceptance.',
    paymentMethod: '',
  });

  // Redirect to login if not logged in
  if (!isLoggedIn && isOpen) {
    router.push('/login');
    onClose();
    return null;
  }

  // Check if user is the service owner
  if (user?.id === service?.freelancerId) {
    return null; // Don't show order button for own service
  }

  const servicePaymentMethods = service?.paymentMethods && Array.isArray(service.paymentMethods) && service.paymentMethods.length > 0
    ? service.paymentMethods
    : [];

  useEffect(() => {
    const methods = service?.paymentMethods && Array.isArray(service.paymentMethods) ? service.paymentMethods : [];
    if (methods.length === 1) {
      setFormData(prev => (prev.paymentMethod ? prev : { ...prev, paymentMethod: methods[0] }));
    }
  }, [service?.id, service?.paymentMethods]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!service?.id) {
      toast.error('Service information missing');
      return;
    }

    if (servicePaymentMethods.length > 0 && !formData.paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/orders', {
        serviceId: service.id,
        conversationId: conversationId || null,
        deliveryTime: parseInt(formData.deliveryTime),
        revisionsIncluded: parseInt(formData.revisionsIncluded),
        cancellationPolicy: formData.cancellationPolicy,
        paymentMethodUsed: formData.paymentMethod || null,
      });

      if (response.data.success) {
        toast.success('Order created successfully! Waiting for freelancer acceptance.');
        
        // Callback to parent
        if (onOrderCreated) {
          onOrderCreated(response.data.order);
        }

        // If conversationId exists, navigate to chat
        if (conversationId) {
          router.push(`/messages?conversationId=${conversationId}`);
        } else if (response.data.order?.conversationId) {
          router.push(`/messages?conversationId=${response.data.order.conversationId}`);
        } else {
          router.push('/messages');
        }

        onClose();
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error(error.response?.data?.error || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg rounded-[2.5rem] p-6 border-none shadow-2xl bg-white">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-bold text-gray-900 mt-4 flex items-center justify-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Order Service
          </DialogTitle>
          <DialogDescription className="text-gray-500 text-sm mb-4">
            Create an order for <strong>{service?.title}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Service Info */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">Service Price</span>
              <span className="text-lg font-bold text-gray-900">
                {service?.currency || 'USD'} {service?.price?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Payment will be processed after order acceptance
            </div>
          </div>

          {/* Payment method (freelancer's accepted methods) */}
          {servicePaymentMethods.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="paymentMethod" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Payment method
              </Label>
              <select
                id="paymentMethod"
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                required={servicePaymentMethods.length > 0}
                className="w-full rounded-xl border border-gray-200 bg-white py-3 px-4 text-base text-gray-700 focus:outline-none focus:ring-1 focus:ring-green-500/20 focus:border-green-500"
              >
                <option value="">Select payment method</option>
                {servicePaymentMethods.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                You can pay only with the methods this freelancer accepts for this service.
              </p>
            </div>
          )}

          {/* Delivery Time */}
          <div className="space-y-2">
            <Label htmlFor="deliveryTime" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Delivery Time (Days)
            </Label>
            <Input
              id="deliveryTime"
              type="number"
              min="1"
              max="365"
              value={formData.deliveryTime}
              onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
              required
              className="rounded-xl"
            />
            <p className="text-xs text-gray-500">
              Expected delivery in {formData.deliveryTime} day(s)
            </p>
          </div>

          {/* Revisions Included */}
          <div className="space-y-2">
            <Label htmlFor="revisionsIncluded" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Revisions Included
            </Label>
            <Input
              id="revisionsIncluded"
              type="number"
              min="0"
              max="10"
              value={formData.revisionsIncluded}
              onChange={(e) => setFormData({ ...formData, revisionsIncluded: e.target.value })}
              required
              className="rounded-xl"
            />
            <p className="text-xs text-gray-500">
              Number of free revisions included in this order
            </p>
          </div>

          {/* Cancellation Policy */}
          <div className="space-y-2">
            <Label htmlFor="cancellationPolicy" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Cancellation Policy
            </Label>
            <Textarea
              id="cancellationPolicy"
              value={formData.cancellationPolicy}
              onChange={(e) => setFormData({ ...formData, cancellationPolicy: e.target.value })}
              rows={3}
              className="rounded-xl"
            />
            <p className="text-xs text-gray-500">
              Terms and conditions for order cancellation
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-xs text-blue-700">
              <strong>Note:</strong> After you create this order, the freelancer will need to accept it. 
              Once accepted, the order will be created and work will begin.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-xl bg-[#10b981] hover:bg-[#059669]"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Order'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OrderModal;



