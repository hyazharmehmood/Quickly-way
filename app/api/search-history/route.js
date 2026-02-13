import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function normalizeKeyword(term) {
  return (term || '').toLowerCase().trim();
}

/** POST /api/search-history - Record a search (increments SearchKeyword count) */
export async function POST(request) {
  try {
    const body = await request.json();
    const term = body?.term;
    const keyword = normalizeKeyword(term);
    if (!keyword) {
      return NextResponse.json({ success: true });
    }

    await prisma.searchKeyword.upsert({
      where: { keyword },
      create: { keyword, count: 1 },
      update: { count: { increment: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // P2021 = table does not exist (migration not run yet)
    if (error?.code === 'P2021') {
      return NextResponse.json({ success: true });
    }
    console.error('Search history record error:', error);
    return NextResponse.json({ error: 'Failed to record search' }, { status: 500 });
  }
}
