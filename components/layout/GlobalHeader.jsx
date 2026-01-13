'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';

export function GlobalHeader() {
    const pathname = usePathname();
    const isDashboard = pathname.startsWith('/dashboard');
    const isAuthPage = pathname === '/login' || pathname === '/signup';
    const isAdminPage = pathname === '/admin';

    if (isDashboard || isAuthPage || isAdminPage) {
        return null;
    }

    return <Header />;
}
