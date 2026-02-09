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

        // Freelancer dashboard: allow ADMIN, FREELANCER, or CLIENT with approved seller (isSeller)
        if (pathname.startsWith('/dashboard/freelancer')) {
            const normalizedRole = role ? role.toUpperCase() : '';
            const isSeller = request.cookies.get('isSeller')?.value === 'true';
            const allowed = normalizedRole === 'ADMIN' || normalizedRole === 'FREELANCER' || (normalizedRole === 'CLIENT' && isSeller);
            if (!allowed) {
                return NextResponse.redirect(new URL('/', request.url));
            }
        }
    }

    // 3. Protect Messages Route
    if (pathname.startsWith('/messages')) {
        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // 4. Redirect logged-in users away from /login and /signup
    if (pathname === '/login' || pathname === '/signup') {
        if (token) {
            if (role === 'ADMIN') {
                return NextResponse.redirect(new URL('/admin', request.url));
            }
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // 5. Become seller page: login required
    if (pathname === '/become-seller' && !token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

// Config to match only relevant paths
export const config = {
    matcher: ['/dashboard/:path*', '/admin/:path*', '/messages/:path*', '/login', '/signup', '/become-seller'],
};

