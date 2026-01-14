import prisma from '@/lib/prisma';

/**
 * Creates a new service and updates user profile details.
 * @param {string} userId - The ID of the freelancer.
 * @param {object} data - The service and profile data.
 * @returns {object} - The created service.
 */
export async function createService(userId, data) {
    const {
        title,
        description,
        category,
        subCategory,
        price,
        currency,
        priceBreakdowns,
        images,
        showEmail,
        showMobile,
        // User profile updates
        profileImage,
        coverImage,
        languages,
        displayName,
        searchTags,
        skills
    } = data;

    // Start a transaction to update user profile and create service
    const result = await prisma.$transaction(async (tx) => {
        // 1. Update User Profile if fields provided
        if (profileImage || coverImage || (languages && languages.length > 0) || displayName || (skills && skills.length > 0)) {
            await tx.user.update({
                where: { id: userId },
                data: {
                    ...(profileImage && { profileImage }),
                    ...(coverImage && { coverImage }),
                    ...(languages && { languages }),
                    ...(displayName && { name: displayName }),
                    ...(skills && { skills })
                }
            });
        }

        // 2. Create Service
        const service = await tx.service.create({
            data: {
                title,
                description,
                category,
                subCategory,
                price: parseFloat(price) || 0,
                currency,
                priceBreakdowns: priceBreakdowns || [], // JSON array
                images: images || [],
                // New Fields
                coverType: data.coverType || "IMAGE",
                coverImage: data.coverImage,
                coverText: data.coverText,
                coverColor: data.coverColor,
                // Relational Working Hours
                // removed as per user request to use profile availability

                showEmail: showEmail || false,
                showMobile: showMobile || false,
                freelancerId: userId,
                searchTags: searchTags || []
            }
        });

        return service;
    }, {
        maxWait: 5000, // default: 2000
        timeout: 10000 // default: 5000
    });

    return result;
    return result;
}

/**
 * Updates an existing service.
 * @param {string} userId - The ID of the freelancer (for authorization).
 * @param {string} serviceId - The ID of the service to update.
 * @param {object} data - The updated service data.
 * @returns {object} - The updated service.
 */
export async function updateService(userId, serviceId, data) {
    // 1. Check ownership
    const existingService = await prisma.service.findUnique({
        where: { id: serviceId }
    });

    if (!existingService) {
        throw new Error("Service not found");
    }

    if (existingService.freelancerId !== userId) {
        throw new Error("Unauthorized: You do not own this service");
    }

    const {
        title,
        description,
        category,
        subCategory,
        price,
        currency,
        priceBreakdowns,
        images,
        showEmail,
        showMobile,
        searchTags,
        coverType,
        coverImage,
        coverText,
        coverColor
    } = data;

    // 2. Update Service
    const updatedService = await prisma.service.update({
        where: { id: serviceId },
        data: {
            title,
            description,
            category,
            subCategory,
            price: parseFloat(price) || 0,
            currency,
            priceBreakdowns: priceBreakdowns || [],
            images: images || [],
            searchTags: searchTags || [],
            coverType: coverType || "IMAGE",
            coverImage,
            coverText,
            coverColor,
            showEmail: showEmail ?? false,
            showMobile: showMobile ?? false
        }
    });

    return updatedService;
}

/**
 * Gets all services for a specific freelancer.
 * @param {string} userId - The ID of the freelancer.
 * @returns {Array} - List of services.
 */
export async function getServicesByFreelancer(userId) {
    const services = await prisma.service.findMany({
        where: { freelancerId: userId },
        include: {
            freelancer: {
                select: {
                    name: true,
                    profileImage: true,
                    // location: true // Add location to User model if needed, currently not there
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return services;
}

/**
 * Gets all public services.
 * @returns {Array} - List of all services.
 */
export async function getAllServices() {
    const services = await prisma.service.findMany({
        include: {
            freelancer: {
                select: {
                    name: true,
                    profileImage: true,
                    // add location if available in schema
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
    return services;
}

/**
 * Gets a single service by ID.
 * @param {string} serviceId - The ID of the service.
 * @returns {object} - The service object.
 */
export async function getServiceById(serviceId) {
    const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: {
            freelancer: {
                select: {
                    id: true, name: true, email: true, profileImage: true,
                    sellerStatus: true, createdAt: true, languages: true,
                    skills: true, bio: true, availability: true,

                }
            }
        }
    });

    return service;
}
