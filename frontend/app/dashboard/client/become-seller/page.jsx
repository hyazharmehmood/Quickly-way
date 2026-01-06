"use client";

import React from 'react';
import { BecomeSellerForm } from '@/components/seller/BecomeSellerForm';
import { SellerStatusCard } from '@/components/seller/SellerStatusCard';
import useAuthStore from '@/store/useAuthStore';

export default function BecomeSellerPage() {
    const { sellerStatus, user, updateSellerStatus } = useAuthStore();

    const handleRetry = () => {
        updateSellerStatus('none');
    };

    return (
        <div className="container mx-auto py-12 px-4">
            {sellerStatus === 'none' && <BecomeSellerForm />}
            {sellerStatus === 'pending' && <SellerStatusCard status="pending" />}
            {sellerStatus === 'rejected' && (
                <SellerStatusCard
                    status="rejected"
                    reason={user?.rejectionReason}
                    onRetry={handleRetry}
                />
            )}
            {sellerStatus === 'approved' && (
                <div className="text-center py-20">
                    <h2 className="text-2xl font-normal mb-4">You are already a seller!</h2>
                    <p className="text-muted-foreground mb-8">Switch to your freelancer dashboard to start managing your services.</p>
                </div>
            )}
        </div>
    );
}
