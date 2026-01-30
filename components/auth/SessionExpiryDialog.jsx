"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import useAuthStore from '@/store/useAuthStore';
import { LogOut, RefreshCw, Clock } from 'lucide-react';

export const SessionExpiryDialog = () => {
    const router = useRouter();
    const { showExpiryDialog, setShowExpiryDialog, refreshSession, logout } = useAuthStore();
    const [isRefreshing, setIsRefreshing] = React.useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const success = await refreshSession();
            if (success) {
                setShowExpiryDialog(false);
                // Session refreshed successfully, user profile is updated
                // The axios interceptor will use the new token from localStorage on next request
            } else {
                // If refresh fails, refreshSession already calls logout
                router.push('/login');
            }
        } catch (error) {
            console.error('Error refreshing session:', error);
            router.push('/login');
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleLogout = () => {
        logout();
        setShowExpiryDialog(false);
        router.push('/login');
    };

    return (
        <Dialog open={showExpiryDialog} onOpenChange={(open) => {
            if (!open) {
                // Prevent closing by clicking outside or pressing escape
                // as the session IS actually expired.
                return;
            }
            setShowExpiryDialog(open);
        }}>
            <DialogContent className="sm:max-w-md border-none shadow-2xl rounded-3xl p-0 overflow-hidden">
                <div className="bg-primary/5 p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 animate-pulse">
                        <Clock className="w-8 h-8 text-primary" />
                    </div>
                    <DialogHeader className="space-y-2">
                        <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
                            Session Expired
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground text-base">
                            Your security session has timed out. Would you like to stay logged in or exit?
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-3 p-6 pt-2 pb-8 px-8">
                    <Button
                        variant="outline"
                        onClick={handleLogout}
                        className="flex-1 rounded-2xl h-12 gap-2 border-border hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 transition-all font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </Button>
                    <Button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="flex-1 rounded-2xl h-12 gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh Session'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SessionExpiryDialog;
