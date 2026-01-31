import prisma from '@/lib/prisma';

/**
 * Check if a Prisma model exists in Prisma Client
 * @param {string} modelName - Name of the model (e.g., 'review', 'user')
 * @returns {boolean} - True if model exists in Prisma Client
 */
export function hasPrismaModel(modelName) {
    try {
        return prisma[modelName] !== undefined && typeof prisma[modelName] === 'object';
    } catch (error) {
        return false;
    }
}

/**
 * Check if a database table exists
 * @param {string} tableName - Name of the table (e.g., 'Review', 'User')
 * @returns {Promise<boolean>} - True if table exists in database
 */
export async function hasDatabaseTable(tableName) {
    try {
        // Use raw SQL to check if table exists
        const result = await prisma.$queryRaw`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = ${tableName}
            );
        `;
        return result[0]?.exists === true;
    } catch (error) {
        console.error(`Error checking table ${tableName}:`, error);
        return false;
    }
}

/**
 * Check if Review model and table exist
 * @returns {Promise<{modelExists: boolean, tableExists: boolean}>}
 */
export async function checkReviewExists() {
    const modelExists = hasPrismaModel('review');
    const tableExists = await hasDatabaseTable('Review');
    
    return {
        modelExists,
        tableExists,
        fullyAvailable: modelExists && tableExists
    };
}

/**
 * Safe wrapper to use Prisma Review model
 * Returns empty array if Review doesn't exist
 */
export async function safeReviewQuery(queryFn) {
    if (!hasPrismaModel('review')) {
        console.warn('Review model not available in Prisma Client');
        return [];
    }
    
    try {
        return await queryFn(prisma.review);
    } catch (error) {
        // If table doesn't exist, return empty array
        if (error.code === 'P2021' || error.message?.includes('does not exist') || error.message?.includes('undefined')) {
            console.warn('Review table does not exist in database');
            return [];
        }
        throw error;
    }
}



