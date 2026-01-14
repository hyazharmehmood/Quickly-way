'use client';

import { useRouter } from 'next/navigation';
import Signup from '@/components/auth/Signup';
import { Suspense } from 'react';


export default function SignupPage() {
    const router = useRouter();

    const handleSignIn = () => {
        router.push('/login');
    };

    const handlePostService = () => {
        // TODO: Implement post service flow
        console.log('Post service clicked');
        router.push('/post-service');
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Suspense fallback={<div className="flex justify-center p-8">Loading...</div>}>
                    <Signup
                        onSignInClick={handleSignIn}
                        onPostServiceClick={handlePostService}
                    />
                </Suspense>
            </div>
        </div>
    );
}
