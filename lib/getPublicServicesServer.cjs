/**
 * Optimized Server-side handler for /api/services/public
 * Uses CJS require - runs in same process as socket, so presence store is shared
 */
const prisma = require('./prisma.cjs');
const presence = require('./presence');

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 12;
const CACHE_TTL_MS = 30 * 1000;
const CACHE_ENABLED = process.env.SERVICES_PUBLIC_CACHE_DISABLED !== 'true';
const cacheStore = new Map();

// --- Pagination helper ---
function parsePagination(page, pageSize) {
  const safePage = Math.max(1, parseInt(page ?? '1', 10) || 1);
  const safeSizeRaw = parseInt(pageSize ?? `${DEFAULT_PAGE_SIZE}`, 10) || DEFAULT_PAGE_SIZE;
  const safePageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, safeSizeRaw));
  return { page: safePage, pageSize: safePageSize };
}

// --- Cache helpers ---
function getCacheKey(skillSlug, status, page, pageSize) {
  return [skillSlug || 'all', status || 'all', page, pageSize].join('|');
}

function getFromCache(key) {
  if (!CACHE_ENABLED) return null;
  const entry = cacheStore.get(key);
  if (!entry) return null;
  if (entry.expiry < Date.now()) {
    cacheStore.delete(key);
    return null;
  }
  return entry.value;
}

function setCache(key, value) {
  if (!CACHE_ENABLED) return;
  cacheStore.set(key, { value, expiry: Date.now() + CACHE_TTL_MS });
}

// --- Main function ---
async function getPublicServices(skillSlug = null, status = 'all', page = 1, pageSize = DEFAULT_PAGE_SIZE) {
  const { page: safePage, pageSize: safePageSize } = parsePagination(page, pageSize);
  const cacheKey = getCacheKey(skillSlug, status, safePage, safePageSize);

  // Return cached response if available
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  // --- Build where clause ---
  const whereClause = {};

  if (skillSlug) {
    whereClause.skills = {
      some: { skill: { slug: skillSlug, isActive: true } },
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

  // --- Get total count for pagination ---
  const total = await prisma.service.count({ where: whereClause });

  // --- Fetch services with minimal fields ---
  const services = await prisma.service.findMany({
    where: whereClause,
    skip: (safePage - 1) * safePageSize,
    take: safePageSize,
    include: {
      freelancer: { select: { name: true, profileImage: true } },
      skills: { select: { skill: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // --- Collect service IDs for aggregation ---
  const serviceIds = services.map(s => s.id);

  // --- Aggregate reviews ---
  const reviewStats = serviceIds.length > 0
    ? await prisma.review.groupBy({
        by: ['serviceId'],
        where: { serviceId: { in: serviceIds } },
        _avg: { rating: true },
        _count: { rating: true },
      })
    : [];

  const reviewMap = new Map();
  reviewStats.forEach(stat => {
    reviewMap.set(stat.serviceId, {
      rating: stat._avg.rating ?? 5,
      reviewCount: stat._count.rating ?? 0,
    });
  });

  // --- Aggregate completed orders ---
  const orderStats = serviceIds.length > 0
    ? await prisma.order.groupBy({
        by: ['serviceId'],
        where: { serviceId: { in: serviceIds }, status: 'COMPLETED' },
        _count: { _all: true },
      })
    : [];

  const orderMap = new Map();
  orderStats.forEach(stat => {
    orderMap.set(stat.serviceId, stat._count._all ?? 0);
  });

  // --- Merge stats into service objects ---
  const servicesWithStats = services.map(service => {
    const { id } = service;
    const reviewInfo = reviewMap.get(id) || { rating: 5, reviewCount: 0 };
    const orderCount = orderMap.get(id) || 0;

    return {
      ...service,
      rating: reviewInfo.rating,
      reviewCount: reviewInfo.reviewCount,
      orderCount,
      reviews: [], // Keep empty array for frontend compatibility
    };
  });

  const response = {
    items: servicesWithStats,
    total,
    page: safePage,
    pageSize: safePageSize,
  };

  // --- Cache and return ---
  setCache(cacheKey, response);
  return response;
}

module.exports = { getPublicServices };
