"use client";

import React, { useState, useEffect, useRef } from 'react';
import { User, Shield, Save, Loader2, Eye, EyeOff, Camera, MapPin, Trash2, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TagInput from "@/components/ui/TagInput";
import useAuthStore from '@/store/useAuthStore';
import api from '@/utils/api';
import { toast } from 'sonner';
import { ALL_WORLD_LANGUAGES } from '@/lib/shared/constants';
import { Skeleton } from "@/components/ui/skeleton";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const generateTimeOptions = () => {
    const times = [];
    for (let i = 0; i < 24; i++) {
        const hour = i;
        const modifier = hour >= 12 ? 'PM' : 'AM';
        let displayHour = hour % 12;
        if (displayHour === 0) displayHour = 12;
        times.push(`${displayHour.toString().padStart(2, '0')}:00 ${modifier}`);
    }
    return times;
};

const TIME_OPTIONS = generateTimeOptions();

export default function FreelancerSettings() {
    const { user, setUser, fetchProfile, refreshProfile } = useAuthStore();
    const [activeTab, setActiveTab] = useState('profile');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    // Profile form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState(''); // Read-only mostly?
    const [bio, setBio] = useState('');
    // const [skills, setSkills] = useState([]); // Removed as per request
    const [languages, setLanguages] = useState([]); // Array of strings

    // New Fields
    const [profileImage, setProfileImage] = useState(null);
    const [location, setLocation] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [showEmail, setShowEmail] = useState(false);
    const [showMobile, setShowMobile] = useState(false);

    // Schedule
    const [scheduleData, setScheduleData] = useState(
        DAYS.map(day => ({ day, startTime: "09:00 AM", endTime: "05:00 PM", isClosed: false }))
    );

    const profileInputRef = useRef(null);

    // Password form state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Fetch profile only if not logged in to avoid global loading loop
    useEffect(() => {
        const loadData = async () => {
            try {
                // Always fetch fresh profile to get new fields
                await refreshProfile();
            } catch (error) {
                console.error('Failed to load profile');
            } finally {
                setIsLoadingProfile(false);
            }
        };
        loadData();
    }, []);


    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
            setBio(user.bio || '');
            // setSkills(user.skills || []);
            setLanguages(user.languages || []);
            setProfileImage(user.profileImage || null);
            setLocation(user.location || '');
            setPhoneNumber(user.phoneNumber || '');
            setShowEmail(user.showEmail || false);
            setShowMobile(user.showMobile || false);

            if (user.availability) {
                // Merge loaded availability with default structure to ensure all days exist
                const loadedSchedule = Array.isArray(user.availability) ? user.availability : [];
                setScheduleData(prev => prev.map(dayItem => {
                    const found = loadedSchedule.find(d => d.day === dayItem.day);
                    return found ? { ...dayItem, ...found } : dayItem;
                }));
            }
        }
    }, [user]);

    // Image Compression Helper
    const compressImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_DIMENSION = 800;

                    if (width > height) {
                        if (width > MAX_DIMENSION) {
                            height = Math.round((height * MAX_DIMENSION) / width);
                            width = MAX_DIMENSION;
                        }
                    } else {
                        if (height > MAX_DIMENSION) {
                            width = Math.round((width * MAX_DIMENSION) / height);
                            height = MAX_DIMENSION;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                };
            };
        });
    };

    const handleImageUpload = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                const compressedUrl = await compressImage(file);
                setProfileImage(compressedUrl);
            } catch (error) {
                setProfileImage(URL.createObjectURL(file));
            }
        }
    };

    const handleScheduleChange = (index, field, value) => {
        setScheduleData(prev => {
            const newData = [...prev];
            newData[index] = { ...newData[index], [field]: value };
            return newData;
        });
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const payload = {
            name,
            bio,
            // skills,
            languages,
            profileImage,
            location,
            phoneNumber,
            showEmail,
            showMobile,
            availability: scheduleData
        };
        console.log("payload", payload)
        try {
            const response = await api.put('/auth/profile', payload);
            console.log("response", response)
            setUser(response.data.user);
            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    // ... handlePasswordChange remains same ...

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
            <div className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-96" />
                </div>

                {/* Horizontal Tabs Skeleton */}
                <div className="flex gap-4 border-b border-border/50 pb-2">
                    <Skeleton className="h-10 w-32 rounded-full" />
                    <Skeleton className="h-10 w-32 rounded-full" />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Left Column Skeleton */}
                    <div className="xl:col-span-2 space-y-6">
                        <Card className="border border-border/50 shadow-sm">
                            <CardContent className="p-6 space-y-8">
                                <div className="flex flex-col items-center space-y-4">
                                    <Skeleton className="w-32 h-32 rounded-full" />
                                    <Skeleton className="h-9 w-32" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-10 w-full" /></div>
                                    <div className="space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-10 w-full" /></div>
                                    <div className="space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-10 w-full" /></div>
                                    <div className="space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-10 w-full" /></div>
                                </div>
                                <div className="space-y-5">
                                    <div className="space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-32 w-full" /></div>
                                    <div className="space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-10 w-full" /></div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column Skeleton */}
                    <div className="space-y-4">
                        <Card className="border border-border/50 shadow-sm h-full">
                            <CardContent className="p-4 space-y-4">
                                <Skeleton className="h-5 w-40" />
                                <div className="space-y-3">
                                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                                        <Skeleton key={i} className="h-16 w-full rounded-lg" />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500 space-y-4">
            <div>
                <h2 className="text-2xl font-normal text-foreground tracking-tight">Account Settings</h2>
                <p className="text-muted-foreground font-normal mt-1 text-sm">Manage your profile, notifications, and security.</p>
            </div>

            {/* Layout: Horizontal Tabs -> Full Width Content */}
            <div className="space-y-6">
                {/* Horizontal Tabs */}
                <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none border-b border-border/50">
                    {[
                        { icon: <User />, label: 'Profile Info', tab: 'profile' },
                        { icon: <Shield />, label: 'Security', tab: 'security' },
                    ].map((item, i) => (
                        <Button
                            key={i}
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveTab(item.tab)}
                            className={`flex items-center gap-2.5 rounded-full px-5 h-10 transition-all font-medium ${activeTab === item.tab
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                }`}
                        >
                            {React.cloneElement(item.icon, { className: 'w-4 h-4', strokeWidth: 2 })}
                            <span>{item.label}</span>
                        </Button>
                    ))}
                </div>

                {/* Full Width Content */}
                <Card className="border-none shadow-none  p-0">
                    {activeTab === 'profile' ? (
                        <>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-primary shadow-inner">
                                    <User className="w-6 h-6" />
                                </div>
                                <CardTitle className="text-xl font-normal">Personal Information</CardTitle>
                            </div>

                            <form onSubmit={handleProfileUpdate} className="space-y-4">
                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                                    {/* Left Column: Details */}
                                    <div className="xl:col-span-2 space-y-6">
                                        <Card className="border border-border/50 shadow-">
                                            <CardContent className="p-6 space-y-8">
                                                {/* 1. Profile Image */}
                                                <div className="flex flex-col items-center justify-center space-y-4">
                                                    <input
                                                        type="file"
                                                        ref={profileInputRef}
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={handleImageUpload}
                                                    />
                                                    <div className="relative group/image">
                                                        <div
                                                            onClick={() => profileInputRef.current?.click()}
                                                            className="w-32 h-32 rounded-full overflow-hidden border-4 border-secondary bg-secondary cursor-pointer hover:opacity-90 transition-opacity relative shadow-sm"
                                                        >
                                                            {profileImage ? (
                                                                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                                                                    <User className="w-12 h-12 mb-2 opacity-50" />
                                                                </div>
                                                            )}
                                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity">
                                                                <Camera className="w-8 h-8 text-white" />
                                                            </div>
                                                        </div>

                                                        {profileImage && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setProfileImage(null)}
                                                                className="absolute -bottom-1 -right-1 w-8 h-8 flex items-center justify-center bg-destructive text-destructive-foreground rounded-full shadow-md hover:bg-destructive/90 transition-colors z-10"
                                                                title="Remove photo"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">Click to upload or drag and drop</p>
                                                </div>

                                                {/* 2. Basic Info & Contact */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold px-1">Display Name</label>
                                                        <Input
                                                            value={name}
                                                            onChange={(e) => setName(e.target.value)}
                                                            disabled={isLoading}
                                                            required
                                                            className="h-10"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold px-1">Location</label>
                                                        <div className="relative">
                                                            <Input
                                                                value={location}
                                                                onChange={(e) => setLocation(e.target.value)}
                                                                disabled={isLoading}
                                                                placeholder="e.g. New York, USA"
                                                                className="h-10 pl-9"
                                                            />
                                                            <MapPin className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <div className="flex justify-between items-center px-1">
                                                            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Email</label>
                                                            <label className="flex items-center gap-2 cursor-pointer text-[10px] text-muted-foreground hover:text-foreground">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={showEmail}
                                                                    onChange={(e) => setShowEmail(e.target.checked)}
                                                                    className="w-3 h-3 rounded border-input accent-primary focus:ring-primary"
                                                                />
                                                                Show on profile
                                                            </label>
                                                        </div>
                                                        <Input
                                                            type="email"
                                                            value={email}
                                                            onChange={(e) => setEmail(e.target.value)}
                                                            disabled={isLoading}
                                                            className="h-10"
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <div className="flex justify-between items-center px-1">
                                                            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Phone</label>
                                                            <label className="flex items-center gap-2 cursor-pointer text-[10px] text-muted-foreground hover:text-foreground">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={showMobile}
                                                                    onChange={(e) => setShowMobile(e.target.checked)}
                                                                    className="w-3 h-3 rounded border-input accent-primary focus:ring-primary"
                                                                />
                                                                Show on profile
                                                            </label>
                                                        </div>
                                                        <Input
                                                            value={phoneNumber}
                                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                                            disabled={isLoading}
                                                            placeholder="+1 234 567 890"
                                                            className="h-10"
                                                        />
                                                    </div>
                                                </div>

                                                {/* 3. Bio & Skills */}
                                                <div className="space-y-5 pt-2">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold px-1">Bio</label>
                                                        <textarea
                                                            value={bio}
                                                            onChange={(e) => setBio(e.target.value)}
                                                            disabled={isLoading}
                                                            rows={4}
                                                            placeholder="Tell us about yourself..."
                                                            className="w-full p-3 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold px-1">Languages</label>
                                                        <TagInput
                                                            tags={languages}
                                                            onChange={setLanguages}
                                                            placeholder="Type language and press Enter"
                                                            options={ALL_WORLD_LANGUAGES}
                                                        />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Right Column: Availability */}
                                    <div className="space-y-4">
                                        <Card className="border border-border/50 shadow-sm h-full">
                                            <CardContent className="p-4 space-y-4">
                                                <div className="flex items-center gap-2 px-1">
                                                    <Clock className="w-4 h-4 text-primary" />
                                                    <h3 className="text-sm font-semibold tracking-tight">Default Availability</h3>
                                                </div>
                                                <p className="text-xs text-muted-foreground px-1 -mt-3 pb-2 border-b border-border">
                                                    Set your standard working hours.
                                                </p>

                                                <div className="space-y-2">
                                                    {scheduleData.map((item, index) => (
                                                        <div key={item.day} className="flex flex-col p-2.5 border border-border/40 rounded-lg hover:border-border/80 hover:bg-accent/5 transition-all gap-2">
                                                            <div className="flex items-center justify-between">
                                                                <div className="font-medium text-sm w-12">{item.day}</div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleScheduleChange(index, 'isClosed', !item.isClosed)}
                                                                    className={`w-8 h-4.5 rounded-full p-0.5 transition-colors relative ${!item.isClosed ? 'bg-primary' : 'bg-muted'}`}
                                                                >
                                                                    <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform ${!item.isClosed ? 'translate-x-3.5' : 'translate-x-0'}`} />
                                                                </button>
                                                            </div>

                                                            {!item.isClosed ? (
                                                                <div className="grid grid-cols-2 gap-2 text-xs mt-1">
                                                                    <div className="relative">
                                                                        <select
                                                                            value={item.startTime}
                                                                            onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                                                                            className="w-full appearance-none bg-background border border-input rounded px-2 py-1.5 focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer text-center"
                                                                        >
                                                                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                                                        </select>
                                                                    </div>
                                                                    <div className="relative">
                                                                        <select
                                                                            value={item.endTime}
                                                                            onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                                                                            className="w-full appearance-none bg-background border border-input rounded px-2 py-1.5 focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer text-center"
                                                                        >
                                                                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="text-[10px] text-muted-foreground text-center py-1.5 bg-muted/20 rounded border border-border/20 border-dashed">
                                                                    Unavailable
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-border flex justify-end sticky bottom-0 bg-background/80 backdrop-blur-sm py-4 z-10">
                                    <Button
                                        type="submit"
                                        size="lg"
                                        disabled={isLoading}
                                        className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 min-w-[140px]"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" /> Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-primary shadow-inner">
                                    <Shield className="w-6 h-6" />
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
