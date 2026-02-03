import prisma from '@/lib/prisma';

/**
 * Generate unique order number
 */
function generateOrderNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${year}-${random}`;
}

/**
 * Create a new order
 * Can be created by client (ordering service directly)
 */
export async function createOrder({
  serviceId,
  clientId,
  conversationId,
  deliveryTime,
  revisionsIncluded = 0,
  price, // Optional - if provided, use this instead of service price
  clientIpAddress,
}) {
  // Get service details
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: { freelancer: true },
  });

  if (!service) {
    throw new Error('Service not found');
  }

  const actualFreelancerId = service.freelancerId;
  const actualClientId = clientId;

  // Validation
  if (service.freelancerId === clientId) {
    throw new Error('Cannot order your own service');
  }

  // Use provided price or service price
  const orderPrice = price || service.price;
  if (!orderPrice || orderPrice <= 0) {
    throw new Error('Price must be set and greater than 0');
  }

  // Generate order number
  const orderNumber = generateOrderNumber();

  // Calculate delivery date
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + (deliveryTime || 7));

  // Create order
  const order = await prisma.order.create({
    data: {
      orderNumber,
      serviceId,
      clientId: actualClientId,
      freelancerId: actualFreelancerId,
      conversationId,
      status: 'PENDING_ACCEPTANCE',
      price: orderPrice,
      currency: service.currency || 'USD',
      deliveryTime: deliveryTime || 7,
      revisionsIncluded,
      deliveryDate,
      clientIpAddress,
      events: {
        create: {
          userId: actualClientId,
          eventType: 'ORDER_CREATED',
          description: `Order ${orderNumber} created by client`,
          metadata: {
            serviceTitle: service.title,
            price: orderPrice,
            deliveryTime: deliveryTime || 7,
            createdBy: 'CLIENT',
          },
        },
      },
    },
    include: {
      service: {
        include: {
          freelancer: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
            },
          },
        },
      },
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          // rating: true,        // Uncomment after running migration
          // reviewCount: true,   // Uncomment after running migration
          location: true,
        },
      },
      freelancer: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          // rating: true,        // Uncomment after running migration
          // reviewCount: true,   // Uncomment after running migration
          location: true,
        },
      },
      conversation: true,
    },
  });

  return order;
}

/**
 * Accept order by CLIENT
 * Fiverr workflow: Order Accepted → Status: IN_PROGRESS
 */
export async function acceptOrder(orderId, userId, userRole, ipAddress) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // Client accepts order
  if (userRole === 'CLIENT') {
    if (order.clientId !== userId) {
      throw new Error('Unauthorized: Not your order');
    }
  } else if (userRole === 'ADMIN') {
    // Admin can accept any order
  } else {
    throw new Error('Only clients can accept orders');
  }

  if (order.status !== 'PENDING_ACCEPTANCE') {
    throw new Error(`Cannot accept order with status: ${order.status}`);
  }

  // Update order to IN_PROGRESS
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'IN_PROGRESS',
      events: {
        create: {
          userId: userId,
          eventType: 'ORDER_IN_PROGRESS',
          description: `Order accepted by client`,
          metadata: {
            acceptedAt: new Date().toISOString(),
            acceptedBy: 'CLIENT',
          },
        },
      },
    },
    include: {
      service: {
        include: {
          freelancer: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
            },
          },
        },
      },
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          // rating: true,        // Uncomment after running migration
          // reviewCount: true,   // Uncomment after running migration
          location: true,
        },
      },
      freelancer: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          // rating: true,        // Uncomment after running migration
          // reviewCount: true,   // Uncomment after running migration
          location: true,
        },
      },
      conversation: true,
    },
  });

  // Also create event for status change
  await prisma.orderEvent.create({
    data: {
      orderId,
      userId: userId,
      eventType: 'ORDER_IN_PROGRESS',
      description: 'Order moved to IN_PROGRESS',
    },
  });

  return updatedOrder;
}

/**
 * Reject order by CLIENT
 */
export async function rejectOrder(orderId, userId, userRole, rejectionReason) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // Client rejects order
  if (userRole === 'CLIENT') {
    if (order.clientId !== userId) {
      throw new Error('Unauthorized: Not your order');
    }
  } else if (userRole === 'ADMIN') {
    // Admin can reject any order
  } else {
    throw new Error('Only clients can reject orders');
  }

  if (order.status !== 'PENDING_ACCEPTANCE') {
    throw new Error(`Cannot reject order with status: ${order.status}`);
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelledBy: userId,
      cancellationReason: rejectionReason,
      events: {
        create: {
          userId: userId,
          eventType: 'ORDER_CANCELLED',
          description: `Order rejected by client: ${rejectionReason}`,
          metadata: {
            rejectionReason,
            rejectedBy: 'CLIENT',
          },
        },
      },
    },
    include: {
      service: {
        select: {
          id: true,
          title: true,
          images: true,
        },
      },
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          // rating: true,        // Uncomment after running migration
          // reviewCount: true,   // Uncomment after running migration
          location: true,
        },
      },
      freelancer: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          // rating: true,        // Uncomment after running migration
          // reviewCount: true,   // Uncomment after running migration
          location: true,
        },
      },
      deliverables: {
        orderBy: { deliveredAt: 'desc' },
        take: 5,
        select: {
          id: true,
          type: true,
          fileUrl: true,
          message: true,
          isRevision: true,
          revisionNumber: true,
          deliveredAt: true,
          acceptedAt: true,
          rejectedAt: true,
          rejectionReason: true,
        },
      },
    },
  });

  // Create event for the freelancer (who needs to be notified)
  await prisma.orderEvent.create({
    data: {
      orderId,
      userId: order.freelancerId,
      eventType: 'ORDER_CANCELLED',
      description: 'Order cancelled due to rejection',
    },
  });

  return updatedOrder;
}

/**
 * Submit delivery by FREELANCER
 * Fiverr workflow: IN_PROGRESS → Freelancer can Deliver → DELIVERED
 * Also handles: REVISION_REQUESTED → Freelancer can Re-deliver → DELIVERED
 */
export async function submitDelivery(orderId, freelancerId, { type, fileUrl, message, isRevision = false }) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { deliverables: true },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.freelancerId !== freelancerId) {
    throw new Error('Unauthorized: Not your order');
  }

  // Fiverr rule: Can deliver from IN_PROGRESS or REVISION_REQUESTED
  if (order.status !== 'IN_PROGRESS' && order.status !== 'REVISION_REQUESTED') {
    throw new Error(`Cannot deliver order with status: ${order.status}. Order must be IN_PROGRESS or REVISION_REQUESTED.`);
  }

  // Calculate revision number if it's a revision
  let revisionNumber = null;
  if (isRevision || order.status === 'REVISION_REQUESTED') {
    const previousDeliveries = order.deliverables.filter(d => d.isRevision);
    revisionNumber = previousDeliveries.length + 1;
    
    // Check if revisions exceeded
    if (revisionNumber > order.revisionsIncluded) {
      throw new Error('Maximum revisions exceeded');
    }
  }

  // Create deliverable
  const deliverable = await prisma.orderDeliverable.create({
    data: {
      orderId,
      type,
      fileUrl,
      message,
      isRevision: isRevision || order.status === 'REVISION_REQUESTED',
      revisionNumber,
    },
  });

  // Update order status to DELIVERED
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'DELIVERED',
      revisionsUsed: (isRevision || order.status === 'REVISION_REQUESTED') ? { increment: 1 } : undefined,
      events: {
        create: {
          userId: freelancerId,
          eventType: 'DELIVERY_SUBMITTED',
          description: (isRevision || order.status === 'REVISION_REQUESTED')
            ? `Revision ${revisionNumber} submitted`
            : 'Initial delivery submitted',
          metadata: {
            deliverableId: deliverable.id,
            isRevision: isRevision || order.status === 'REVISION_REQUESTED',
            revisionNumber,
          },
        },
      },
    },
    include: {
      service: true,
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          // rating: true,        // Uncomment after running migration
          // reviewCount: true,   // Uncomment after running migration
          location: true,
        },
      },
      freelancer: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          // rating: true,        // Uncomment after running migration
          // reviewCount: true,   // Uncomment after running migration
          location: true,
        },
      },
      deliverables: {
        orderBy: { deliveredAt: 'desc' },
      },
    },
  });

  return { order: updatedOrder, deliverable };
}

/**
 * Accept delivery and complete order by CLIENT
 * Fiverr workflow: DELIVERED → Client can Accept & Complete → COMPLETED
 * Note: Client must review freelancer after completion (handled separately)
 */
export async function acceptDelivery(orderId, clientId, deliverableId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { deliverables: true },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.clientId !== clientId) {
    throw new Error('Unauthorized: Not your order');
  }

  // Fiverr rule: Can only accept delivery when status is DELIVERED
  if (order.status !== 'DELIVERED') {
    throw new Error(`Cannot accept delivery with status: ${order.status}. Order must be DELIVERED.`);
  }

  // Mark deliverable as accepted
  await prisma.orderDeliverable.update({
    where: { id: deliverableId },
    data: {
      acceptedAt: new Date(),
    },
  });

  // Update order to COMPLETED
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      events: {
        create: {
          userId: clientId,
          eventType: 'DELIVERY_ACCEPTED',
          description: 'Delivery accepted by client',
        },
      },
    },
    include: {
      service: true,
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          // rating: true,        // Uncomment after running migration
          // reviewCount: true,   // Uncomment after running migration
          location: true,
        },
      },
      freelancer: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          // rating: true,        // Uncomment after running migration
          // reviewCount: true,   // Uncomment after running migration
          location: true,
        },
      },
      deliverables: {
        orderBy: { deliveredAt: 'desc' },
      },
    },
  });

  await prisma.orderEvent.create({
    data: {
      orderId,
      userId: clientId,
      eventType: 'ORDER_COMPLETED',
      description: 'Order marked as completed',
    },
  });

  return updatedOrder;
}

/**
 * Request revision by CLIENT
 * Fiverr workflow: DELIVERED → Client can Request Revision → REVISION_REQUESTED
 * Note: Client cannot cancel when revision is requested
 */
export async function requestRevision(orderId, clientId, reason) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.clientId !== clientId) {
    throw new Error('Unauthorized: Not your order');
  }

  // Fiverr rule: Can only request revision when status is DELIVERED
  if (order.status !== 'DELIVERED') {
    throw new Error(`Cannot request revision with status: ${order.status}. Order must be DELIVERED.`);
  }

  // Check if revisions available
  if (order.revisionsUsed >= order.revisionsIncluded) {
    throw new Error('No revisions available');
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'REVISION_REQUESTED',
      events: {
        create: {
          userId: clientId,
          eventType: 'REVISION_REQUESTED',
          description: `Revision requested: ${reason}`,
          metadata: {
            reason,
            requestedBy: 'CLIENT',
          },
        },
      },
    },
    include: {
      service: true,
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          // rating: true,        // Uncomment after running migration
          // reviewCount: true,   // Uncomment after running migration
          location: true,
        },
      },
      freelancer: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          // rating: true,        // Uncomment after running migration
          // reviewCount: true,   // Uncomment after running migration
          location: true,
        },
      },
      deliverables: {
        orderBy: { deliveredAt: 'desc' },
      },
    },
  });

  await prisma.orderEvent.create({
    data: {
      orderId,
      userId: clientId,
      eventType: 'REVISION_REQUESTED',
      description: 'Revision requested by client',
    },
  });

  return updatedOrder;
}

/**
 * Cancel order
 * Fiverr rule: Cancellation allowed only before delivery
 */
export async function cancelOrder(orderId, userId, reason, userRole) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // Verify authorization
  const isClient = order.clientId === userId;
  const isFreelancer = order.freelancerId === userId;
  const isAdmin = userRole === 'ADMIN';

  if (!isClient && !isFreelancer && !isAdmin) {
    throw new Error('Unauthorized');
  }

  // Fiverr rule: Cancellation allowed only before delivery
  // Allow cancellation for PENDING_ACCEPTANCE and IN_PROGRESS, but not DELIVERED or later
  if (!['PENDING_ACCEPTANCE', 'IN_PROGRESS'].includes(order.status)) {
    throw new Error(`Cannot cancel order with status: ${order.status}. Cancellation is only allowed before delivery.`);
  }

  // Additional rule: Cannot cancel when revision is requested
  if (order.status === 'REVISION_REQUESTED') {
    throw new Error('Cannot cancel order when revision is requested');
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelledBy: userId,
      cancellationReason: reason,
      events: {
        create: {
          userId,
          eventType: 'ORDER_CANCELLED',
          description: `Order cancelled by ${userRole}: ${reason}`,
          metadata: {
            reason,
            cancelledBy: userId,
            userRole,
          },
        },
      },
    },
    include: {
      service: true,
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          // rating: true,        // Uncomment after running migration
          // reviewCount: true,   // Uncomment after running migration
          location: true,
        },
      },
      freelancer: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          // rating: true,        // Uncomment after running migration
          // reviewCount: true,   // Uncomment after running migration
          location: true,
        },
      },
    },
  });

  return updatedOrder;
}

/**
 * Open dispute by CLIENT
 * Fiverr workflow: DELIVERED → Client can Open Dispute → DISPUTED
 */
export async function openDispute(orderId, clientId, reason, description, initialAttachments = null) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.clientId !== clientId) {
    throw new Error('Unauthorized: Not your order');
  }

  // Fiverr rule: Can only open dispute when status is DELIVERED
  if (order.status !== 'DELIVERED') {
    throw new Error(`Cannot open dispute with status: ${order.status}. Order must be DELIVERED.`);
  }

  // Check if dispute already exists
  const existingDispute = await prisma.dispute.findFirst({
    where: {
      orderId,
      status: { in: ['OPEN', 'IN_REVIEW'] },
    },
  });

  if (existingDispute) {
    throw new Error('A dispute is already open for this order');
  }

  // Create dispute
  const dispute = await prisma.dispute.create({
    data: {
      orderId,
      clientId,
      freelancerId: order.freelancerId,
      reason,
      description,
      status: 'OPEN',
      initialAttachments: initialAttachments || null,
    },
  });

  // Create initial comment from client with dispute description
  await prisma.disputeComment.create({
    data: {
      disputeId: dispute.id,
      userId: clientId,
      role: 'CLIENT',
      content: description,
      attachments: initialAttachments || null,
    },
  });

  // Update order status to DISPUTED
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'DISPUTED',
      events: {
        create: {
          userId: clientId,
          eventType: 'DISPUTE_OPENED',
          description: `Dispute opened: ${reason}`,
          metadata: {
            disputeId: dispute.id,
            reason,
          },
        },
      },
    },
    include: {
      service: true,
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          // rating: true,        // Uncomment after running migration
          // reviewCount: true,   // Uncomment after running migration
          location: true,
        },
      },
      freelancer: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          // rating: true,        // Uncomment after running migration
          // reviewCount: true,   // Uncomment after running migration
          location: true,
        },
      },
      disputes: {
        where: { status: { in: ['OPEN', 'IN_REVIEW'] } },
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          comments: {
            orderBy: { createdAt: 'asc' },
            take: 1, // Just to check if comments exist
          },
        },
      },
    },
  });

  return { order: updatedOrder, dispute };
}

/**
 * Get user's orders
 */
export async function getUserOrders(userId, userRole, options = {}) {
  const { status, serviceId, limit = 50, skip = 0 } = options;

  // Build where clause based on user role
  const where = {
    ...(userRole === 'CLIENT' 
      ? { clientId: userId }
      : userRole === 'FREELANCER'
      ? { freelancerId: userId }
      : {}), // Admin can see all
    ...(status ? { status } : {}),
    ...(serviceId ? { serviceId } : {}),
  };

  const orders = await prisma.order.findMany({
    where,
    include: {
      service: {
        select: {
          id: true,
          title: true,
          images: true,
          coverImage: true,
        },
      },
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          // rating: true,        // Uncomment after running migration
          // reviewCount: true,   // Uncomment after running migration
          location: true,
        },
      },
      freelancer: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          // rating: true,        // Uncomment after running migration
          // reviewCount: true,   // Uncomment after running migration
          location: true,
        },
      },
      deliverables: {
        orderBy: { deliveredAt: 'desc' },
        take: 1, // Get latest deliverable
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip,
  });

  // Get total count for pagination
  const total = await prisma.order.count({ where });

  return {
    orders,
    total,
    limit,
    skip,
  };
}

/**
 * Get order by ID with authorization check
 */
export async function getOrderById(orderId, userId, userRole) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      service: {
        include: {
          freelancer: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
            },
          },
        },
      },
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          // rating: true,        // Uncomment after running migration
          // reviewCount: true,   // Uncomment after running migration
          location: true,
        },
      },
      freelancer: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          // rating: true,        // Uncomment after running migration
          // reviewCount: true,   // Uncomment after running migration
          location: true,
        },
      },
      conversation: true,
      deliverables: {
        orderBy: { deliveredAt: 'desc' },
      },
      events: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      disputes: {
        orderBy: { createdAt: 'desc' },
      },
      // reviews: {  // Temporarily commented out - uncomment after running: npx prisma generate
      //   include: {
      //     reviewer: {
      //       select: {
      //         id: true,
      //         name: true,
      //         profileImage: true,
      //       },
      //     },
      //   },
      //   orderBy: { createdAt: 'desc' },
      // },
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // Authorization check
  const isClient = order.clientId === userId;
  const isFreelancer = order.freelancerId === userId;
  const isAdmin = userRole === 'ADMIN';

  if (!isClient && !isFreelancer && !isAdmin) {
    throw new Error('Unauthorized: Not your order');
  }

  return order;
}

/**
 * Get orders by conversation ID
 */
export async function getOrdersByConversationId(conversationId, userId) {
  const orders = await prisma.order.findMany({
    where: {
      conversationId,
      OR: [
        { clientId: userId },
        { freelancerId: userId },
      ],
    },
    include: {
      service: {
        select: {
          id: true,
          title: true,
          images: true,
          coverImage: true,
        },
      },
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          // rating: true,        // Uncomment after running migration
          // reviewCount: true,   // Uncomment after running migration
          location: true,
        },
      },
      freelancer: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          // rating: true,        // Uncomment after running migration
          // reviewCount: true,   // Uncomment after running migration
          location: true,
        },
      },
      conversation: true,
      deliverables: {
        orderBy: { deliveredAt: 'desc' },
        take: 1, // Get latest deliverable
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return orders;
}
