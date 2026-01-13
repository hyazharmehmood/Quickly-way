import { NextResponse } from 'next/server';

export function proxy(request) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('token')?.value;
    const role = request.cookies.get('role')?.value;

    // 1. Protect Admin Routes
    if (pathname.startsWith('/admin')) {
        if (!token || role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // 2. Protect Dashboard Routes
    if (pathname.startsWith('/dashboard')) {
        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // Freelancer-specific protection
        if (pathname.startsWith('/dashboard/freelancer')) {
            const normalizedRole = role ? role.toUpperCase() : '';
            if (normalizedRole !== 'FREELANCER' && normalizedRole !== 'ADMIN') {
                return NextResponse.redirect(new URL('/', request.url));
            }
        }
    }

    // 3. Redirect logged-in users away from /login and /signup
    if (pathname === '/login' || pathname === '/signup') {
        if (token) {
            if (role === 'ADMIN') {
                return NextResponse.redirect(new URL('/admin', request.url));
            }
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    return NextResponse.next();
}

// Config to match only relevant paths
export const config = {
    matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/signup'],
};
