'use client';

import { useRouter } from 'next/navigation';
import Login from '@/components/auth/Login';

export default function LoginPage() {
    const router = useRouter();

    const handleClose = () => {
        router.back();
    };

    const handleCreateAccount = () => {
        router.push('/signup');
    };

    const handleForgotPassword = () => {
        router.push('/forgot-password');
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Login
                    onClose={handleClose}
                    onCreateAccountClick={handleCreateAccount}
                    onForgotPasswordClick={handleForgotPassword}
                />
            </div>
        </div>
    );
}
