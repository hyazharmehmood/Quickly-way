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

// --- Search helpers ---
function buildSearchWords(q) {
  if (!q || typeof q !== 'string') return [];
  return q
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

// --- Cache helpers ---
function getCacheKey(skillSlug, status, page, pageSize, q) {
  return [skillSlug || 'all', status || 'all', page, pageSize, q || ''].join('|');
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
async function getPublicServices(skillSlug = null, status = 'all', page = 1, pageSize = DEFAULT_PAGE_SIZE, q = null) {
  const { page: safePage, pageSize: safePageSize } = parsePagination(page, pageSize);
  const cacheKey = getCacheKey(skillSlug, status, safePage, safePageSize, q);

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

  // Text search: title, searchTags, category, subCategory - multi-word AND, case-insensitive
  const searchWords = buildSearchWords(q);
  if (searchWords.length > 0) {
    const andConditions = searchWords.map((word) => ({
      OR: [
        { title: { contains: word, mode: 'insensitive' } },
        { category: { contains: word, mode: 'insensitive' } },
        { subCategory: { contains: word, mode: 'insensitive' } },
        // searchTags: has requires exact match; use raw for partial - fallback to title/category
      ],
    }));
    whereClause.AND = whereClause.AND ? [...whereClause.AND, ...andConditions] : andConditions;
  }

  if (status === 'none') {
    const empty = { items: [], total: 0, page: safePage, pageSize: safePageSize };
    setCache(cacheKey, empty);
    return empty;
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

  // --- 1. Direct service reviews (serviceId set on Review) ---
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
      sum: (stat._avg.rating ?? 5) * (stat._count.rating ?? 0),
      count: stat._count.rating ?? 0,
    });
  });

  // --- 2. Completed orders (for order-based reviews and order count) ---
  const completedOrders = serviceIds.length > 0
    ? await prisma.order.findMany({
        where: { serviceId: { in: serviceIds }, status: 'COMPLETED' },
        select: { id: true, serviceId: true },
      })
    : [];

  const orderIdToServiceId = new Map();
  completedOrders.forEach((o) => orderIdToServiceId.set(o.id, o.serviceId));

  const orderStats = new Map();
  completedOrders.forEach((o) => {
    orderStats.set(o.serviceId, (orderStats.get(o.serviceId) || 0) + 1);
  });

  // --- 3. Order-based client reviews (reviews on completed orders = service reviews) ---
  const orderIds = completedOrders.map((o) => o.id);
  const orderReviews =
    orderIds.length > 0
      ? await prisma.review.findMany({
          where: {
            orderId: { in: orderIds },
            isOrderReview: true,
            isClientReview: true,
          },
          select: { orderId: true, rating: true },
        })
      : [];

  orderReviews.forEach((r) => {
    const sid = orderIdToServiceId.get(r.orderId);
    if (!sid) return;
    const rating = r.rating != null ? r.rating : 5;
    const current = reviewMap.get(sid) || { sum: 0, count: 0 };
    reviewMap.set(sid, {
      sum: current.sum + rating,
      count: current.count + 1,
    });
  });

  // --- 4. Merge stats into service objects (same logic as service detail page) ---
  const servicesWithStats = services.map((service) => {
    const { id } = service;
    const info = reviewMap.get(id) || { sum: 0, count: 0 };
    const orderCount = orderStats.get(id) || 0;
    const reviewCount = info.count;
    const rating = reviewCount > 0 ? info.sum / reviewCount : 5;

    return {
      ...service,
      rating: Math.round(rating * 10) / 10,
      reviewCount,
      orderCount,
      reviews: [],
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
