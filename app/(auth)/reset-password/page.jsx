'use client';

import { Suspense } from 'react';
import ResetPassword from '@/components/auth/ResetPassword';

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-background">
            <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
                <ResetPassword />
            </Suspense>
        </div>
    );
}

