"use client";

import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { ChatContainer } from '@/components/chat/ChatContainer';

function MessagesContent() {
    return <ChatContainer />;
}

export default function MessagesPage() {
    return (
        <Suspense fallback={
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <MessagesContent />
        </Suspense>
    );
}
