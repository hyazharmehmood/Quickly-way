"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/utils/api';

const setCookie = (name, value, days) => {
    if (typeof document === 'undefined') return;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
};

const removeCookie = (name) => {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            token: null,
            isLoggedIn: false,
            sellerStatus: 'none',
            isSeller: false,
            role: 'client',

            setUser: (user) => {
                set({
                    user,
                    isLoggedIn: !!user,
                    sellerStatus: user?.sellerStatus || 'none',
                    isSeller: user?.isSeller || false,
                    role: user?.role || 'client'
                });
                if (user?.role) setCookie('role', user.role, 7);
            },

            setToken: (token) => {
                set({ token });
                if (token) {
                    localStorage.setItem('token', token);
                    setCookie('token', token, 7);
                } else {
                    localStorage.removeItem('token');
                    removeCookie('token');
                    removeCookie('role');
                }
            },

            login: async (credentials) => {
                const response = await api.post('/auth/login', credentials);
                const { user, token } = response.data;
                set({
                    user,
                    token,
                    isLoggedIn: true,
                    sellerStatus: user.sellerStatus,
                    isSeller: user.isSeller,
                    role: user.role
                });
                localStorage.setItem('token', token);
                setCookie('token', token, 7);
                setCookie('role', user.role, 7);
                return response.data;
            },

            signup: async (userData) => {
                const response = await api.post('/auth/signup', userData);
                const { user, token } = response.data;
                set({
                    user,
                    token,
                    isLoggedIn: true,
                    sellerStatus: user.sellerStatus,
                    isSeller: user.isSeller,
                    role: user.role
                });
                localStorage.setItem('token', token);
                setCookie('token', token, 7);
                setCookie('role', user.role, 7);
                return response.data;
            },

            logout: () => {
                set({
                    user: null,
                    token: null,
                    isLoggedIn: false,
                    sellerStatus: 'none',
                    isSeller: false,
                    role: 'client'
                });
                localStorage.removeItem('token');
                localStorage.removeItem('auth-storage');
                removeCookie('token');
                removeCookie('role');
            },
            // ... rest of the store

            updateSellerStatus: (status) => set((state) => ({
                sellerStatus: status,
                user: state.user ? { ...state.user, sellerStatus: status } : null
            })),

            updateRole: (role) => {
                setCookie('role', role, 7);
                set((state) => ({
                    role,
                    user: state.user ? { ...state.user, role } : null
                }));
            }
        }),
        {
            name: 'auth-storage',
        }
    )
);

export default useAuthStore;
