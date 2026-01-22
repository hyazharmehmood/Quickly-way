"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  Clock,
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

// Contract Status Configuration - Only contract statuses
const STATUS_CONFIG = {
  PENDING_ACCEPTANCE: {
    label: 'PENDING ACCEPTANCE',
    color: 'bg-yellow-500',
    textColor: 'text-white',
  },
  ACTIVE: {
    label: 'ACTIVE',
    color: 'bg-blue-500',
    textColor: 'text-white',
  },
  REJECTED: {
    label: 'REJECTED',
    color: 'bg-red-500',
    textColor: 'text-white',
  },
  CANCELLED: {
    label: 'CANCELLED',
    color: 'bg-gray-500',
    textColor: 'text-white',
  },
};

export function ContractCard({ contract, conversationId, onContractUpdate, socket }) {
  console.log('contract, conversationId, onContractUpdate', contract, conversationId, onContractUpdate);
  // This is a freelancer platform - we use CONTRACT only
  const actualContract = contract;
  
  const { user, role } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [localContract, setLocalContract] = useState(actualContract);
  
  // Get socket from props or global
  const getSocket = () => {
    if (socket) return socket;
    if (typeof window !== 'undefined') {
      return window.socket || window.__socket__;
    }
    return null;
  };

  // Update local contract when prop changes (for real-time updates)
  useEffect(() => {
    if (actualContract) {
      setLocalContract(actualContract);
      console.log('📋 ContractCard: Contract prop updated', {
        contractId: actualContract.id,
        status: actualContract.status,
        orderStatus: actualContract.order?.status,
        paymentStatus: actualContract.order?.paymentStatus,
      });
    }
  }, [actualContract?.id, actualContract?.status, actualContract?.order?.status, actualContract?.order?.paymentStatus]);

  if (!localContract) return null;

  // Contract Status is PRIMARY source of truth
  // ContractStatus enum: PENDING_ACCEPTANCE, ACTIVE, REJECTED, CANCELLED, DELIVERED, REVISION_REQUESTED, COMPLETED
  const contractStatus = localContract.status;
  
  // Check if order exists (created when contract is accepted)
  const order = localContract.order;
  const orderStatus = order?.status; // PENDING, ACTIVE, DELIVERED, etc.
  const paymentStatus = order?.paymentStatus; // PENDING, PAID, etc.

  // Ensure valid status
  const displayStatus = STATUS_CONFIG[contractStatus] ? contractStatus : 'PENDING_ACCEPTANCE';

  // Get status config
  const statusConfig = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.PENDING_ACCEPTANCE;
  const isClient = role === 'CLIENT';
  
  // Get client/freelancer IDs from contract
  const clientId = localContract.clientId;
  const isClientContract = clientId === user?.id;

  // Get contract data
  const serviceTitle = localContract.serviceTitle || localContract.service?.title || 'Contract';
  const deliveryDate = localContract.deliveryDate ? format(new Date(localContract.deliveryDate), 'd MMM, yyyy') : null;
  const contractPrice = localContract.price;
  const contractCurrency = localContract.currency || 'USD';
  const contractId = localContract.id; // Use contract.id for API calls

  // Handle accept contract (CLIENT accepts freelancer's contract)
  // Using Socket.IO for real-time updates
  const handleAccept = async () => {
    if (!isClient || !isClientContract || !contractId) return;

    setIsLoading(true);
    
    // Get socket from parent (ChatWindow) or use global socket
    const socket = window.socket || (typeof window !== 'undefined' && window.__socket__);
    
    if (socket && socket.connected) {
      // Use Socket.IO event
      socket.emit('contract:accept', { contractId });
      
      // Listen for response
      const handleAccepted = (data) => {
        if (data.success) {
          toast.success('Contract accepted successfully');
          const updatedContract = data.contract || data.order;
          setLocalContract(updatedContract);
          onContractUpdate?.(updatedContract);
        }
        socket.off('contract:accepted', handleAccepted);
        socket.off('error', handleError);
        setIsLoading(false);
      };
      
      const handleError = (error) => {
        toast.error(error.message || 'Failed to accept contract');
        socket.off('contract:accepted', handleAccepted);
        socket.off('error', handleError);
        setIsLoading(false);
      };
      
      socket.once('contract:accepted', handleAccepted);
      socket.once('error', handleError);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        socket.off('contract:accepted', handleAccepted);
        socket.off('error', handleError);
        if (isLoading) {
          setIsLoading(false);
          toast.error('Request timeout. Please try again.');
        }
      }, 10000);
    } else {
      // Fallback to API route if socket not available
      try {
        const response = await api.post(`/orders/${contractId}/accept`);
        if (response.data.success) {
          toast.success('Contract accepted successfully');
          const updatedContract = response.data.contract || response.data.order;
          setLocalContract(updatedContract);
          onContractUpdate?.(updatedContract);
        }
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to accept contract');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle reject contract (CLIENT rejects freelancer's contract)
  // Using Socket.IO for real-time updates
  const handleReject = async () => {
    if (!isClient || !isClientContract || !rejectionReason.trim() || !contractId) return;

    setIsLoading(true);
    
    // Get socket from props or global
    const socket = getSocket();
    
    if (socket && socket.connected) {
      // Use Socket.IO event
      socket.emit('contract:reject', { 
        contractId,
        rejectionReason: rejectionReason.trim(),
      });
      
      // Listen for response
      const handleRejected = (data) => {
        if (data.success) {
          toast.success('Contract rejected');
          const updatedContract = data.contract || data.order;
          setLocalContract(updatedContract);
          onContractUpdate?.(updatedContract);
          setShowRejectDialog(false);
          setRejectionReason('');
        }
        socket.off('contract:rejected', handleRejected);
        socket.off('error', handleError);
        setIsLoading(false);
      };
      
      const handleError = (error) => {
        toast.error(error.message || 'Failed to reject contract');
        socket.off('contract:rejected', handleRejected);
        socket.off('error', handleError);
        setIsLoading(false);
      };
      
      socket.once('contract:rejected', handleRejected);
      socket.once('error', handleError);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        socket.off('contract:rejected', handleRejected);
        socket.off('error', handleError);
        if (isLoading) {
          setIsLoading(false);
          toast.error('Request timeout. Please try again.');
        }
      }, 10000);
    } else {
      // Fallback to API route if socket not available
      try {
        const response = await api.post(`/orders/${contractId}/reject`, {
          rejectionReason: rejectionReason.trim(),
        });
        if (response.data.success) {
          toast.success('Contract rejected');
          const updatedContract = response.data.contract || response.data.order;
          setLocalContract(updatedContract);
          onContractUpdate?.(updatedContract);
          setShowRejectDialog(false);
          setRejectionReason('');
        }
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to reject contract');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Check if user can perform actions - only accept/reject for pending contracts
  const isContractPending = contractStatus === 'PENDING_ACCEPTANCE';
  const canAccept = isClient && isClientContract && isContractPending;
  const canReject = isClient && isClientContract && isContractPending;

  return (
    <Card className="p-4 sm:p-5 mb-4 border border-gray-200 bg-white rounded-2xl shadow-sm w-full max-w-full">
      {/* Header: Status Badge and Price */}
      <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
        <div className="flex flex-col gap-1">
          <Badge className={`${statusConfig.color} ${statusConfig.textColor} px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase flex-shrink-0`}>
            {statusConfig.label}
          </Badge>
          {/* Show order status if order exists */}
          {order && orderStatus === 'PENDING' && (
            <Badge className="bg-orange-500 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase flex-shrink-0">
              Waiting for Payment (Coming Soon)
            </Badge>
          )}
          {order && orderStatus === 'ACTIVE' && (
            <Badge className="bg-green-500 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase flex-shrink-0">
              Order Active
            </Badge>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-900">
            {contractCurrency} {contractPrice?.toFixed(0) || '0'}
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

      {/* Action Buttons - Show Accept and Reject only for PENDING_ACCEPTANCE contracts */}
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
              <span className="hidden sm:inline">Accept Contract</span>
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
                    Reject Contract
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}

      {/* View Contract Button - Always show at bottom */}
      <Button
        size="sm"
        onClick={() => {
          if (!contractId) return;
          if (role === 'FREELANCER') {
            router.push(`/dashboard/freelancer/orders`);
          } else {
            router.push(`/orders/${contractId}`);
          }
        }}
        className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg mt-4 text-sm sm:text-base"
      >
        <Eye className="h-4 w-4 mr-2" />
        View Contract
      </Button>
    </Card>
  );
}

// Export both for backward compatibility
export { ContractCard as OrderCard };
