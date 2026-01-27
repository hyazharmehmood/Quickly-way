'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit2, Mail, Phone, MapPin, Globe, Calendar, User as UserIcon } from 'lucide-react';
import useAuthStore from '@/store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/utils/api';

export default function ProfilePage() {
    const { user: authUser, isLoggedIn, isLoading: authLoading, refreshProfile } = useAuthStore();
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            router.push('/login');
        }
    }, [isLoggedIn, authLoading, router]);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const response = await api.get('/auth/me');
                if (response.data.user) {
                    setUser(response.data.user);
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };

        if (isLoggedIn) {
            fetchUserProfile();
        }
    }, [isLoggedIn]);

    if (authLoading || loading || !isLoggedIn) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-10 w-24" />
                    </div>
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-6">
                                <Skeleton className="w-24 h-24 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-8 w-48" />
                                    <Skeleton className="h-4 w-64" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <p className="text-muted-foreground">Failed to load profile</p>
            </div>
        );
    }

    const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
                        <p className="text-muted-foreground mt-1">View and manage your profile information</p>
                    </div>
                    <Button
                        onClick={() => router.push('/profile/edit')}
                      size="sm"
                      
                    >
                        <Edit2 className="w-4 h-4 " />
                        Edit Profile
                    </Button>
                </div>

                {/* Profile Card */}
                <Card className="border-none shadow-sm">
                    <CardHeader className="pb-6">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                            <Avatar className="w-32 h-32 border-4 border-secondary">
                                <AvatarImage src={user?.profileImage} />
                                <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                                    {userInitial}
                                </AvatarFallback>
                            </Avatar>
                            <div className="text-center sm:text-left flex-1">
                                <CardTitle className="text-xl font-semibold mb-1">{user?.name || 'No Name'}</CardTitle>
                                {/* <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                                   <Badge variant="secondary" className="capitalize">
                                        {user?.role?.toLowerCase() || 'user'}
                                 </Badge> 
                                    {user?.isSeller && (
                                        <Badge variant="default">
                                            Seller
                                        </Badge>
                                    )}
                                </div> */}
                                <div className="space-y-2 text-sm text-muted-foreground">
                                    {user?.email && (
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            <span>{user.showEmail ? user.email : 'Email hidden'}</span>
                                        </div>
                                    )}
                                    {user?.phoneNumber && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4" />
                                            <span>{user.showMobile ? user.phoneNumber : 'Phone hidden'}</span>
                                        </div>
                                    )}
                                    {user?.location && (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            <span>{user.location}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Bio Section */}
                        <div className="pt-6 border-t border-border">
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <UserIcon className="w-5 h-5" />
                                About Me
                            </h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {user?.bio || "No bio added yet. Click 'Edit Profile' to add a bio."}
                            </p>
                        </div>

                        {/* Languages Section */}
                        {user?.languages && user.languages.length > 0 && (
                            <div className="pt-6 border-t border-border">
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                    <Globe className="w-5 h-5" />
                                    Languages
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {user.languages.map((lang, index) => (
                                        <Badge key={index} variant="outline">
                                            {lang}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Additional Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border">
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Member Since
                                </h4>
                                <p className="font-medium text-foreground">
                                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    }) : 'Recently'}
                                </p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-1">Account Status</h4>
                                <Badge variant="default" className="font-medium">
                                    Active
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
