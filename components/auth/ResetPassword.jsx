'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/utils/api';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';

const ResetPassword = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        const tokenParam = searchParams.get('token');
        if (tokenParam) {
            setToken(tokenParam);
        }
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!token) {
            toast.error('Invalid reset token. Please use the link from your email.');
            return;
        }

        if (!password || !confirmPassword) {
            toast.error('Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setIsLoading(true);
        try {
            await api.post('/auth/reset-password', { token, password });
            
            setIsSuccess(true);
            toast.success('Password reset successfully!');
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reset password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
                <div className="w-full max-w-[540px]">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold text-[#10b981] mb-8">Password Reset Successful</h1>
                    </div>
                    <div className="bg-card rounded-xl border border-border p-8 sm:p-10 shadow-[0_2px_8px_rgba(0,0,0,0.02)] text-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-foreground text-base mb-4">
                            Your password has been reset successfully!
                        </p>
                        <p className="text-muted-foreground text-sm">
                            Redirecting to login page...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
            <div className="w-full max-w-[540px]">
                {/* Header Section */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-[#10b981] mb-8">Reset password</h1>
                    <p className="text-foreground font-medium text-lg">Enter your new password.</p>
                </div>

                {/* Card Section */}
                <div className="bg-card rounded-xl border border-border p-8 sm:p-10 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    {!token ? (
                        <div className="text-center">
                            <p className="text-foreground text-base mb-4">
                                Invalid or missing reset token.
                            </p>
                            <p className="text-muted-foreground text-sm mb-6">
                                Please use the link from your email to reset your password.
                            </p>
                            <Button
                                onClick={() => router.push('/forgot-password')}
                                variant="outline"
                                className="w-full"
                            >
                                Request new reset link
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <label className="block text-base font-medium text-foreground mb-2">
                                    New Password <span className="text-destructive">*</span>
                                </label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter new password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isLoading}
                                        className="w-full px-4 py-6 pr-12 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder-muted-foreground text-base shadow-none"
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Must be at least 6 characters</p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-base font-medium text-foreground mb-2">
                                    Confirm Password <span className="text-destructive">*</span>
                                </label>
                                <div className="relative">
                                    <Input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        disabled={isLoading}
                                        className="w-full px-4 py-6 pr-12 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder-muted-foreground text-base shadow-none"
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#10b981] hover:bg-green-600 text-white font-bold py-6 rounded-full transition-colors text-base shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Resetting...
                                    </>
                                ) : (
                                    'Reset password'
                                )}
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;

