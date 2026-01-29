'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/useAuthStore';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
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
        <div className="max-w-7xl mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
            <div className="bg-card border rounded-xl p-6 shadow-sm">
                <p className="text-muted-foreground">Settings content goes here...</p>
                {/* Future settings form */}
            </div>
        </div>
    );
}
