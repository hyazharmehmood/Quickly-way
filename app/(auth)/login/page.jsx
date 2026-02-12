'use client';

import { useRouter } from 'next/navigation';
import Login from '@/components/auth/Login';
import { Card } from '@/components/ui/card';

export default function LoginPage() {
    const router = useRouter();

    const handleClose = () => {
        router.back();
    };

    const handleCreateAccount = () => {
        router.replace('/signup');
    };

    const handleForgotPassword = () => {
        router.replace('/forgot-password');
    };

    return (
        <div className="min-h-screen max-w-[500px] mx-auto flex items-center justify-center px-2">
            <Card className=" px-4 py-8 sm:px-6 lg:px-8">
                <Login
                    onClose={handleClose}
                    onCreateAccountClick={handleCreateAccount}
                    onForgotPasswordClick={handleForgotPassword}
                />
            </Card>
        </div>
    );
}
