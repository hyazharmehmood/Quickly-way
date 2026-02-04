"use client";

import { useEffect } from 'react';
import useAuthStore from '@/store/useAuthStore';
import { SessionExpiryDialog } from './SessionExpiryDialog';
import { useGlobalSocket } from '@/hooks/useGlobalSocket';
import { usePublicPresence } from '@/hooks/usePublicPresence';

export function AuthInitializer({ children }) {
    const { fetchProfile, setLoading, isLoggedIn } = useAuthStore();
    
    // Initialize global socket connection ONLY when user is logged in
    // This prevents interference with login API calls
    useGlobalSocket();
    
    // Initialize public presence for ALL users (including guests)
    // This allows guest users to see freelancer online status
    usePublicPresence();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchProfile();
        } else {
            setLoading(false); // If no token, we are done loading (not logged in)
        }
    }, [fetchProfile, setLoading]);

    return (
        <>
            {children}
            <SessionExpiryDialog />
        </>
    );
}
