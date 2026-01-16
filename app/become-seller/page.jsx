"use client";

import React from 'react';
import dynamicImport from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import components to prevent SSR/build-time analysis
const BecomeSellerForm = dynamicImport(
    () => import('@/components/seller/BecomeSellerForm').then(mod => ({ default: mod.BecomeSellerForm })),
    { ssr: false, loading: () => <Loader2 className="h-8 w-8 animate-spin text-primary" /> }
);

const SellerStatusCard = dynamicImport(
    () => import('@/components/seller/SellerStatusCard').then(mod => ({ default: mod.SellerStatusCard })),
    { ssr: false, loading: () => <Loader2 className="h-8 w-8 animate-spin text-primary" /> }
);

// Simple static page - client-side logic will be handled by child components
export default function BecomeSellerPage() {
    return (
        <div className="container mx-auto py-12 px-4 min-h-[70vh] flex flex-col justify-center">
            <BecomeSellerForm />
        </div>
    );
}
