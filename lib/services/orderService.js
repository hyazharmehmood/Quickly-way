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
 * Create a new order with contract
 * Can be created by freelancer (sending contract to client) or client (ordering service)
 */
export async function createOrder({
  serviceId,
  clientId,
  freelancerId, // Optional - if provided, freelancer is creating contract
  conversationId,
  deliveryTime,
  revisionsIncluded = 0,
  scopeOfWork,
  cancellationPolicy = 'Standard cancellation policy applies',
  price, // Optional - if provided, use this instead of service price
  clientIpAddress,
  freelancerIpAddress,
}) {
  // Get service details
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: { freelancer: true },
  });

  if (!service) {
    throw new Error('Service not found');
  }

  // Determine who is creating the order
  const isFreelancerCreating = !!freelancerId;
  const actualFreelancerId = freelancerId || service.freelancerId;
  const actualClientId = clientId;

  // Validation
  if (isFreelancerCreating) {
    // Freelancer creating contract for client
    if (actualFreelancerId !== service.freelancerId) {
      throw new Error('You can only create contracts for your own services');
    }
  } else {
    // Client ordering service
    if (service.freelancerId === clientId) {
      throw new Error('Cannot order your own service');
    }
  }

  // Use provided price or service price
  const orderPrice = price || service.price;
  if (!orderPrice || orderPrice <= 0) {
    throw new Error('Price must be set and greater than 0');
  }

  // Allow multiple orders - removed restriction check
  // Freelancer can create multiple contracts for the same client

  // Generate order number
  const orderNumber = generateOrderNumber();

  // Calculate delivery date
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + (deliveryTime || 7));

  // Create order with contract
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
      clientIpAddress: isFreelancerCreating ? null : clientIpAddress,
      contract: {
        create: {
          serviceTitle: service.title,
          serviceDescription: service.description,
          scopeOfWork: scopeOfWork || service.description,
          price: orderPrice,
          currency: service.currency || 'USD',
          deliveryTime: deliveryTime || 7,
          revisionsIncluded,
          cancellationPolicy,
          status: 'PENDING_ACCEPTANCE',
          clientIpAddress: isFreelancerCreating ? null : clientIpAddress,
          freelancerIpAddress: isFreelancerCreating ? freelancerIpAddress : null,
        },
      },
      events: {
        create: {
          userId: isFreelancerCreating ? actualFreelancerId : actualClientId,
          eventType: 'ORDER_CREATED',
          description: isFreelancerCreating 
            ? `Contract ${orderNumber} created by freelancer for client`
            : `Order ${orderNumber} created by client`,
          metadata: {
            serviceTitle: service.title,
            price: orderPrice,
            deliveryTime: deliveryTime || 7,
            createdBy: isFreelancerCreating ? 'FREELANCER' : 'CLIENT',
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
        },
      },
      freelancer: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
        },
      },
      contract: true,
      conversation: true,
    },
  });

  return order;
}

/**
 * Accept order/contract by CLIENT (client accepts freelancer's contract)
 */
export async function acceptOrder(orderId, userId, userRole, ipAddress) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { contract: true },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // Client accepts freelancer's contract
  if (userRole === 'CLIENT') {
    if (order.clientId !== userId) {
      throw new Error('Unauthorized: Not your order');
    }
  } else if (userRole === 'ADMIN') {
    // Admin can accept any order
  } else {
    throw new Error('Only clients can accept contracts');
  }

  if (order.status !== 'PENDING_ACCEPTANCE') {
    throw new Error(`Cannot accept order with status: ${order.status}`);
  }

  // Update order and contract
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'IN_PROGRESS',
      contract: {
        update: {
          status: 'ACTIVE',
          clientAcceptedAt: new Date(),
          clientIpAddress: ipAddress,
        },
      },
      events: {
        create: {
          userId: userId,
          eventType: 'CONTRACT_ACCEPTED',
          description: `Contract accepted by client`,
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
        },
      },
      freelancer: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
        },
      },
      contract: true,
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
 * Reject order/contract by CLIENT (client rejects freelancer's contract)
 */
export async function rejectOrder(orderId, userId, userRole, rejectionReason) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // Client rejects freelancer's contract
  if (userRole === 'CLIENT') {
    if (order.clientId !== userId) {
      throw new Error('Unauthorized: Not your order');
    }
  } else if (userRole === 'ADMIN') {
    // Admin can reject any order
  } else {
    throw new Error('Only clients can reject contracts');
  }

  if (order.status !== 'PENDING_ACCEPTANCE') {
    throw new Error(`Cannot reject order with status: ${order.status}`);
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelledBy: freelancerId,
      cancellationReason: rejectionReason,
      contract: {
        update: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectedBy: userId,
          rejectionReason,
        },
      },
      events: {
        create: {
          userId: userId,
          eventType: 'CONTRACT_REJECTED',
          description: `Contract rejected by client: ${rejectionReason}`,
          metadata: {
            rejectionReason,
            rejectedBy: 'CLIENT',
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
        },
      },
      freelancer: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
        },
      },
      contract: true,
    },
  });

  await prisma.orderEvent.create({
    data: {
      orderId,
      userId: freelancerId,
      eventType: 'ORDER_CANCELLED',
      description: 'Order cancelled due to contract rejection',
    },
  });

  return updatedOrder;
}

