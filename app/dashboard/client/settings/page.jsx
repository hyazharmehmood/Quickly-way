"use client";

import React, { useState, useEffect } from 'react';
import { User, Shield, Save, Loader2, Eye, EyeOff } from 'lucide-react';
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useAuthStore from '@/store/useAuthStore';
import api from '@/utils/api';
import { toast } from 'sonner';

export default function ClientSettings() {
    const { user, setUser, fetchProfile } = useAuthStore();
    const [activeTab, setActiveTab] = useState('profile');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    // Profile form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    // Password form state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setIsLoadingProfile(true);
        try {
            await fetchProfile();
            if (user) {
                setName(user.name || '');
                setEmail(user.email || '');
            }
        } catch (error) {
            toast.error('Failed to load profile');
        } finally {
            setIsLoadingProfile(false);
        }
    };

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
        }
    }, [user]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await api.put('/auth/profile', { name, email });
            setUser(response.data.user);
            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error('Please fill in all fields');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            await api.put('/auth/change-password', { currentPassword, newPassword });
            toast.success('Password changed successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to change password');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoadingProfile) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500 space-y-4">
            <div>
                <h2 className="text-2xl font-normal text-foreground tracking-tight">Account Settings</h2>
                <p className="text-muted-foreground font-normal mt-1 text-sm">Manage your profile, notifications, and security.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-3">
                    {[
                        { icon: <User />, label: 'Profile Info', tab: 'profile' },
                        { icon: <Shield />, label: 'Security', tab: 'security' },
                    ].map((item, i) => (
                        <Button 
                            key={i}
                            variant="ghost" 
                            size="lg" 
                            onClick={() => setActiveTab(item.tab)}
                            className={`w-full flex items-center gap-4 cursor-pointer transition-all ${
                                activeTab === item.tab 
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                                    : 'bg-card text-muted-foreground border border-border hover:bg-secondary/50'
                            }`}
                        >
                            {React.cloneElement(item.icon, { className: 'w-5 h-5', strokeWidth: 1.5 })}
                            <span className="text-base font-normal">{item.label}</span>
                        </Button>
                    ))}
                </div>

                <Card className="md:col-span-2 rounded-[2rem] border-none bg-card shadow-sm p-4 space-y-4">
                    {activeTab === 'profile' ? (
                        <>
                            <div className="flex items-center gap-6 mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center text-primary shadow-inner">
                                    <User className="w-7 h-7" />
                                </div>
                                <CardTitle className="text-xl font-normal">Personal Information</CardTitle>
                            </div>

                            <form onSubmit={handleProfileUpdate}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest px-1">Display Name</label>
                                        <Input 
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            disabled={isLoading}
                                            className="h-12 bg-secondary/50 border-none rounded-xl" 
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest px-1">Email Address</label>
                                        <Input 
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            disabled={isLoading}
                                            className="h-12 bg-secondary/50 border-none rounded-xl" 
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-border flex justify-end mt-4">
                                    <Button 
                                        type="submit"
                                        size="lg" 
                                        disabled={isLoading}
                                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" /> Save Profile
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-6 mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center text-primary shadow-inner">
                                    <Shield className="w-7 h-7" />
                                </div>
                                <CardTitle className="text-xl font-normal">Change Password</CardTitle>
                            </div>

                            <form onSubmit={handlePasswordChange}>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest px-1">Current Password</label>
                                        <div className="relative">
                                            <Input 
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                disabled={isLoading}
                                                className="h-12 bg-secondary/50 border-none rounded-xl pr-12" 
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest px-1">New Password</label>
                                        <div className="relative">
                                            <Input 
                                                type={showNewPassword ? 'text' : 'password'}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                disabled={isLoading}
                                                className="h-12 bg-secondary/50 border-none rounded-xl pr-12" 
                                                required
                                                minLength={6}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest px-1">Confirm New Password</label>
                                        <div className="relative">
                                            <Input 
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                disabled={isLoading}
                                                className="h-12 bg-secondary/50 border-none rounded-xl pr-12" 
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
                                </div>

                                <div className="pt-6 border-t border-border flex justify-end mt-4">
                                    <Button 
                                        type="submit"
                                        size="lg" 
                                        disabled={isLoading}
                                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Changing...
                                            </>
                                        ) : (
                                            'Change Password'
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
}
