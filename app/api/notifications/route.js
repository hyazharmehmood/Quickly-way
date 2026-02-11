import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/controllers/authController';
import { getNotifications, markNotificationsRead } from '@/lib/services/notificationService';

export async function GET(request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const limit = parseInt(searchParams.get('limit') ?? '20', 10);
  const cursor = searchParams.get('cursor');

  const data = await getNotifications(userId, { limit, cursor });
  return NextResponse.json(data);
}

export async function PATCH(request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const ids = Array.isArray(body.ids) ? body.ids : [];
  if (!ids.length) {
    return NextResponse.json({ updated: 0 });
  }

  const result = await markNotificationsRead(userId, ids);
  return NextResponse.json(result);
}
