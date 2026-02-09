import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { HTTP_STATUS } from '@/lib/shared/constants';

/**
 * GET /api/freelancer/[id] - Get freelancer profile with services and reviews
 */
export async function GET(request, { params }) {
    try {
        const { id: freelancerId } = await params;

        if (!freelancerId) {
            return NextResponse.json(
                { error: 'Freelancer ID is required' },
                { status: HTTP_STATUS.BAD_REQUEST }
            );
        }

        // Get freelancer profile
        const freelancer = await prisma.user.findUnique({
            where: { id: freelancerId },
            select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
                bio: true,
                location: true,
                languages: true,
                availability: true,
                createdAt: true,
                role: true,
                isSeller: true,
            }
        });

        if (!freelancer) {
            return NextResponse.json(
                { success: false, error: 'Freelancer not found' },
                { status: HTTP_STATUS.NOT_FOUND }
            );
        }

        // User is a freelancer if role FREELANCER/ADMIN or CLIENT with approved seller
        const isFreelancer = freelancer.role === 'FREELANCER' || freelancer.role === 'ADMIN' || (freelancer.role === 'CLIENT' && freelancer.isSeller);
        if (!isFreelancer) {
            return NextResponse.json(
                { success: false, error: 'User is not a freelancer' },
                { status: HTTP_STATUS.NOT_FOUND }
            );
        }

        // Get all services for this freelancer with reviews
        const services = await prisma.service.findMany({
            where: { freelancerId },
            include: {
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
                // 1. Get service-based reviews
                const serviceReviews = await prisma.review.findMany({
                    where: {
                        serviceId: service.id,
                        isOrderReview: false,
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
                }).catch(() => []);

                // 2. Get completed orders for this service
                completedOrders = await prisma.order.findMany({
                    where: {
                        serviceId: service.id,
                        status: 'COMPLETED',
                    },
                    select: {
                        id: true,
                        orderNumber: true,
                        price: true,
                        currency: true,
                        completedAt: true,
                        createdAt: true,
                    },
                }).catch(() => []);

                // 3. Get order-based reviews (only client reviews)
                let orderReviews = [];
                if (completedOrders.length > 0) {
                    const orderIds = completedOrders.map(o => o.id);
                    orderReviews = await prisma.review.findMany({
                        where: {
                            orderId: { in: orderIds },
                            isOrderReview: true,
                            isClientReview: true,
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
                                    price: true,
                                    currency: true,
                                    completedAt: true,
                                    createdAt: true,
                                },
                            },
                        },
                    }).catch(() => []);
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
            }

            return {
                ...service,
                reviews: allReviews,
                rating: avgRating,
                reviewCount: reviewCount,
                orderCount: completedOrders.length || 0,
            };
        }));

        // Calculate overall rating and review count for freelancer
        const allFreelancerReviews = servicesWithReviews.flatMap(s => s.reviews);
        const overallRating = allFreelancerReviews.length > 0
            ? allFreelancerReviews.reduce((sum, r) => sum + (r.rating || 5), 0) / allFreelancerReviews.length
            : 5.0;
        const totalReviewCount = allFreelancerReviews.length;

        return NextResponse.json({
            success: true,
            freelancer: {
                ...freelancer,
                rating: overallRating,
                reviewCount: totalReviewCount,
            },
            services: servicesWithReviews,
        }, { status: HTTP_STATUS.OK });

    } catch (error) {
        console.error('Error fetching freelancer profile:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
    }
}

