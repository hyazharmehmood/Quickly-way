/**
 * Server-side handler for /api/services/public
 * Uses CJS require - runs in same process as socket, so presence store is shared
 */
const prisma = require('./prisma.cjs');
const presence = require('./presence');

async function safeReviewQuery(fn) {
  try {
    if (prisma.Review) return await fn(prisma.Review);
  } catch (_) {}
  return [];
}

async function getPublicServices(skillSlug = null, status = 'all') {
  const whereClause = {};

  if (skillSlug) {
    whereClause.skills = {
      some: {
        skill: { slug: skillSlug, isActive: true },
      },
    };
  }

  if (status === 'online' || status === 'offline') {
    const onlineIds = presence.getOnlineFreelancerIds();
    if (status === 'online') {
      whereClause.freelancerId = onlineIds.length > 0 ? { in: onlineIds } : { in: [] };
    } else {
      if (onlineIds.length > 0) whereClause.freelancerId = { notIn: onlineIds };
    }
  }

  const services = await prisma.service.findMany({
    where: whereClause,
    include: {
      freelancer: { select: { name: true, profileImage: true } },
      skills: { include: { skill: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const servicesWithReviews = await Promise.all(
    services.map(async (service) => {
      let allReviews = [];
      let avgRating = 5.0;
      let reviewCount = 0;
      let completedOrders = [];

      try {
        const serviceReviews = await safeReviewQuery((m) =>
          m.findMany({ where: { serviceId: service.id, isOrderReview: false } })
        );
        completedOrders = await prisma.order
          .findMany({
            where: { serviceId: service.id, status: 'COMPLETED' },
            select: { id: true },
          })
          .catch(() => []);

        let orderReviews = [];
        if (completedOrders.length > 0) {
          const orderIds = completedOrders.map((o) => o.id);
          orderReviews = await safeReviewQuery((m) =>
            m.findMany({
              where: {
                orderId: { in: orderIds },
                isOrderReview: true,
                isClientReview: true,
              },
            })
          );
        }

        allReviews = [...serviceReviews, ...orderReviews];
        reviewCount = allReviews.length;
        if (allReviews.length > 0) {
          avgRating = allReviews.reduce((sum, r) => sum + (r.rating || 5), 0) / allReviews.length;
        }
      } catch (_) {}

      return {
        ...service,
        reviews: allReviews,
        rating: avgRating,
        reviewCount,
        orderCount: completedOrders.length || 0,
      };
    })
  );

  return servicesWithReviews;
}

module.exports = { getPublicServices };
