import prisma from '@/lib/prisma';

function serializeNotification(notification) {
  return {
    ...notification,
    createdAt: notification.createdAt?.toISOString?.() ?? notification.createdAt,
  };
}

async function emitNotificationEvent(notification) {
  try {
    const socketModule = await import('@/lib/socket');
    const { getIOIfAvailable } = socketModule;
    const io = getIOIfAvailable?.() ?? null;
    if (io) {
      io.to(`user:${notification.userId}`).emit('notification:new', serializeNotification(notification));
    }
  } catch (error) {
    console.error('Notification socket emit failed:', error);
  }
}

export async function createNotification({
  userId,
  title,
  body,
  type = 'general',
  priority = 'normal',
  data = null,
}) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      title,
      body,
      type,
      priority,
      data,
    },
  });

  await emitNotificationEvent(notification);
  return serializeNotification(notification);
}

export async function markNotificationsRead(userId, ids = []) {
  if (!ids.length) return { updated: 0 };
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      id: { in: ids },
    },
    data: { read: true },
  });
  return { updated: result.count };
}

export async function getNotifications(userId, { limit = 20, cursor = null } = {}) {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    ...(cursor
      ? {
          skip: 1,
          cursor: { id: cursor },
        }
      : {}),
  });

  const unreadCount = await prisma.notification.count({
    where: { userId, read: false },
  });

  return {
    items: notifications.map(serializeNotification),
    unreadCount,
  };
}
