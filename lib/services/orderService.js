import prisma from '@/lib/prisma';

/* =====================================================
   UTIL: ORDER NUMBER GENERATOR
===================================================== */
function generateOrderNumber() {
  const now = new Date();

  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');

  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();

  return `ORD-${yyyy}${mm}${dd}-${hh}${mi}${ss}-${rand}`;
}

/* =====================================================
   CREATE ORDER (Auto-created when Contract is accepted)
   This is called automatically by acceptContract()
   FUTURE: Order becomes ACTIVE when payment is processed
===================================================== */
export async function createOrderFromContract(contract) {
  // Check if order already exists
  const existingOrder = await prisma.order.findUnique({
    where: { contractId: contract.id },
  });

  if (existingOrder) {
    throw new Error('Order already exists for this contract');
  }

  // Create order with PENDING status (waiting for payment)
  // FUTURE: When payment is integrated, order.status will become ACTIVE after payment
  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      contractId: contract.id,
      serviceId: contract.serviceId,
      clientId: contract.clientId,
      freelancerId: contract.freelancerId,
      conversationId: contract.conversationId,
      
      // Copy details from contract
      serviceTitle: contract.serviceTitle,
      serviceDescription: contract.serviceDescription,
      scopeOfWork: contract.scopeOfWork,
      price: contract.price,
      currency: contract.currency,
      deliveryTime: contract.deliveryTime,
      revisionsIncluded: contract.revisionsIncluded,
      revisionsUsed: contract.revisionsUsed,
      
      // Order starts as PENDING (waiting for payment)
      status: 'PENDING',
      paymentStatus: 'PENDING',
      
      // Delivery date will be calculated when order becomes ACTIVE
      // FUTURE: deliveryDate = now + deliveryTime when paymentStatus === PAID
    },
    include: {
      contract: {
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
        },
      },
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
    },
  });

  // Create order event
  await prisma.orderEvent.create({
    data: {
      orderId: order.id,
      userId: contract.clientId, // Client accepted, so they triggered order creation
      eventType: 'ORDER_CREATED',
      description: 'Order created when contract was accepted. Waiting for payment.',
      metadata: {
        contractId: contract.id,
        contractNumber: contract.contractNumber,
        note: 'Payment integration pending - order will become ACTIVE when payment is processed',
      },
    },
  });

  return order;
}

/* =====================================================
   ACTIVATE ORDER (Future: Called when payment is processed)
   This function is ready for payment integration
   When payment is successful, call this to activate the order
===================================================== */
export async function activateOrder(orderId, paymentData = {}) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) throw new Error('Order not found');
  if (order.status !== 'PENDING') {
    throw new Error(`Order cannot be activated. Current status: ${order.status}`);
  }

  // FUTURE: Verify payment was successful before activating
  // For now, we'll just activate it (payment integration will add verification)

  const now = new Date();
  const deliveryDate = new Date(now);
  deliveryDate.setDate(deliveryDate.getDate() + order.deliveryTime);

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'ACTIVE',
      paymentStatus: 'PAID', // FUTURE: Set based on actual payment verification
      paymentMethod: paymentData.method || null,
      paymentTransactionId: paymentData.transactionId || null,
      paidAt: now,
      deliveryDate, // Start countdown now
    },
    include: {
      contract: true,
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
    },
  });

  // Create order event
  await prisma.orderEvent.create({
    data: {
      orderId: order.id,
      userId: order.clientId,
      eventType: 'ORDER_ACTIVATED',
      description: 'Order activated - payment completed. Work can now start.',
      metadata: {
        paymentMethod: paymentData.method,
        paymentTransactionId: paymentData.transactionId,
        deliveryDate: deliveryDate.toISOString(),
      },
    },
  });

  return updatedOrder;
}

