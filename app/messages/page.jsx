"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/useAuthStore';
import { MessageSquare, Users, Search, Loader2 } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function MessagesPlaceholder() {
    const { isLoggedIn, isLoading } = useAuthStore();
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

    return (
        <div className="animate-in fade-in duration-500 min-h-[calc(100vh-14rem)] flex flex-col md:flex-row gap-4 md:gap-8 container mx-auto py-4 md:py-8">
            <Card className="w-full md:w-80 rounded-2xl md:rounded-[2.5rem] border-border bg-card flex flex-col shadow-sm overflow-hidden h-[50vh] md:h-auto">
                <div className="p-6 border-b border-border">
                    <h3 className="text-xl font-normal text-foreground">Inbox</h3>
                    <div className="relative mt-4">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Search chats..." className="pl-10 h-10 bg-secondary/50 border-none rounded-xl" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                    <Users className="w-12 h-12 mb-4" />
                    <p className="text-sm font-normal">No active conversations</p>
                </div>
            </Card>

            <Card className="hidden md:flex flex-1 rounded-2xl md:rounded-[2.5rem] border-border bg-card flex-col items-center justify-center shadow-sm relative overflow-hidden h-auto">
                <div className="absolute inset-0 bg-secondary/10 opacity-50 pattern-grid"></div>
                <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-secondary flex items-center justify-center mb-8 border border-border">
                        <MessageSquare className="w-10 h-10 text-muted-foreground/40" />
                    </div>
                    <h3 className="text-2xl font-normal text-foreground tracking-tight">Select a Chat</h3>
                    <p className="text-muted-foreground font-normal mt-2">Pick a person from the left to start communicating or manage orders.</p>
                </div>
            </Card>
        </div>
    );
}
