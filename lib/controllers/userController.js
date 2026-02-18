import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signToken, signRefreshToken } from '@/lib/utils/jwt';
import { USER_ROLES, SELLER_STATUS } from '@/lib/shared/constants';

/**
 * Registers a new user.
 * @param {object} userData - The user registration data.
 * @returns {object} - The result including user data and tokens.
 * @throws {Error} - If validation fails or database error occurs.
 */
export async function registerUser(userData) {
    const { name, email, password, signupAs } = userData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        throw new Error('A user with this email already exists.');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // signupAs: 'client' | 'seller' — Client = buyer; Seller = seller-only until they also join as client. Seller access is granted when admin approves their agreement request.
    const isSellerSignup = signupAs === 'seller';
    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: isSellerSignup ? USER_ROLES.FREELANCER : USER_ROLES.CLIENT,
            isSeller: false,
            sellerStatus: SELLER_STATUS.NONE,
        },
    });

    // Generate JWTs
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ id: user.id });

    // Save refresh token
    await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
    });

    return {
        message: 'User registered successfully.',
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

/**
 * Get user profile by ID.
 * @param {string} userId
 */
export async function getUserProfile(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isSeller: true,
            sellerStatus: true,
            profileImage: true,
            coverImage: true,
            languages: true,
            skills: true,
            bio: true,
            portfolio: true,
            location: true,
            phoneNumber: true,
            showEmail: true,
            showMobile: true,
            yearsOfExperience: true,
            availability: true,
            employmentStatus: true,
        }
    });

    if (!user) {
        throw new Error('User not found');
    }

    return user;
}

/**
 * Updates a user's profile.
 * @param {string} userId - The ID of the user.
 * @param {object} data - The profile data to update.
 * @returns {object} - The updated user object.
 */
export async function updateUserProfile(userId, data) {
    const {
        name, bio, portfolio,
        profileImage, coverImage, languages,
        location, phoneNumber, showEmail, showMobile,
        yearsOfExperience, availability, employmentStatus,
    } = data;

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            ...(name && { name }),
            ...(bio !== undefined && { bio }),
            ...(portfolio !== undefined && { portfolio }),

            // New fields
            ...(profileImage !== undefined && { profileImage }),
            ...(coverImage !== undefined && { coverImage }),
            ...(languages && { languages }),
            ...(location !== undefined && { location }),
            ...(phoneNumber !== undefined && { phoneNumber }),
            ...(showEmail !== undefined && { showEmail }),
            ...(showMobile !== undefined && { showMobile }),
            ...(yearsOfExperience !== undefined && { yearsOfExperience: yearsOfExperience !== null && yearsOfExperience !== '' ? parseInt(yearsOfExperience, 10) : null }),
            ...(availability && { availability }),
            ...(employmentStatus !== undefined && { employmentStatus: employmentStatus || null }),
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            bio: true,
            portfolio: true,
            isSeller: true,
            sellerStatus: true,

            profileImage: true,
            coverImage: true,
            languages: true,
            location: true,
            phoneNumber: true,
            showEmail: true,
            showMobile: true,
            yearsOfExperience: true,
            availability: true,
            employmentStatus: true,
        }
    });

    return updatedUser;
}
