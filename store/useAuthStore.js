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
            refreshToken: null,
            isLoggedIn: false,
            isLoading: true, // Add loading state
            sellerStatus: 'none',
            isSeller: false,
            role: 'client',
            showExpiryDialog: false,

            setShowExpiryDialog: (show) => set({ showExpiryDialog: show }),

            setLoading: (loading) => set({ isLoading: loading }),

            setUser: (user) => {
                set({
                    user,
                    isLoggedIn: !!user,
                    sellerStatus: user?.sellerStatus || 'none',
                    isSeller: user?.isSeller || false,
                    role: user?.role || 'client',
                    isLoading: false // Stop loading when user is set
                });
                if (user?.role) setCookie('role', user.role, 7);
                setCookie('isSeller', user?.isSeller ? 'true' : 'false', 7);
            },

            setToken: (token, refreshToken) => {
                set({ token, refreshToken });
                if (token) {
                    localStorage.setItem('token', token);
                    setCookie('token', token, 7);
                } else {
                    localStorage.removeItem('token');
                    removeCookie('token');
                }

                if (refreshToken) {
                    localStorage.setItem('refreshToken', refreshToken);
                } else {
                    localStorage.removeItem('refreshToken');
                }
            },

            login: async (credentials) => {
                const response = await api.post('/auth/login', credentials);
                const { user, token, refreshToken } = response.data;
                set({
                    user,
                    token,
                    refreshToken,
                    isLoggedIn: true,
                    sellerStatus: user.sellerStatus,
                    isSeller: user.isSeller,
                    role: user.role,
                    showExpiryDialog: false,
                    isLoading: false
                });
                localStorage.setItem('token', token);
                localStorage.setItem('refreshToken', refreshToken);
                setCookie('token', token, 7);
                setCookie('role', user.role, 7);
                setCookie('isSeller', user.isSeller ? 'true' : 'false', 7);
                return response.data;
            },

            signup: async (userData) => {
                const response = await api.post('/auth/signup', userData);
                const { user, token, refreshToken } = response.data;
                set({
                    user,
                    token,
                    refreshToken,
                    isLoggedIn: true,
                    sellerStatus: user.sellerStatus,
                    isSeller: user.isSeller,
                    role: user.role,
                    showExpiryDialog: false
                });
                localStorage.setItem('token', token);
                localStorage.setItem('refreshToken', refreshToken);
                setCookie('token', token, 7);
                setCookie('role', user.role, 7);
                setCookie('isSeller', user.isSeller ? 'true' : 'false', 7);
                return response.data;
            },

            logout: () => {
                set({
                    user: null,
                    token: null,
                    refreshToken: null,
                    isLoggedIn: false,
                    sellerStatus: 'none',
                    isSeller: false,
                    role: 'client',
                    showExpiryDialog: false
                });
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('auth-storage');
                removeCookie('token');
                removeCookie('role');
                removeCookie('isSeller');
            },

            refreshSession: async () => {
                const currentRefreshToken = useAuthStore.getState().refreshToken || localStorage.getItem('refreshToken');
                if (!currentRefreshToken) {
                    useAuthStore.getState().logout();
                    return false;
                }

                try {
                    // Step 1: Refresh the token
                    const response = await api.post('/auth/refresh', { refreshToken: currentRefreshToken });
                    const { token, refreshToken } = response.data;

                    // Step 2: Update token in store and storage
                    set({
                        token,
                        refreshToken,
                        showExpiryDialog: false
                    });

                    localStorage.setItem('token', token);
                    localStorage.setItem('refreshToken', refreshToken);
                    setCookie('token', token, 7);

                    // Step 3: Fetch user profile with the new token to verify it works
                    try {
                        const profileResponse = await api.get('/auth/me');
                        const { user } = profileResponse.data;
                        set({
                            user,
                            isLoggedIn: true,
                            sellerStatus: user.sellerStatus,
                            isSeller: user.isSeller,
                            role: user.role,
                        });
                        setCookie('role', user.role, 7);
                        setCookie('isSeller', user.isSeller ? 'true' : 'false', 7);
                    } catch (profileError) {
                        // If profile fetch fails, token might still be invalid
                        console.error('Failed to fetch profile after refresh:', profileError);
                        // Don't logout here, just return false - the token refresh succeeded
                        // but profile fetch failed, which might be a temporary issue
                        if (profileError.response?.status === 401) {
                            useAuthStore.getState().logout();
                            return false;
                        }
                    }

                    return true;
                } catch (error) {
                    console.error('Failed to refresh session:', error);
                    useAuthStore.getState().logout();
                    return false;
                }
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
            },

            fetchProfile: async () => {
                set({ isLoading: true });
                try {
                    const response = await api.get('/auth/me');
                    const { user } = response.data;
                    set({
                        user,
                        isLoggedIn: true,
                        sellerStatus: user.sellerStatus,
                        isSeller: user.isSeller,
                        role: user.role,
                        isLoading: false
                    });
                    setCookie('role', user.role, 7);
                    setCookie('isSeller', user.isSeller ? 'true' : 'false', 7);
                } catch (error) {
                    set({ isLoading: false }); // Ensure loading stops even on error
                    if (error.response?.status === 401) {
                        set({ showExpiryDialog: true });
                    }
                }
            },

            refreshProfile: async () => {
                try {
                    const response = await api.get('/auth/me');
                    const { user } = response.data;
                    set({
                        user,
                        isLoggedIn: true,
                        sellerStatus: user.sellerStatus,
                        isSeller: user.isSeller,
                        role: user.role,
                    });
                    setCookie('role', user.role, 7);
                    setCookie('isSeller', user.isSeller ? 'true' : 'false', 7);
                } catch (error) {
                    if (error.response?.status === 401) {
                        set({ showExpiryDialog: true });
                    }
                }
            }
        }),
        {
            name: 'auth-storage',
        }
    )
);

export default useAuthStore;
