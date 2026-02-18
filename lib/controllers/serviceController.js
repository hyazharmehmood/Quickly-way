import prisma from '@/lib/prisma';
import { hasPrismaModel, safeReviewQuery } from '@/lib/utils/prismaCheck';

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
        skills,
        paymentRegion,
        paymentMethods,
        paymentMethodsText,
        paymentMethodsTextAr,
    } = data;

    // Start a transaction to update user profile and create service
    const result = await prisma.$transaction(async (tx) => {
        // 1. Update User Profile if fields provided (skills are now on services, not users)
        if (profileImage || coverImage || (languages && languages.length > 0) || displayName) {
            await tx.user.update({
                where: { id: userId },
                data: {
                    ...(profileImage && { profileImage }),
                    ...(coverImage && { coverImage }),
                    ...(languages && { languages }),
                    ...(displayName && { name: displayName })
                }
            });
        }

        // 2. Create Service
        // Only include skills if skillIds are provided (and table exists)
        const hasSkills = data.skillIds && Array.isArray(data.skillIds) && data.skillIds.length > 0;
        
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
                searchTags: searchTags || [],
                paymentRegion: paymentRegion || "SAUDI_ARABIA",
                paymentMethods: Array.isArray(paymentMethods) ? paymentMethods : [],
                paymentMethodsText: paymentMethodsText?.trim() || null,
                paymentMethodsTextAr: paymentMethodsTextAr?.trim() || null,
                // Connect skills if provided (skillIds should be an array of skill IDs)
                ...(hasSkills && {
                    skills: {
                        create: data.skillIds.map(skillId => ({
                            skillId: skillId
                        }))
                    }
                })
            },
            ...(hasSkills && {
                include: {
                    skills: {
                        include: {
                            skill: true
                        }
                    }
            }
            })
        });

        return service;
    }, {
        maxWait: 5000, // default: 2000
        timeout: 10000 // default: 5000
    });

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
        coverColor,
        skillIds,
        paymentRegion,
        paymentMethods,
        paymentMethodsText,
        paymentMethodsTextAr,
    } = data;

    // 2. Update Service (including skills)
    const updatedService = await prisma.$transaction(async (tx) => {
        // First, delete all existing service skills
        await tx.serviceSkill.deleteMany({
            where: { serviceId: serviceId }
        });

        // Then update the service and create new skill connections
        const service = await tx.service.update({
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
            ...(paymentRegion !== undefined && { paymentRegion: paymentRegion || "SAUDI_ARABIA" }),
            ...(Array.isArray(paymentMethods) && { paymentMethods }),
            ...(paymentMethodsText !== undefined && { paymentMethodsText: paymentMethodsText?.trim() || null }),
            ...(paymentMethodsTextAr !== undefined && { paymentMethodsTextAr: paymentMethodsTextAr?.trim() || null }),
            showEmail: showEmail ?? false,
                showMobile: showMobile ?? false,
                // Connect new skills if provided
                ...(skillIds && skillIds.length > 0 && {
                    skills: {
                        create: skillIds.map(skillId => ({
                            skillId: skillId
                        }))
                    }
                })
            },
            include: {
                skills: {
                    include: {
                        skill: true
                    }
                }
            }
        });

        return service;
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
                    location: true
                }
            },
            skills: {
                include: {
                    skill: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return services;
}

/**
 * Gets all public services, optionally filtered by skill slug.
 * @param {string} skillSlug - Optional skill slug to filter services.
 * @returns {Array} - List of all services.
 */
export async function getAllServices(skillSlug = null) {
    const whereClause = {};

    if (skillSlug) {
        whereClause.skills = {
            some: {
                skill: {
                    slug: skillSlug,
                    isActive: true
                }
            }
        };
    }

    const services = await prisma.service.findMany({
        where: whereClause,
        include: {
            freelancer: {
                select: {
                    name: true,
                    profileImage: true,
                    // add location if available in schema
                }
            },
            skills: {
                include: {
                    skill: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    // Add reviews, rating, and reviewCount to each service
    const servicesWithReviews = await Promise.all(services.map(async (service) => {
        let allReviews = [];
        let avgRating = 5.0;
        let reviewCount = 0;
        let completedOrders = [];

        try {
            // 1. Get service-based reviews (check if Review model exists)
            const serviceReviews = await safeReviewQuery(async (reviewModel) => {
                return await reviewModel.findMany({
                    where: {
                        serviceId: service.id,
                        isOrderReview: false,
                    },
                });
            });

            // 2. Get completed orders for this service
            completedOrders = await prisma.order.findMany({
                where: {
                    serviceId: service.id,
                    status: 'COMPLETED',
                },
                select: {
                    id: true,
                },
            }).catch(() => []);

            // 3. Get order-based reviews (only client reviews)
            let orderReviews = [];
            if (completedOrders.length > 0) {
                const orderIds = completedOrders.map(o => o.id);
                orderReviews = await safeReviewQuery(async (reviewModel) => {
                    return await reviewModel.findMany({
                        where: {
                            orderId: { in: orderIds },
                            isOrderReview: true,
                            isClientReview: true,
                        },
                    });
                });
            }

            // 4. Combine all reviews
            allReviews = [...serviceReviews, ...orderReviews];
            reviewCount = allReviews.length;

            // 5. Calculate rating
            if (allReviews.length > 0) {
                const totalRating = allReviews.reduce((sum, r) => sum + (r.rating || 5), 0);
                avgRating = totalRating / allReviews.length;
            }
        } catch (error) {
            console.warn(`Error fetching reviews for service ${service.id}:`, error);
            // Ensure variables are set even on error
            completedOrders = completedOrders || [];
        }

        return {
            ...service,
            reviews: allReviews,
            rating: avgRating,
            reviewCount: reviewCount,
            orderCount: completedOrders.length || 0,
        };
    }));

    return servicesWithReviews;
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
                    id: true, name: true, email: true, phoneNumber: true, profileImage: true,
                    sellerStatus: true, createdAt: true, languages: true,
                    bio: true, availability: true, employmentStatus: true,
                    location: true, yearsOfExperience: true,
                }
            },
            skills: {
                include: {
                    skill: true
                }
            }
        }
    });

    if (!service) {
        return null;
    }

    // Get all reviews for this service (service-based + order-based)
    let allReviews = [];

    try {
        // 1. Get service-based reviews (direct gig reviews) - check if Review model exists
        const serviceReviews = await safeReviewQuery(async (reviewModel) => {
            return await reviewModel.findMany({
                where: {
                    serviceId,
                    isOrderReview: false, // Only service-based reviews
                },
                include: {
                    reviewer: {
                        select: {
                            id: true,
                            name: true,
                            profileImage: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
        });

        // 2. Get completed orders for this service
        const completedOrders = await prisma.order.findMany({
            where: {
                serviceId,
                status: 'COMPLETED',
            },
            select: {
                id: true,
                orderNumber: true,
            },
        }).catch(() => []);

        // 3. Get order-based reviews (only client reviews about the service/freelancer)
        let orderReviews = [];
        if (completedOrders.length > 0) {
            const orderIds = completedOrders.map(o => o.id);
            orderReviews = await safeReviewQuery(async (reviewModel) => {
                return await reviewModel.findMany({
                    where: {
                        orderId: { in: orderIds },
                        isOrderReview: true,
                        isClientReview: true, // Only client reviews (reviews about freelancer/service)
                    },
                    include: {
                        reviewer: {
                            select: {
                                id: true,
                                name: true,
                                profileImage: true,
                            },
                        },
                        order: {
                            select: {
                                id: true,
                                orderNumber: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                });
            });
        }

        // 4. Combine all reviews
        allReviews = [...serviceReviews, ...orderReviews];

        // 5. Calculate rating and review count
        let avgRating = 5.0;
        let reviewCount = allReviews.length;
        if (allReviews.length > 0) {
            const totalRating = allReviews.reduce((sum, r) => sum + (r.rating || 5), 0);
            avgRating = totalRating / allReviews.length;
        }

        // 6. Add reviews, rating, and reviewCount to service object
        service.reviews = allReviews;
        service.rating = avgRating;
        service.reviewCount = reviewCount;
        service.orderCount = completedOrders.length; // Also include order count

    } catch (error) {
        // If Review table doesn't exist, set defaults
        console.warn('Error fetching reviews for service:', error);
        service.reviews = [];
        service.rating = 5.0;
        service.reviewCount = 0;
        service.orderCount = 0;
    }

    return service;
}
