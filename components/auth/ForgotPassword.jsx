'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/utils/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!email) {
            toast.error('Please enter your email address');
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.post('/auth/forgot-password', { email });
            
            setIsSuccess(true);
            toast.success(response.data.message);
            
            // In development, show the reset URL
            if (response.data.resetUrl) {
                console.log('Reset URL:', response.data.resetUrl);
                toast.info(`Development mode: Check console for reset URL`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send reset link. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
            <div className="w-full max-w-[540px]">
                {/* Header Section */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-[#10b981] mb-8">Forgot password</h1>
                    <p className="text-foreground font-medium text-lg">
                        {isSuccess 
                            ? 'Check your email for reset instructions' 
                            : 'Enter your email to reset your password.'}
                    </p>
                </div>

                {/* Card Section */}
                <div className="bg-card rounded-xl border border-border p-8 sm:p-10 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    {isSuccess ? (
                        <div className="text-center">
                            <div className="mb-6">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-foreground text-base mb-4">
                                    We've sent a password reset link to <strong>{email}</strong>
                                </p>
                                <p className="text-muted-foreground text-sm">
                                    Please check your email and click the link to reset your password.
                                </p>
                            </div>
                            <Button
                                onClick={() => {
                                    setIsSuccess(false);
                                    setEmail('');
                                }}
                                variant="outline"
                                className="w-full"
                            >
                                Send another email
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <label className="block text-base font-medium text-foreground mb-2">
                                    Enter your registered email <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    type="email"
                                    placeholder="user@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                    className="w-full px-4 py-6 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder-muted-foreground text-base shadow-none"
                                    required
                                />
                            </div>

                            <p className="text-foreground text-base leading-relaxed mb-8">
                                Enter the email address associated with your account, and we'll email you a link to reset your password.
                            </p>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#10b981] hover:bg-green-600 text-white font-bold py-6 rounded-full transition-colors text-base shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    'Send reset link'
                                )}
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
