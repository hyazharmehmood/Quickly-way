"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BecomeSellerForm } from '@/components/seller/BecomeSellerForm';
import { SellerStatusCard } from '@/components/seller/SellerStatusCard';
import useAuthStore from '@/store/useAuthStore';
import { Loader2 } from 'lucide-react';

// Prevent static generation - this page requires client-side state
export const dynamic = 'force-dynamic';

export default function BecomeSellerPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const { sellerStatus, user, updateSellerStatus, role, isLoggedIn } = useAuthStore();

    // Ensure component is mounted before accessing client-side store
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        
        // Only allow clients who are logged in
        if (!isLoggedIn) {
            router.push('/login');
            return;
        }

        if (role !== 'client') {
            // If they are already a seller (freelancer) or admin, they shouldn't be here
            // but we can handle the "already a seller" state in the UI below
        }
    }, [mounted, isLoggedIn, role, router]);

    const handleRetry = () => {
        updateSellerStatus('none');
    };

    // Show loading state during SSR and initial mount
    if (!mounted) {
        return (
            <div className="container mx-auto py-12 px-4 min-h-[70vh] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isLoggedIn) return null;

    // Handle non-client roles if they somehow get here
    if (role === 'admin') {
        return (
            <div className="container mx-auto py-20 px-4 text-center">
                <h2 className="text-2xl font-normal mb-4">Admins cannot become sellers.</h2>
                <button
                    onClick={() => router.push('/admin')}
                    className="text-primary hover:underline"
                >
                    Go to Admin Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-12 px-4 min-h-[70vh] flex flex-col justify-center">
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
                    <button
                        onClick={() => router.push('/dashboard/freelancer')}
                        className="bg-primary text-white px-6 py-2 rounded-full hover:bg-primary/90 transition-colors"
                    >
                        Go to Freelancer Dashboard
                    </button>
                </div>
            )}
        </div>
    );
}
