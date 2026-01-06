"use client";

import { Sidebar } from '@/components/admin/Sidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/useAuthStore';

export default function AdminLayout({ children }) {
    const router = useRouter();

    const handleLogout = () => {
        useAuthStore.getState().logout();
        router.push('/login');
    };

    return (
        <div className="flex h-screen bg-[#f8faff] overflow-hidden font-sans">
            <Sidebar onLogout={handleLogout} />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <AdminHeader />
                <main className="flex-1 overflow-y-auto no-scrollbar p-6">
                    <div className="max-w-screen-2xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
