"use client";

import React, { useState } from 'react';
import { FileText, Calendar, RefreshCw, DollarSign } from 'lucide-react';
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
import { useGlobalSocket } from '@/hooks/useGlobalSocket';

const CreateOfferModal = ({ isOpen, onClose, service, conversationId, clientId, onOfferCreated, existingOrder, existingOffer }) => {
  const { user } = useAuthStore();
  const { socket, isConnected } = useGlobalSocket();
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(service?.id || '');
  const [loadingServices, setLoadingServices] = useState(false);
  const [formData, setFormData] = useState({
    price: service?.price || 0,
    deliveryTime: 7,
    revisionsIncluded: 2,
    scopeOfWork: service?.description || '',
    cancellationPolicy: 'Standard cancellation policy applies. Order can be cancelled within 24 hours of acceptance.',
  });

  // Fetch freelancer's services when modal opens
  React.useEffect(() => {
    if (isOpen && user?.id) {
      fetchServices();
    }
  }, [isOpen, user?.id]);

  const fetchServices = async () => {
    setLoadingServices(true);
    try {
      const response = await api.get('/services');
      if (response.data && Array.isArray(response.data)) {
        setServices(response.data);
        if (response.data.length > 0 && !selectedServiceId) {
          setSelectedServiceId(response.data[0].id);
          const firstService = response.data[0];
          setFormData(prev => ({
            ...prev,
            price: firstService.price || 0,
            scopeOfWork: firstService.description || prev.scopeOfWork,
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      // If no services, allow creating offer without service
    } finally {
      setLoadingServices(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedServiceId || !clientId) {
      toast.error('Please select a service and ensure client information is available');
      return;
    }

    if (!formData.price || formData.price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    if (!formData.scopeOfWork || !formData.scopeOfWork.trim()) {
      toast.error('Please enter scope of work');
      return;
    }

    setLoading(true);
    try {
      // Create offer - Fiverr-like flow
      const response = await api.post('/offers', {
        serviceId: selectedServiceId,
        conversationId: conversationId || null,
        clientId: clientId,
        deliveryTime: parseInt(formData.deliveryTime),
        revisionsIncluded: parseInt(formData.revisionsIncluded),
        scopeOfWork: formData.scopeOfWork.trim(),
        cancellationPolicy: formData.cancellationPolicy.trim(),
        price: parseFloat(formData.price),
      });

      if (response.data.success) {
        const offer = response.data.offer;
        toast.success('Offer sent to client!');
        
        // Send offer message to chat with offer ID in attachmentName
        if (socket && isConnected && offer) {
          const offerConversationId = offer.conversationId || conversationId;
          
          if (offerConversationId) {
            try {
              // Send message with offer ID stored in attachmentName
              // This allows us to fetch offer data when loading messages
              socket.emit('send_message', {
                conversationId: offerConversationId,
                content: '💼 Custom Offer', // Simple content, offer data will come from attachmentName
                type: 'offer', // Special type for offer messages
                attachmentName: offer.id, // Store offer ID here
              });
            } catch (error) {
              console.error('Error sending offer message:', error);
            }
          }
        }
        
        if (onOfferCreated) {
          // Pass offer
          onOfferCreated(offer);
        }

        onClose();
        // Reset form
        setFormData({
          price: service?.price || 0,
          deliveryTime: 7,
          revisionsIncluded: 2,
          scopeOfWork: service?.description || '',
          cancellationPolicy: 'Standard cancellation policy applies. Order can be cancelled within 24 hours of acceptance.',
        });
      }
    } catch (error) {
      console.error('Error creating offer:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create offer';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-full sm:max-w-lg rounded-2xl sm:rounded-[2.5rem] overflow-y-auto max-h-[95vh] sm:max-h-[90vh] p-4 sm:p-6 border-none shadow-2xl bg-white mx-2 sm:mx-0">
        <DialogHeader className="text-center">
          <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 mt-2 sm:mt-4 flex items-center justify-center gap-2">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            Send Custom Offer
          </DialogTitle>
          <DialogDescription className="text-gray-500 text-xs sm:text-sm mb-3 sm:mb-4">
            Send a custom offer to the client. They can accept to create an order or reject it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Service Selection */}
          {loadingServices ? (
            <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-100">
              <div className="text-xs sm:text-sm text-gray-500">Loading services...</div>
            </div>
          ) : services.length > 0 ? (
            <div className="space-y-2">
              <Label htmlFor="serviceSelect" className="text-sm sm:text-base">Select Service</Label>
              <select
                id="serviceSelect"
                value={selectedServiceId}
                onChange={(e) => {
                  const serviceId = e.target.value;
                  setSelectedServiceId(serviceId);
                  const selectedService = services.find(s => s.id === serviceId);
                  if (selectedService) {
                    setFormData(prev => ({
                      ...prev,
                      price: selectedService.price || prev.price,
                      scopeOfWork: selectedService.description || prev.scopeOfWork,
                    }));
                  }
                }}
                className="w-full rounded-lg sm:rounded-xl border border-gray-200 p-2 sm:p-2.5 bg-white text-sm sm:text-base"
                required
              >
                {services.map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.title} - {svc.currency || 'USD'} {svc.price || 0}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="bg-yellow-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-yellow-200">
              <div className="text-xs sm:text-sm text-yellow-700">
                No services found. Please create a service first to send offers.
              </div>
            </div>
          )}

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price" className="flex items-center gap-2 text-sm sm:text-base">
              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
              Price ({service?.currency || 'USD'})
            </Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
              className="rounded-lg sm:rounded-xl text-sm sm:text-base"
            />
          </div>

          {/* Scope of Work */}
          <div className="space-y-2">
            <Label htmlFor="scopeOfWork" className="text-sm sm:text-base">Scope of Work</Label>
            <Textarea
              id="scopeOfWork"
              value={formData.scopeOfWork}
              onChange={(e) => setFormData({ ...formData, scopeOfWork: e.target.value })}
              rows={4}
              required
              className="rounded-lg sm:rounded-xl text-sm sm:text-base"
              placeholder="Describe what you will deliver..."
            />
          </div>

          {/* Delivery Time */}
          <div className="space-y-2">
            <Label htmlFor="deliveryTime" className="flex items-center gap-2 text-sm sm:text-base">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
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
              className="rounded-lg sm:rounded-xl text-sm sm:text-base"
            />
          </div>

          {/* Revisions Included */}
          <div className="space-y-2">
            <Label htmlFor="revisionsIncluded" className="flex items-center gap-2 text-sm sm:text-base">
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
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
              className="rounded-lg sm:rounded-xl text-sm sm:text-base"
            />
          </div>

          {/* Cancellation Policy */}
          <div className="space-y-2">
            <Label htmlFor="cancellationPolicy" className="text-sm sm:text-base">Cancellation Policy</Label>
            <Textarea
              id="cancellationPolicy"
              value={formData.cancellationPolicy}
              onChange={(e) => setFormData({ ...formData, cancellationPolicy: e.target.value })}
              rows={3}
              className="rounded-lg sm:rounded-xl text-sm sm:text-base"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-lg sm:rounded-xl text-sm sm:text-base"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-lg sm:rounded-xl bg-[#10b981] hover:bg-[#059669] text-sm sm:text-base"
              disabled={loading || !selectedServiceId || services.length === 0}
            >
              {loading ? 'Sending...' : 'Send Offer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOfferModal;

