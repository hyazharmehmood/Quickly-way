'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/useAuthStore';
import { Loader2 } from 'lucide-react';

export default function SupportPage() {
    const { isLoggedIn, isLoading } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!isLoggedIn && !isLoading) {
            router.push('/login');
        }
    }, [isLoggedIn, isLoading, router]);

    if (isLoading || !isLoggedIn) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-20 px-4">
            <div className="max-w-2xl mx-auto text-center">
                <h1 className="text-3xl font-bold mb-6">Help & Support</h1>
                <p className="text-muted-foreground mb-8">
                    How can we help you today? Browse our FAQs or contact our support team.
                </p>
                <div className="grid gap-4 text-left">
                    <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <h3 className="font-semibold">Getting Started</h3>
                        <p className="text-sm text-muted-foreground">Learn the basics of using Quicklyway.</p>
                    </div>
                    <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <h3 className="font-semibold">Account & Billing</h3>
                        <p className="text-sm text-muted-foreground">Manage your account settings and payments.</p>
                    </div>
                    <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <h3 className="font-semibold">Contact Support</h3>
                        <p className="text-sm text-muted-foreground">Get in touch with our team directly.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
