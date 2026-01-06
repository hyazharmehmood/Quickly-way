'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ForgotPassword = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
            <div className="w-full max-w-[540px]">
                {/* Header Section */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-[#10b981] mb-8">Forgot password</h1>
                    <p className="text-foreground font-medium text-lg">Enter your email to reset your password.</p>
                </div>

                {/* Card Section */}
                <div className="bg-card rounded-xl border border-border p-8 sm:p-10 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    <form onSubmit={(e) => e.preventDefault()}>
                        <div className="mb-6">
                            <label className="block text-base font-medium text-foreground mb-2">
                                Enter your registered email <span className="text-destructive">*</span>
                            </label>
                            <Input
                                type="email"
                                placeholder="user@example.com"
                                className="w-full px-4 py-6 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder-muted-foreground text-base shadow-none"
                            />
                        </div>

                        <p className="text-foreground text-base leading-relaxed mb-8">
                            Enter the email address associated with your account, and we’ll email you a link to reset your password.
                        </p>

                        <Button
                            type="submit"
                            className="w-full bg-[#10b981] hover:bg-green-600 text-white font-bold py-6 rounded-full transition-colors text-base shadow-sm"
                        >
                            Send reset link
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
