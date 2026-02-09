'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useAuthStore from '@/store/useAuthStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

const Signup = ({ onSignInClick, onPostServiceClick }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const { signup } = useAuthStore();
    const router = useRouter();
    const searchParams = useSearchParams();

    // All signups create CLIENT accounts. To become a seller, user applies after login.

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await signup({
                name: `${firstName} ${lastName}`,
                email,
                password,
                role: 'CLIENT',
                isSeller: false,
                sellerStatus: 'NONE'
            });
            toast.success("Account created successfully!");
            router.push('/');
        } catch (error) {
            console.error("Signup error:", error);
            toast.error(error.response?.data?.message || "Something went wrong.");
        } finally {
            setIsLoading(false);
        }
    };
    const [firstNameError, setFirstNameError] = useState("");
    const [lastNameError, setLastNameError] = useState("");

    const handleNameInput = (e, setValue, setError) => {
        let val = e.target.value;
        let errorMsg = "";

        // 1. Check for numbers or symbols (anything not letters)
        if (/[^a-zA-Z]/.test(val)) {
            errorMsg = "Numbers and symbols are not allowed";
            // Remove invalid characters
            val = val.replace(/[^a-zA-Z]/g, "");
        }

        // 2. Check length (Input is technically allowed to be longer briefly so we can catch it and show error, then slice)
        if (val.length > 13) {
            errorMsg = "Only 13 characters limit";
            val = val.slice(0, 13);
        }

        // 3. Auto-Capitalize first letter and lowercase the rest
        if (val.length > 0) {
            val = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
        }

        setError(errorMsg);
        setValue(val);
    };

    return (
        <div className="max-w-md mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold text-foreground mb-8 text-center">Create your account</h1>

            {/* Form Container */}
            <div className="bg-card rounded-xl shadow-none">

                <p className="text-sm text-muted-foreground mb-4 text-center">
                    Create a client account. You can apply to become a seller later from your account.
                </p>

                {/* Social Login Section */}
                <div className="mb-4">
                    {/* <p className="text-center text-foreground text-base mb-6 px-4">
                        By clicking Sign up with Google, Sign up with Facebook, or Sign up with Apple
                    </p> */}



                    <div className="space-y-3">
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

                        {/* <Button className="w-full flex items-center justify-center gap-3 bg-[#1877F2] text-white font-medium py-6 rounded-full hover:bg-[#1864D9] transition-colors">
                            <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            Sign in with Facebook
                        </Button> */}

                        <Button className="w-full flex items-center justify-center gap-3 bg-black text-white font-medium py-6 rounded-full hover:bg-gray-800 transition-colors">
                            <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.64 3.4 1.63-3.12 1.88-2.4 5.77.1 6.85-.24.58-.6 1.44-1.15 2.53zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.16 2.29-1.93 4.34-3.74 4.25z" />
                            </svg>
                            Sign in with Apple
                        </Button>
                    </div>
                    <div className="flex items-center gap-4 mt-6">
                        <div className="h-px flex-1 bg-border"></div>
                        <span className="text-sm font-bold text-foreground">OR</span>
                        <div className="h-px flex-1 bg-border"></div>
                    </div>
                </div>
                <form className="space-y-5" onSubmit={handleSubmit}>

                    {/* First Name */}
                    <div className="space-y-1.5">
                        <label className="text-base font-medium text-foreground">First name<span className="text-destructive">*</span></label>
                        <Input
                            type="text"
                            placeholder="First name"
                            required
                            value={firstName}
                            onChange={(e) => handleNameInput(e, setFirstName, setFirstNameError)}
                            className={`w-full px-4 py-6 border rounded-lg focus:outline-none focus:ring-2 text-base shadow-none ${firstNameError ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : 'border-input focus:ring-primary/20 focus:border-primary'}`}
                        />
                        {firstNameError && (
                            <div className="flex items-center gap-1 text-destructive text-xs mt-1">
                                <AlertCircle className="w-3 h-3" />
                                <span>{firstNameError}</span>
                            </div>
                        )}
                    </div>

                    {/* Last Name */}
                    <div className="space-y-1.5">
                        <label className="text-base font-medium text-foreground">Last name<span className="text-destructive">*</span></label>
                        <Input
                            type="text"
                            placeholder="Last name"
                            required
                            value={lastName}
                            onChange={(e) => handleNameInput(e, setLastName, setLastNameError)}
                            className={`w-full px-4 py-6 border rounded-lg focus:outline-none focus:ring-2 text-base shadow-none ${lastNameError ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : 'border-input focus:ring-primary/20 focus:border-primary'}`}
                        />
                        {lastNameError && (
                            <div className="flex items-center gap-1 text-destructive text-xs mt-1">
                                <AlertCircle className="w-3 h-3" />
                                <span>{lastNameError}</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-base font-medium text-foreground">Email ID<span className="text-destructive">*</span></label>
                        <Input
                            type="email"
                            placeholder="Email ID"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-6 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-base shadow-none"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-base font-medium text-foreground">Password<span className="text-destructive">*</span></label>
                        <div className="relative">
                            <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-4 pr-10 py-6 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-base shadow-none"
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <p className="text-xs text-center text-muted-foreground mt-6">
                        By joining, you agree to our <a href="#" className="underline">Terms & Conditions</a> and <a href="#" className="underline">Privacy policy</a>
                    </p>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#10b981] hover:bg-green-600 text-white font-medium py-6 rounded-full transition-colors text-base shadow-md mt-4"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create an account"}
                    </Button>
                </form>



                <div className="mt-4 text-center pb-8">
                    <p className="text-foreground text-base">
                        Already have an account? <button onClick={onSignInClick} className="text-[#22c55e] font-bold hover:underline">Sign in</button>
                    </p>

                </div>
            </div>
        </div>
    );
};

export default Signup;
