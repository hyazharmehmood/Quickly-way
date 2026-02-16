import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


const CACHE_TTL_MS = 15000; // 15 seconds
const suggestionCache = new Map();

const COMMON_PHRASES = ['i will', "i'll", 'we will', "we'll"];
const MAX_KEYWORD_LENGTH = 40; // Fiverr-style: short phrases like "logo design", not full titles
const MAX_WORDS = 4; // "logo design" (2), "professional logo design" (3)

function toShortKeyword(text) {
  if (!text || typeof text !== 'string') return '';
  let t = text.trim();
  for (const phrase of COMMON_PHRASES) {
    t = t.replace(new RegExp(`^${phrase}\\s+`, 'i'), '').trim();
  }
  const words = t.split(/\s+/).filter(Boolean);
  t = words.slice(0, MAX_WORDS).join(' ');
  if (t.length > MAX_KEYWORD_LENGTH) {
    t = t.slice(0, MAX_KEYWORD_LENGTH).replace(/\s+\S*$/, '');
  }
  return t.trim();
}

function buildSearchWords(q) {
  if (!q || typeof q !== 'string') return [];
  return q.toLowerCase().trim().split(/\s+/).filter((w) => w.length > 0);
}

function highlightMatch(text, queryWords) {
  if (!text || !queryWords?.length) return [{ text: text || '', matched: false }];
  const lower = (text || '').toLowerCase();
  const matches = [];
  for (const word of queryWords) {
    let idx = lower.indexOf(word);
    while (idx !== -1) {
      matches.push({ start: idx, end: idx + word.length });
      idx = lower.indexOf(word, idx + 1);
    }
  }
  matches.sort((a, b) => a.start - b.start);
  const merged = [];
  for (const m of matches) {
    if (merged.length && m.start <= merged[merged.length - 1].end) {
      merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, m.end);
    } else {
      merged.push({ ...m });
    }
  }
  const parts = [];
  let lastEnd = 0;
  for (const m of merged) {
    if (m.start > lastEnd) parts.push({ text: text.slice(lastEnd, m.start), matched: false });
    parts.push({ text: text.slice(m.start, m.end), matched: true });
    lastEnd = m.end;
  }
  if (lastEnd < text.length) parts.push({ text: text.slice(lastEnd), matched: false });
  return parts.length ? parts : [{ text, matched: false }];
}

/**
 * Fiverr-style suggestions: trending/popular search keywords first.
 * Optimized: parallel DB queries + short cache.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim().toLowerCase() || '';
    const searchWords = buildSearchWords(q);

    if (searchWords.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    const cacheKey = q;
    const cached = suggestionCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return NextResponse.json({ suggestions: cached.data });
    }

    const seen = new Set();
    const suggestions = [];

    const addSuggestion = (text, type, count = 0) => {
      const normalized = (text || '').trim();
      if (!normalized || normalized.length > MAX_KEYWORD_LENGTH) return;
      const key = normalized.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      const parts = highlightMatch(normalized, searchWords);
      if (!parts.some((p) => p.matched)) return;
      suggestions.push({ text: normalized, type, parts, count });
    };

    const serviceWhere = {
      OR: searchWords.flatMap((word) => [
        { title: { contains: word, mode: 'insensitive' } },
        { category: { contains: word, mode: 'insensitive' } },
        { subCategory: { contains: word, mode: 'insensitive' } },
      ]),
    };
    const categoryWhere = {
      isActive: true,
      OR: searchWords.map((word) => ({ name: { contains: word, mode: 'insensitive' } })),
    };
    const skillWhere = {
      isActive: true,
      OR: searchWords.map((word) => ({ name: { contains: word, mode: 'insensitive' } })),
    };

    if (!prisma) {
      return NextResponse.json({ suggestions: [] });
    }
    const searchKeywordModel = prisma.searchKeyword;
    const searchKeywordQuery = searchKeywordModel
      ? searchKeywordModel.findMany({
          where: { keyword: { contains: searchWords[0], mode: 'insensitive' } },
          orderBy: { count: 'desc' },
          take: 8,
          select: { keyword: true, count: true },
        }).catch(() => [])
      : Promise.resolve([]);

    const serviceModel = prisma.service;
    const categoryModel = prisma.category;
    const skillModel = prisma.skill;
    if (!serviceModel || !categoryModel || !skillModel) {
      return NextResponse.json({ suggestions: [] });
    }

    const [trendingKeywords, services, categories, skills] = await Promise.all([
      searchKeywordQuery,
      serviceModel.findMany({
        where: serviceWhere,
        select: { title: true, searchTags: true, category: true, subCategory: true },
        take: 20,
      }),
      categoryModel.findMany({
        where: categoryWhere,
        select: { name: true },
        take: 5,
      }),
      skillModel.findMany({
        where: skillWhere,
        select: { name: true },
        take: 5,
      }),
    ]);

    for (const { keyword, count } of trendingKeywords) {
      if (searchWords.every((w) => keyword.toLowerCase().includes(w))) {
        addSuggestion(keyword, 'trending', count);
      }
    }

    if (suggestions.length < 8) {
      for (const s of services) {
        if (suggestions.length >= 8) break;
        const shortTitle = toShortKeyword(s.title);
        if (shortTitle && searchWords.some((w) => shortTitle.toLowerCase().includes(w))) {
          addSuggestion(shortTitle, 'keyword');
        }
        for (const tag of s.searchTags || []) {
          if (tag && searchWords.some((w) => tag.toLowerCase().includes(w))) {
            addSuggestion(tag, 'tag');
          }
        }
        if (s.category && searchWords.some((w) => s.category.toLowerCase().includes(w))) {
          addSuggestion(s.category, 'category');
        }
        if (s.subCategory && searchWords.some((w) => s.subCategory.toLowerCase().includes(w))) {
          addSuggestion(s.subCategory, 'category');
        }
      }
      for (const c of categories) {
        if (c.name) addSuggestion(c.name, 'category');
      }
      for (const sk of skills) {
        if (sk.name) addSuggestion(sk.name, 'skill');
      }
    }

    // Sort: trending first (by count), then by type priority
    const result = suggestions
      .sort((a, b) => {
        if (a.type === 'trending' && b.type !== 'trending') return -1;
        if (a.type !== 'trending' && b.type === 'trending') return 1;
        if (a.type === 'trending') return (b.count || 0) - (a.count || 0);
        return 0;
      })
      .slice(0, 8)
      .map(({ text, type, parts }) => ({ text, type, parts }));

    suggestionCache.set(cacheKey, { data: result, ts: Date.now() });
    if (suggestionCache.size > 100) {
      const first = suggestionCache.keys().next().value;
      suggestionCache.delete(first);
    }

    return NextResponse.json({ suggestions: result });
  } catch (error) {
    console.error('Search suggestions error:', error);
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
  }
}
