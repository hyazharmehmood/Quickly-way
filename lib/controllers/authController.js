import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signToken, signRefreshToken, verifyRefreshToken, verifyToken } from '@/lib/utils/jwt';
import { HTTP_STATUS } from '@/lib/shared/constants';

import { headers } from 'next/headers';

// --- Login Logic ---
export async function loginUser(email, password) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        throw new Error('Invalid email or password.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Invalid email or password.');
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ id: user.id });

    await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
    });

    return {
        message: 'Logged in successfully.',
        token,
        refreshToken,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isSeller: user.isSeller,
            sellerStatus: user.sellerStatus,
        },
    };
}

// --- Refresh Session Logic ---
export async function refreshSession(refreshToken) {
    if (!refreshToken) {
        throw new Error('Refresh token is required');
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
        throw new Error('Invalid refresh token');
    }

    const user = await prisma.user.findFirst({
        where: { id: decoded.id, refreshToken: refreshToken },
    });

    if (!user) {
        throw new Error('Invalid refresh token');
    }

    const newAccessToken = signToken({ id: user.id, email: user.email, role: user.role });
    const newRefreshToken = signRefreshToken({ id: user.id });

    await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newRefreshToken },
    });

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
    };
}

// --- Get Current User Logic ---
export async function getCurrentUser(token) {
    if (!token) throw new Error('Unauthorized');

    const decoded = verifyToken(token);
    if (!decoded) throw new Error('Invalid or expired token');

    const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isSeller: true,
            sellerStatus: true,
            // Including additional profile fields for completeness
            profileImage: true,
            coverImage: true,
            languages: true,
            skills: true,
            bio: true,
            location: true,
            phoneNumber: true,
            showEmail: true,
            showMobile: true,
            availability: true,
        },
    });

    if (!user) {
        throw new Error('User not found');
    }

    return { user };
}

// --- Change Password Logic ---
export async function changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user) {
        throw new Error('User not found');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        throw new Error('Incorrect current password.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
    });

    return true;
}

/**
 * Helper to extract User ID from the current request headers.
 * Useful for server-side API routes.
 */
export async function getUserId() {
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = verifyToken(token);
        return decoded?.id || null;
    } catch (error) {
        return null; // Invalid token
    }
}
