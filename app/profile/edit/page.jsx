"use client";

import React, { useState, useEffect, useRef } from 'react';
import { User, Save, Loader2, Camera, MapPin, Trash2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TagInput from "@/components/ui/TagInput";
import useAuthStore from '@/store/useAuthStore';
import api from '@/utils/api';
import { toast } from 'sonner';
import { ALL_WORLD_LANGUAGES } from '@/lib/shared/constants';
import { Skeleton } from "@/components/ui/skeleton";

export default function EditProfilePage() {
    const { user, setUser, refreshProfile } = useAuthStore();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    // Profile form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [bio, setBio] = useState('');
    const [languages, setLanguages] = useState([]);
    const [profileImage, setProfileImage] = useState(null);
    const [location, setLocation] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [showEmail, setShowEmail] = useState(false);
    const [showMobile, setShowMobile] = useState(false);

    const profileInputRef = useRef(null);

    // Fetch profile data
    useEffect(() => {
        const loadData = async () => {
            try {
                await refreshProfile();
            } catch (error) {
                console.error('Failed to load profile');
            } finally {
                setIsLoadingProfile(false);
            }
        };
        loadData();
    }, [refreshProfile]);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
            setBio(user.bio || '');
            setLanguages(user.languages || []);
            setProfileImage(user.profileImage || null);
            setLocation(user.location || '');
            setPhoneNumber(user.phoneNumber || '');
            setShowEmail(user.showEmail || false);
            setShowMobile(user.showMobile || false);
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

    const handleProfileImageUpload = async (e) => {
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

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Upload profile image to Cloudinary if it's a new image (base64 data URL)
            let uploadedProfileImage = profileImage;
            if (profileImage && profileImage.startsWith('data:')) {
                const { uploadToCloudinary } = await import('@/utils/cloudinary');
                uploadedProfileImage = await uploadToCloudinary(profileImage);
            }

            const payload = {
                name,
                bio,
                languages,
                profileImage: uploadedProfileImage,
                location,
                phoneNumber,
                showEmail,
                showMobile,
            };

            const response = await api.put('/auth/profile', payload);
            setUser(response.data.user);
            // Refresh profile in auth store to update header
            await refreshProfile();
            toast.success('Profile updated successfully');
            router.push('/profile');
        } catch (error) {
            console.error('Profile update error:', error);
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoadingProfile) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="max-w-4xl mx-auto space-y-6">
                    <Skeleton className="h-8 w-48" />
                    <Card>
                        <CardContent className="p-6 space-y-8">
                            <div className="flex flex-col items-center space-y-4">
                                <Skeleton className="w-32 h-32 rounded-full" />
                                <Skeleton className="h-9 w-32" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="space-y-2">
                                        <Skeleton className="h-3 w-20" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/profile')}
                        className="h-9 w-9 p-0"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Edit Profile</h1>
                        <p className="text-muted-foreground  text-sm">Update your profile information</p>
                    </div>
                </div>

                <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <Card className="border border-border/50 shadow-sm">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-primary shadow-inner">
                                    <User className="w-6 h-6" />
                                </div>
                                <CardTitle className="text-xl font-normal">Personal Information</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            {/* Profile Image */}
                            <div className="flex flex-col items-center justify-center space-y-4">
                                <input
                                    type="file"
                                    ref={profileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleProfileImageUpload}
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

                            {/* Basic Info & Contact */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold px-1">
                                        Display Name *
                                    </label>
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        disabled={isLoading}
                                        required
                                        className="h-10"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold px-1">
                                        Location
                                    </label>
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
                                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                                            Email
                                        </label>
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
                                        readOnly={showEmail}
                                        className="h-10 disabled:opacity-100"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                                            Phone
                                        </label>
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

                            {/* Bio & Languages */}
                            <div className="space-y-5 pt-2">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold px-1">
                                        Bio
                                    </label>
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
                                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold px-1">
                                        Languages
                                    </label>
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

                    {/* Action Buttons */}
                    <div className="pt-6 border-t border-border flex justify-end gap-4 sticky bottom-0 bg-background/80 backdrop-blur-sm py-4 z-10">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push('/profile')}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
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
            </div>
        </div>
    );
}

