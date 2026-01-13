"use client";

import { useEffect } from 'react';
import useAuthStore from '@/store/useAuthStore';
import { SessionExpiryDialog } from './SessionExpiryDialog';

export function AuthInitializer({ children }) {
    const { fetchProfile, setLoading } = useAuthStore();

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
