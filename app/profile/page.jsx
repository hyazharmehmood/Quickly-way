'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
    const { user, isLoggedIn, isLoading } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!isLoggedIn && !isLoading) {
            router.push('/login');
        }
    }, [isLoggedIn, isLoading, router]);

    if (isLoading || !isLoggedIn) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-8">My Profile</h1>
            <Card className="max-w-3xl mx-auto">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <Avatar className="w-24 h-24">
                            <AvatarImage src={user?.avatar} />
                            <AvatarFallback className="text-3xl bg-primary/10 text-primary">{userInitial}</AvatarFallback>
                        </Avatar>
                        <div className="text-center sm:text-left">
                            <CardTitle className="text-3xl font-semibold">{user?.name}</CardTitle>
                            <p className="text-muted-foreground mt-1">{user?.email}</p>
                            <div className="flex items-center justify-center sm:justify-start gap-2 mt-3">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground capitalize">
                                    {user?.role?.toLowerCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="mt-6">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">About Me</h3>
                            <p className="text-gray-600 leading-relaxed">
                                {user?.bio || "No bio added yet. Go to settings to update your profile."}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Account Status</h4>
                                <p className="font-medium">Active</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Member Since</h4>
                                <p className="font-medium">{new Date(user?.createdAt).toLocaleDateString() || 'Recently'}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