/**
 * Submit delivery
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

  if (order.status !== 'IN_PROGRESS' && order.status !== 'REVISION_REQUESTED') {
    throw new Error(`Cannot deliver order with status: ${order.status}`);
  }

  // Calculate revision number if it's a revision
  let revisionNumber = null;
  if (isRevision) {
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
      isRevision,
      revisionNumber,
    },
  });

  // Update order status
  const newStatus = isRevision ? 'DELIVERED' : 'DELIVERED';
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: newStatus,
      revisionsUsed: isRevision ? { increment: 1 } : undefined,
      events: {
        create: {
          userId: freelancerId,
          eventType: 'DELIVERY_SUBMITTED',
          description: isRevision 
            ? `Revision ${revisionNumber} submitted`
            : 'Initial delivery submitted',
          metadata: {
            deliverableId: deliverable.id,
            isRevision,
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
        },
      },
      freelancer: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
        },
      },
      contract: true,
      deliverables: {
        orderBy: { deliveredAt: 'desc' },
      },
    },
  });

  return { order: updatedOrder, deliverable };
}

/**
 * Accept delivery by client
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

  if (order.status !== 'DELIVERED') {
    throw new Error(`Cannot accept delivery with status: ${order.status}`);
  }

  // Mark deliverable as accepted
  await prisma.orderDeliverable.update({
    where: { id: deliverableId },
    data: {
      acceptedAt: new Date(),
    },
  });

  // Update order to completed
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
        },
      },
      freelancer: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
        },
      },
      contract: true,
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
 * Request revision
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

  if (order.status !== 'DELIVERED') {
    throw new Error(`Cannot request revision with status: ${order.status}`);
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
        },
      },
      freelancer: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
        },
      },
      contract: true,
      deliverables: {
        orderBy: { deliveredAt: 'desc' },
      },
    },
  });

  return updatedOrder;
}

/**
 * Cancel order
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

  // Only allow cancellation if order is pending or in progress
  if (!['PENDING_ACCEPTANCE', 'IN_PROGRESS'].includes(order.status)) {
    throw new Error(`Cannot cancel order with status: ${order.status}`);
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelledBy: userId,
      cancellationReason: reason,
      contract: {
        update: {
          status: 'CANCELLED',
        },
      },
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
        },
      },
      freelancer: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
        },
      },
      contract: true,
    },
  });

  return updatedOrder;
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
        },
      },
      freelancer: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
        },
      },
      contract: true,
      deliverables: {
        orderBy: { deliveredAt: 'desc' },
      },
      events: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      disputes: {
        where: {
          status: {
            not: 'CLOSED',
          },
        },
      },
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
    throw new Error('Unauthorized');
  }

  return order;
}

/**
 * Get orders for a user (client or freelancer)
 */
export async function getUserOrders(userId, userRole, filters = {}) {
  const where = {};

  if (userRole === 'CLIENT') {
    where.clientId = userId;
  } else if (userRole === 'FREELANCER') {
    where.freelancerId = userId;
  } else if (userRole === 'ADMIN') {
    // Admin can see all orders
  } else {
    throw new Error('Invalid user role');
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.serviceId) {
    where.serviceId = filters.serviceId;
  }

  const orders = await prisma.order.findMany({
    where,
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
        },
      },
      freelancer: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
        },
      },
      contract: {
        select: {
          status: true,
        },
      },
      deliverables: {
        take: 1,
        orderBy: { deliveredAt: 'desc' },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: filters.limit || 50,
    skip: filters.skip || 0,
  });

  return orders;
}

/**
 * Get order by conversation ID
 */
export async function getOrderByConversationId(conversationId, userId) {
  const order = await prisma.order.findFirst({
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
        },
      },
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
        },
      },
      freelancer: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
        },
      },
      contract: true,
      deliverables: {
        orderBy: { deliveredAt: 'desc' },
        take: 1,
      },
    },
  });

  return order;
}