/* =====================================================
   SUBMIT DELIVERY (Freelancer)
   Can only submit delivery when order.status === ACTIVE
===================================================== */
export async function submitOrderDelivery(
  orderId,
  freelancerId,
  { type, fileUrl, message, isRevision = false }
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { deliverables: true },
  });

  if (!order) throw new Error('Order not found');
  if (order.freelancerId !== freelancerId)
    throw new Error('Unauthorized');
  
  // CRITICAL: Only allow delivery when order is ACTIVE
  if (order.status !== 'ACTIVE' && order.status !== 'REVISION_REQUESTED') {
    throw new Error(
      `Cannot submit delivery. Order status must be ACTIVE. Current status: ${order.status}. ` +
      `Payment must be completed before work can start.`
    );
  }

  // Check revisions
  if (
    isRevision &&
    order.revisionsUsed >= order.revisionsIncluded
  ) {
    throw new Error('No revisions left');
  }

  const revisionNumber = isRevision
    ? order.revisionsUsed + 1
    : null;

  // Create deliverable
  const deliverable = await prisma.orderDeliverable.create({
    data: {
      orderId: order.id,
      type,
      fileUrl,
      message,
      isRevision,
      revisionNumber,
    },
  });

  // Update Order status
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'DELIVERED',
      deliveredAt: new Date(),
      revisionsUsed: isRevision
        ? { increment: 1 }
        : undefined,
    },
  });

  // Create event
  await prisma.orderEvent.create({
    data: {
      orderId: order.id,
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
  });

  const updatedOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      contract: true,
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
      deliverables: {
        orderBy: { deliveredAt: 'desc' },
      },
    },
  });

  return { 
    order: updatedOrder,
    deliverable 
  };
}

/* =====================================================
   ACCEPT DELIVERY (Client)
===================================================== */
export async function acceptOrderDelivery(orderId, clientId, deliverableId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { deliverables: true },
  });

  if (!order) throw new Error('Order not found');
  if (order.clientId !== clientId)
    throw new Error('Unauthorized');
  if (order.status !== 'DELIVERED')
    throw new Error('Nothing to accept');

  // Mark deliverable as accepted
  await prisma.orderDeliverable.update({
    where: { id: deliverableId },
    data: {
      acceptedAt: new Date(),
    },
  });

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
    },
    include: {
      contract: true,
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
      deliverables: {
        orderBy: { deliveredAt: 'desc' },
      },
    },
  });

  // Create event
  await prisma.orderEvent.create({
    data: {
      orderId: order.id,
      userId: clientId,
      eventType: 'DELIVERY_ACCEPTED',
      description: 'Delivery accepted by client',
    },
  });

  return updatedOrder;
}

/* =====================================================
   REQUEST REVISION (Client)
   Can only request revision when order.status === ACTIVE or DELIVERED
===================================================== */
export async function requestOrderRevision(orderId, clientId, reason) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) throw new Error('Order not found');
  if (order.clientId !== clientId)
    throw new Error('Unauthorized');
  if (order.status !== 'DELIVERED')
    throw new Error('Revision not allowed');

  // Check revisions
  if (order.revisionsUsed >= order.revisionsIncluded)
    throw new Error('No revisions left');

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'REVISION_REQUESTED',
    },
    include: {
      contract: true,
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
      deliverables: {
        orderBy: { deliveredAt: 'desc' },
      },
    },
  });

  // Create event
  await prisma.orderEvent.create({
    data: {
      orderId: order.id,
      userId: clientId,
      eventType: 'REVISION_REQUESTED',
      description: `Revision requested: ${reason}`,
      metadata: {
        reason,
      },
    },
  });

  return updatedOrder;
}

/* =====================================================
   GET ORDER BY ID (Auth Safe)
===================================================== */
export async function getOrderById(orderId, userId, userRole) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      contract: {
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
        },
      },
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
      deliverables: {
        orderBy: { deliveredAt: 'desc' },
      },
      events: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!order) throw new Error('Order not found');

  const isClient = order.clientId === userId;
  const isFreelancer = order.freelancerId === userId;
  const isAdmin = userRole === 'ADMIN';

  if (!isClient && !isFreelancer && !isAdmin) {
    throw new Error('Unauthorized');
  }

  return order;
}

/* =====================================================
   GET ORDER BY CONTRACT ID
===================================================== */
export async function getOrderByContractId(contractId, userId) {
  const order = await prisma.order.findFirst({
    where: {
      contractId,
      OR: [
        { clientId: userId },
        { freelancerId: userId },
      ],
    },
    include: {
      contract: true,
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
      deliverables: {
        orderBy: { deliveredAt: 'desc' },
        take: 1,
      },
    },
  });

  return order;
}

/* =====================================================
   GET USER ORDERS
===================================================== */
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

  if (filters.paymentStatus) {
    where.paymentStatus = filters.paymentStatus;
  }

  if (filters.serviceId) {
    where.serviceId = filters.serviceId;
  }

  return prisma.order.findMany({
    where,
    include: {
      contract: {
        select: {
          id: true,
          contractNumber: true,
          status: true,
        },
      },
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
      deliverables: {
        take: 1,
        orderBy: { deliveredAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: filters.limit || 50,
    skip: filters.skip || 0,
  });
}
