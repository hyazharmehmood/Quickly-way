"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Globe2, Shield, Save, BellRing, UserCog, Smartphone, Languages, User, Camera, Loader2, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import useAuthStore from '@/store/useAuthStore';
import api from '@/utils/api';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
    const { user, setUser, refreshProfile } = useAuthStore();
    const [name, setName] = useState('');
    const [profileImage, setProfileImage] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileLoadDone, setProfileLoadDone] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const load = async () => {
            try {
                await refreshProfile();
            } catch {
                // ignore
            } finally {
                setProfileLoadDone(true);
            }
        };
        load();
    }, [refreshProfile]);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setProfileImage(user.profileImage || null);
        }
    }, [user]);

    const compressImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target?.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let w = img.width, h = img.height;
                    const max = 800;
                    if (w > h && w > max) { h = (h * max) / w; w = max; }
                    else if (h > max) { w = (w * max) / h; h = max; }
                    canvas.width = w; canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                };
            };
        });
    };

    const handlePhotoChange = async (e) => {
        const file = e.target?.files?.[0];
        if (!file) return;
        try {
            const dataUrl = await compressImage(file);
            setProfileImage(dataUrl);
        } catch {
            setProfileImage(URL.createObjectURL(file));
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        try {
            let uploadedImage = profileImage;
            if (profileImage && profileImage.startsWith('data:')) {
                const { uploadToCloudinary } = await import('@/utils/cloudinary');
                uploadedImage = await uploadToCloudinary(profileImage);
            }
            const res = await api.put('/auth/profile', { name, profileImage: uploadedImage });
            if (res.data?.user) setUser(res.data.user);
            await refreshProfile();
            toast.success('Profile updated successfully');
        } catch (err) {
            toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to update profile');
        } finally {
            setProfileLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            toast.error('New password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }
        setPasswordLoading(true);
        try {
            await api.put('/auth/change-password', { currentPassword, newPassword });
            toast.success('Password changed successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to change password');
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-4">
            <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="text-xl font-normal text-foreground">System Config</h3>
                <Badge variant="secondary" className="bg-primary/10 text-primary px-5 py-1.5 rounded-full text-xs font-normal uppercase tracking-widest border border-primary/20">
                    Build v2.4.0
                </Badge>
            </div>

            {/* Admin Profile & Password */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border-">
                    <CardHeader className="p-4 pb-0 border-none bg-transparent">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 text-primary rounded-[1rem] flex items-center justify-center border border-primary/20">
                                <User className="w-6 h-6" />
                            </div>
                            <CardTitle className="text-lg font-normal text-foreground tracking-tight">Admin Profile</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-6">
                        <div className="flex items-center flex-col w-full gap-6">
                            <div className="relative group">
                                {!profileLoadDone ? (
                                    <Skeleton className="w-24 h-24 rounded-full" />
                                ) : (
                                    <>
                                        <Avatar className="w-24 h-24 rounded-full border-2 border-border">
                                            <AvatarImage src={profileImage || user?.profileImage} alt={user?.name} />
                                            <AvatarFallback className="text-lg bg-primary/10 text-primary">{user?.name?.slice(0, 2)?.toUpperCase() || 'AD'}</AvatarFallback>
                                        </Avatar>
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
                                        >
                                            <Camera className="w-4 h-4" />
                                        </button>
                                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                                    </>
                                )}
                            </div>
                            <div className="flex flex-col w-full space-y-3">
                                <div className="w-full space-y-2">
                                    <Label className="">Display name</Label>
                                    <Input value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl" placeholder="Admin name" disabled={!profileLoadDone} />
                                </div>
                                <div className="w-full space-y-2">
                                    <Label className="">Email</Label>
                                    <Input value={user?.email || ''} className="w-full" readOnly disabled />
                                </div> 
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="px-10 py-10">
                        <Button className="w-full " variant="default" onClick={handleSaveProfile} disabled={profileLoading}>
                            {profileLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            <span className="ml-2">{profileLoading ? 'Saving...' : 'Save profile'}</span>
                        </Button>
                    </CardFooter>
                </Card>

                <Card className="border shadow-none">
                    <CardHeader className="p-4 ">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-[1rem] flex items-center justify-center border border-destructive/20">
                                <Shield className="w-6 h-6" />
                            </div>
                            <CardTitle className="text-lg font-normal text-foreground tracking-tight">Change Password</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Current password</Label>
                            <div className="relative">
                                <Input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="h-12 rounded-xl pr-10" placeholder="••••••••" />
                                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowCurrent(!showCurrent)}>{showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>New password</Label>
                            <div className="relative">
                                <Input type={showNew ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-12 rounded-xl pr-10" placeholder="••••••••" />
                                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowNew(!showNew)}>{showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Confirm new password</Label>
                            <div className="relative">
                                <Input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12 rounded-xl pr-10" placeholder="••••••••" />
                                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowConfirm(!showConfirm)}>{showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="px-10 py-10">
                        <Button className="w-full " variant="default" onClick={handleChangePassword} disabled={passwordLoading}>
                            {passwordLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                            <span className="ml-2">{passwordLoading ? 'Updating...' : 'Update password'}</span>
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border-none rounded-[2rem]">
                    <CardHeader className="p-10 pb-0 border-none bg-transparent">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-[1rem] flex items-center justify-center shadow-inner border border-blue-100">
                                <Globe2 className="w-6 h-6" />
                            </div>
                            <CardTitle className="text-lg font-normal text-foreground tracking-tight">Platform Identity</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10 space-y-8 flex-1">
                        <div className="space-y-2">
                            <label className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em] px-1">Marketplace Branding</label>
                            <Input
                                type="text"
                                defaultValue="Medcon Services"
                                className="h-14 bg-secondary/50 border-none rounded-[1.2rem] focus-visible:ring-primary/20 text-base py-4"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em] px-1">Administrative Contact</label>
                            <Input
                                type="email"
                                defaultValue="admin@medcon.com"
                                className="h-14 bg-secondary/50 border-none rounded-[1.2rem] focus-visible:ring-primary/20 text-base py-4"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none rounded-[2rem]">
                    <CardHeader className="p-10 pb-0 border-none bg-transparent">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-[1rem] flex items-center justify-center shadow-inner border border-destructive/20">
                                <Shield className="w-6 h-6" />
                            </div>
                            <CardTitle className="text-lg font-normal text-foreground tracking-tight">Operational Security</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10 space-y-6 flex-1">
                        <div className="flex items-center justify-between p-6 bg-secondary/30 rounded-[1.5rem] border border-transparent hover:bg-secondary/50 transition-all group">
                            <div>
                                <p className="font-normal text-foreground text-base">Maintenance Mode</p>
                                <p className="text-sm text-muted-foreground font-normal mt-1">Restrict all access</p>
                            </div>
                            <Switch />
                        </div>

                        <div className="flex items-center justify-between p-6 bg-secondary/30 rounded-[1.5rem] border border-transparent hover:bg-secondary/50 transition-all group">
                            <div>
                                <p className="font-normal text-foreground text-base">Auto-Approval</p>
                                <p className="text-sm text-muted-foreground font-normal mt-1">Skip moderation</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </CardContent>

                    <CardFooter className="px-10 pb-10">
                        <Button className="w-full h-14 flex items-center justify-center gap-3">
                            <Save className="w-6 h-6" /> Commit Changes
                        </Button>
                    </CardFooter>
                </Card>
            </div> */}

            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { icon: <BellRing />, title: "Notifications", color: "bg-purple-50/50 text-purple-500 border-purple-100" },
                    { icon: <Smartphone />, title: "App Config", color: "bg-indigo-50/50 text-indigo-500 border-indigo-100" },
                    { icon: <Languages />, title: "Localizations", color: "bg-orange-50/50 text-orange-500 border-orange-100" }
                ].map((box, i) => (
                    <Card key={i} className="flex items-center group cursor-pointer border-none rounded-[2rem]">
                        <CardContent className="p-8 flex items-center gap-4 w-full">
                            <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center transition-all group-hover:scale-110 border ${box.color}`}>
                                {React.cloneElement(box.icon, { className: 'w-6 h-6', strokeWidth: 1.5 })}
                            </div>
                            <span className="text-base font-normal text-foreground">{box.title}</span>
                        </CardContent>
                    </Card>
                ))}
            </div> */}
        </div>
    );
}
