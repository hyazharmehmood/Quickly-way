import { NextResponse } from 'next/server';
import { checkReviewExists, hasPrismaModel } from '@/lib/utils/prismaCheck';
import prisma from '@/lib/prisma';

/**
 * GET /api/health/prisma-check - Check Prisma models and database tables
 * Useful for checking if migrations have been applied
 */
export async function GET() {
    try {
        // Check Review model
        const reviewCheck = await checkReviewExists();
        
        // Check other important models
        const models = {
            review: {
                modelExists: hasPrismaModel('review'),
                tableExists: reviewCheck.tableExists,
                fullyAvailable: reviewCheck.fullyAvailable
            },
            user: {
                modelExists: hasPrismaModel('user'),
                tableExists: null // Can add check if needed
            },
            order: {
                modelExists: hasPrismaModel('order'),
                tableExists: null
            },
            service: {
                modelExists: hasPrismaModel('service'),
                tableExists: null
            }
        };

        // Try to check User table for rating fields
        let userRatingFields = { rating: false, reviewCount: false };
        try {
            const userColumns = await prisma.$queryRaw`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'User' 
                AND column_name IN ('rating', 'reviewCount');
            `;
            const columnNames = userColumns.map(c => c.column_name);
            userRatingFields.rating = columnNames.includes('rating');
            userRatingFields.reviewCount = columnNames.includes('reviewCount');
        } catch (error) {
            console.error('Error checking User columns:', error);
        }

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            models,
            userRatingFields,
            reviewStatus: {
                ...reviewCheck,
                message: reviewCheck.fullyAvailable 
                    ? 'Review system is fully available' 
                    : reviewCheck.modelExists 
                        ? 'Review model exists but table missing - run migrations'
                        : 'Review model missing - run: npx prisma generate'
            },
            recommendations: [
                !reviewCheck.modelExists && 'Run: npx prisma generate',
                !reviewCheck.tableExists && 'Run: npx prisma migrate deploy',
                !userRatingFields.rating && 'User.rating column missing - run migrations',
                !userRatingFields.reviewCount && 'User.reviewCount column missing - run migrations'
            ].filter(Boolean)
        });
    } catch (error) {
        console.error('Error checking Prisma status:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}



