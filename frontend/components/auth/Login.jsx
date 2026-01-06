'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import useAuthStore from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const Login = ({ onClose, onCreateAccountClick, onForgotPasswordClick }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuthStore();
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const data = await login({ email, password });
            toast.success("Welcome back!");

            // Redirect based on role
            if (data.user.role === 'admin') {
                router.push('/admin');
            } else {
                router.push('/');
            }
        } catch (error) {
            console.error("Login error:", error);
            toast.error(error.response?.data?.message || "Invalid email or password.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto px-4 py-8 sm:px-6 lg:px-8">

            {/* Title */}
            <h1 className="text-2xl font-semibold text-foreground mb-8 text-center">Login</h1>

            <div className="bg-card rounded-xl shadow-none">

                {/* Social Login Buttons */}
                <div className="space-y-3 mb-8">
                    <Button
                        variant="outline"
                        className="w-full flex items-center justify-center gap-3 bg-background border-input text-foreground font-medium py-6 rounded-full hover:bg-accent transition-colors"
                    >
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign in with Google
                    </Button>

                    {/* <Button
                        className="w-full flex items-center justify-center gap-3 bg-[#1877F2] text-white font-medium py-6 rounded-full hover:bg-[#1864D9] transition-colors"
                    >
                        <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        Sign in with Facebook
                    </Button> */}

                    <Button
                        className="w-full flex items-center justify-center gap-3 bg-black text-white font-medium py-6 rounded-full hover:bg-gray-800 transition-colors"
                    >
                        <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.64 3.4 1.63-3.12 1.88-2.4 5.77.1 6.85-.24.58-.6 1.44-1.15 2.53zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.16 2.29-1.93 4.34-3.74 4.25z" />
                        </svg>
                        Sign in with Apple
                    </Button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="h-px flex-1 bg-border"></div>
                    <span className="text-sm font-bold text-muted-foreground">OR</span>
                    <div className="h-px flex-1 bg-border"></div>
                </div>

                {/* Form */}
                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div>
                        <Input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-5 py-6 bg-muted/50 rounded-xl border-transparent focus:border-border focus:ring-0 text-foreground placeholder-muted-foreground text-base shadow-none"
                        />
                    </div>

                    <div className="relative">
                        <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-5 py-6 bg-muted/50 rounded-xl border-transparent focus:border-border focus:ring-0 text-foreground placeholder-muted-foreground pr-12 text-base shadow-none"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <Checkbox id="remember-me" className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                            <span className="text-muted-foreground text-sm">Remember me</span>
                        </label>
                        <button
                            type="button"
                            onClick={onForgotPasswordClick}
                            className="text-sm font-semibold text-foreground hover:underline underline-offset-2 decoration-foreground"
                        >
                            Forgot password?
                        </button>
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#10b981] hover:bg-green-600 text-white font-medium py-6 rounded-full transition-colors text-base shadow-sm mt-2"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Login"}
                    </Button>
                </form>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-foreground text-base">
                        Do not have an account?{' '}
                        <button
                            onClick={onCreateAccountClick}
                            className="text-foreground font-bold hover:underline inline-block"
                        >
                            Create your account
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
