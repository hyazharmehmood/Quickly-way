import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

let trendingCache = null;
let trendingCacheTs = 0;
const TRENDING_CACHE_MS = 60000;

/** GET /api/trending-searches - Top 8 most searched keywords */
export async function GET() {
  try {
    if (trendingCache && Date.now() - trendingCacheTs < TRENDING_CACHE_MS) {
      return NextResponse.json(trendingCache);
    }
    const keywords = await prisma.searchKeyword.findMany({
      orderBy: { count: 'desc' },
      take: 8,
      select: { keyword: true, count: true },
    });
    if (keywords.length > 0) {
      const out = { keywords: keywords.map((k) => ({ keyword: k.keyword, count: k.count })) };
      trendingCache = out;
      trendingCacheTs = Date.now();
      return NextResponse.json(out);
    }
    // Fallback when empty: show category/skill names as popular (until real searches populate)
    const categories = await prisma.category.findMany({
      where: { isActive: true, parentId: null },
      select: { name: true },
      take: 4,
      orderBy: { name: 'asc' },
    });
    const skills = await prisma.skill.findMany({
      where: { isActive: true },
      select: { name: true },
      take: 4,
      orderBy: { name: 'asc' },
    });
    const fallback = {
      keywords: [
        ...categories.map((c) => ({ keyword: c.name, count: 0 })),
        ...skills.map((s) => ({ keyword: s.name, count: 0 })),
      ].slice(0, 8),
    };
    trendingCache = fallback;
    trendingCacheTs = Date.now();
    return NextResponse.json(fallback);
  } catch (error) {
    if (error?.code === 'P2021') {
      return NextResponse.json({ keywords: [] });
    }
    console.error('Trending searches error:', error);
    return NextResponse.json({ error: 'Failed to fetch trending' }, { status: 500 });
  }
}
