"use client";

import { useEffect } from 'react';
import useAuthStore from '@/store/useAuthStore';
import { SessionExpiryDialog } from './SessionExpiryDialog';

export function AuthInitializer({ children }) {
    const { fetchProfile } = useAuthStore();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchProfile();
        }
    }, [fetchProfile]);

    return (
        <>
            {children}
            <SessionExpiryDialog />
        </>
    );
}
