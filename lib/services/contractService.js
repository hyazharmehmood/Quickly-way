import prisma from '@/lib/prisma';

/* =====================================================
   UTIL: CONTRACT NUMBER GENERATOR
===================================================== */
function generateContractNumber() {
  const now = new Date();

  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');

  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();

  return `CTR-${yyyy}${mm}${dd}-${hh}${mi}${ss}-${rand}`;
}

/* =====================================================
   CREATE CONTRACT (Freelancer → Client)
===================================================== */
export async function createContract({
  serviceId,
  clientId,
  freelancerId,
  conversationId,
  deliveryTime = 7,
  revisionsIncluded = 0,
  scopeOfWork,
  cancellationPolicy = 'Standard cancellation policy applies',
  price,
  freelancerIpAddress,
}) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
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
  });

  if (!service) throw new Error('Service not found');
  if (service.freelancerId !== freelancerId)
    throw new Error('Unauthorized');

  const contractPrice = price ?? service.price;
  if (!contractPrice || contractPrice <= 0) {
    throw new Error('Price must be set and greater than 0');
  }

  const contract = await prisma.contract.create({
    data: {
      contractNumber: generateContractNumber(),
      serviceId,
      clientId,
      freelancerId,
      conversationId,
      serviceTitle: service.title,
      serviceDescription: service.description,
      scopeOfWork: scopeOfWork ?? service.description,
      cancellationPolicy,
      price: contractPrice,
      currency: service.currency ?? 'USD',
      deliveryTime,
      revisionsIncluded,
      status: 'PENDING_ACCEPTANCE',
      freelancerIpAddress,
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
      conversation: true,
    },
  });

  // Create event
  await prisma.contractEvent.create({
    data: {
      contractId: contract.id,
      userId: freelancerId,
      eventType: 'CONTRACT_CREATED',
      description: 'Contract created by freelancer',
    },
  });

  return contract;
}

/* =====================================================
   ACCEPT CONTRACT (Client)
   IMPORTANT: Contract = Offer only
   When contract is accepted, an Order is automatically created
   Order starts with status = PENDING (waiting for payment)
   Work can only start when order.status === ACTIVE (after payment)
===================================================== */
export async function acceptContract(contractId, userId, userRole, ipAddress) {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
  });

  if (!contract) throw new Error('Contract not found');
  
  if (userRole === 'CLIENT') {
    if (contract.clientId !== userId)
      throw new Error('Unauthorized');
  } else if (userRole !== 'ADMIN') {
    throw new Error('Only clients can accept contracts');
  }
  
  if (contract.status !== 'PENDING_ACCEPTANCE')
    throw new Error('Invalid contract state');

  // Update contract status to ACTIVE (contract = offer, accepted)
  const updatedContract = await prisma.contract.update({
    where: { id: contractId },
    data: {
      status: 'ACTIVE',
      clientAcceptedAt: new Date(),
      clientIpAddress: ipAddress,
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
      conversation: true,
      order: true, // Include order if it exists
    },
  });

  // Create contract event
  await prisma.contractEvent.create({
    data: {
      contractId: contractId,
      userId: userId,
      eventType: 'CONTRACT_ACCEPTED',
      description: 'Contract accepted by client',
      metadata: {
        acceptedAt: new Date().toISOString(),
        acceptedBy: 'CLIENT',
      },
    },
  });

  // CRITICAL: Automatically create Order when contract is accepted
  // Order starts with status = PENDING (waiting for payment)
  // FUTURE: Order becomes ACTIVE when payment is processed
  let order = null;
  try {
    const { createOrderFromContract } = await import('./orderService');
    order = await createOrderFromContract(updatedContract);
    
    // Reload contract with order
    const contractWithOrder = await prisma.contract.findUnique({
      where: { id: contractId },
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
        conversation: true,
        order: {
          include: {
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
      },
    });
    
    return contractWithOrder;
  } catch (error) {
    // If order creation fails, log but don't fail the contract acceptance
    console.error('Failed to create order after contract acceptance:', error);
    // Return contract without order (order can be created manually later if needed)
  return updatedContract;
  }
}

/* =====================================================
   REJECT CONTRACT (Client)
===================================================== */
export async function rejectContract(contractId, userId, userRole, rejectionReason) {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
  });

  if (!contract) throw new Error('Contract not found');
  
  if (userRole === 'CLIENT') {
    if (contract.clientId !== userId) {
      throw new Error('Unauthorized');
    }
  } else if (userRole !== 'ADMIN') {
    throw new Error('Only clients can reject contracts');
  }
  
  if (contract.status !== 'PENDING_ACCEPTANCE')
    throw new Error('Invalid contract state');

  const updatedContract = await prisma.contract.update({
    where: { id: contractId },
    data: {
      status: 'REJECTED',
      rejectedAt: new Date(),
      rejectedBy: userId,
      rejectionReason,
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
    },
  });

  // Create event
  await prisma.contractEvent.create({
    data: {
      contractId: contractId,
      userId: userId,
      eventType: 'CONTRACT_REJECTED',
      description: `Contract rejected by client: ${rejectionReason}`,
      metadata: {
        rejectionReason,
        rejectedBy: 'CLIENT',
      },
    },
  });

  return updatedContract;
}

/* =====================================================
   SUBMIT DELIVERY (Freelancer)
   DEPRECATED: Use orderService.submitOrderDelivery() instead
   This function is kept for backward compatibility but redirects to Order
   CRITICAL: Delivery can only happen when order.status === ACTIVE
===================================================== */
export async function submitDelivery(
  contractId,
  freelancerId,
  { type, fileUrl, message, isRevision = false }
) {
  // Find the order associated with this contract
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { order: true },
  });

  if (!contract) throw new Error('Contract not found');
  if (contract.freelancerId !== freelancerId)
    throw new Error('Unauthorized');

  // CRITICAL: Must have an order to submit delivery
  if (!contract.order) {
    throw new Error(
      'Order not found. Contract must be accepted and order created before delivery can be submitted.'
    );
  }

  // Redirect to order service (which checks order.status === ACTIVE)
  const { submitOrderDelivery } = await import('./orderService');
  const result = await submitOrderDelivery(
    contract.order.id,
    freelancerId,
    { type, fileUrl, message, isRevision }
  );

  // Return in contract format for backward compatibility
  const updatedContract = await prisma.contract.findUnique({
    where: { id: contractId },
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
      order: {
        include: {
      deliverables: {
        orderBy: { deliveredAt: 'desc' },
          },
        },
      },
    },
  });

  return { 
    contract: updatedContract,
    deliverable: result.deliverable,
    order: result.order, // Include order for frontend
  };
}

/* =====================================================
   ACCEPT DELIVERY (Client)
   DEPRECATED: Use orderService.acceptOrderDelivery() instead
   This function is kept for backward compatibility but redirects to Order
===================================================== */
export async function acceptDelivery(contractId, clientId, deliverableId) {
  // Find the order associated with this contract
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { order: true },
  });

  if (!contract) throw new Error('Contract not found');
  if (contract.clientId !== clientId)
    throw new Error('Unauthorized');

  // CRITICAL: Must have an order to accept delivery
  if (!contract.order) {
    throw new Error(
      'Order not found. Contract must be accepted and order created before delivery can be accepted.'
    );
  }

  // Find deliverable in order
  const deliverable = await prisma.orderDeliverable.findFirst({
    where: {
      orderId: contract.order.id,
      id: deliverableId,
    },
  });

  if (!deliverable) {
    throw new Error('Deliverable not found in order');
  }

  // Redirect to order service
  const { acceptOrderDelivery } = await import('./orderService');
  const updatedOrder = await acceptOrderDelivery(
    contract.order.id,
    clientId,
    deliverableId
  );

  // Return contract with updated order for backward compatibility
  const updatedContract = await prisma.contract.findUnique({
    where: { id: contractId },
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
      order: {
        include: {
      deliverables: {
        orderBy: { deliveredAt: 'desc' },
      },
    },
      },
    },
  });

  return updatedContract;
}

/* =====================================================
   REQUEST REVISION (Client)
   DEPRECATED: Use orderService.requestOrderRevision() instead
   This function is kept for backward compatibility but redirects to Order
   CRITICAL: Revision can only be requested when order.status === ACTIVE or DELIVERED
===================================================== */
export async function requestRevision(contractId, clientId, reason) {
  // Find the order associated with this contract
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { order: true },
  });

  if (!contract) throw new Error('Contract not found');
  if (contract.clientId !== clientId)
    throw new Error('Unauthorized');

  // CRITICAL: Must have an order to request revision
  if (!contract.order) {
    throw new Error(
      'Order not found. Contract must be accepted and order created before revision can be requested.'
    );
  }

  // Redirect to order service
  const { requestOrderRevision } = await import('./orderService');
  const updatedOrder = await requestOrderRevision(
    contract.order.id,
    clientId,
    reason
  );

  // Return contract with updated order for backward compatibility
  const updatedContract = await prisma.contract.findUnique({
    where: { id: contractId },
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
      order: {
        include: {
      deliverables: {
        orderBy: { deliveredAt: 'desc' },
      },
    },
      },
    },
  });

  return updatedContract;
}

/* =====================================================
   CANCEL CONTRACT (Client / Freelancer)
===================================================== */
export async function cancelContract(contractId, userId, reason, userRole) {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
  });

  if (!contract) throw new Error('Contract not found');

  const isClient = contract.clientId === userId;
  const isFreelancer = contract.freelancerId === userId;
  const isAdmin = userRole === 'ADMIN';

  if (!isClient && !isFreelancer && !isAdmin) {
    throw new Error('Unauthorized');
  }

  if (
    !['PENDING_ACCEPTANCE', 'ACTIVE'].includes(contract.status)
  ) {
    throw new Error('Cannot cancel now');
  }

  const updatedContract = await prisma.contract.update({
    where: { id: contractId },
    data: {
      status: 'CANCELLED',
      cancellationPolicy: reason,
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
    },
  });

  // Create event
  await prisma.contractEvent.create({
    data: {
      contractId: contractId,
      userId,
      eventType: 'CONTRACT_CANCELLED',
      description: `Contract cancelled by ${userRole}: ${reason}`,
      metadata: {
        reason,
        cancelledBy: userId,
        userRole,
      },
    },
  });

  return updatedContract;
}

/* =====================================================
   GET CONTRACT BY ID (Auth Safe)
   Returns contract with associated order (if exists)
===================================================== */
export async function getContractById(contractId, userId, userRole) {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
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
      order: {
        include: {
          deliverables: {
            orderBy: { deliveredAt: 'desc' },
          },
          events: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      },
      // Keep old deliverables for backward compatibility
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

  if (!contract) throw new Error('Contract not found');

  const isClient = contract.clientId === userId;
  const isFreelancer = contract.freelancerId === userId;
  const isAdmin = userRole === 'ADMIN';

  if (!isClient && !isFreelancer && !isAdmin) {
    throw new Error('Unauthorized');
  }

  return contract;
}

/* =====================================================
   GET USER CONTRACTS
===================================================== */
export async function getUserContracts(userId, userRole, filters = {}) {
  const where = {};

  if (userRole === 'CLIENT') {
    where.clientId = userId;
  } else if (userRole === 'FREELANCER') {
    where.freelancerId = userId;
  } else if (userRole === 'ADMIN') {
    // Admin can see all contracts
  } else {
    throw new Error('Invalid user role');
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.serviceId) {
    where.serviceId = filters.serviceId;
  }

  return prisma.contract.findMany({
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

/* =====================================================
   GET CONTRACT BY CONVERSATION ID
   Returns the LATEST contract for a conversation (most recent)
   IMPORTANT: A conversation can have multiple contracts, this returns the newest one
===================================================== */
export async function getContractByConversationId(conversationId, userId) {
  try {
    const contract = await prisma.contract.findFirst({
      where: {
        conversationId,
        OR: [
          { clientId: userId },
          { freelancerId: userId },
        ],
      },
      orderBy: {
        createdAt: 'desc', // Get the LATEST contract
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
        // Include order if Order table exists (after migration)
        order: {
          include: {
            deliverables: {
              orderBy: { deliveredAt: 'desc' },
              take: 1,
            },
          },
        },
        // Keep old deliverables for backward compatibility
        deliverables: {
          orderBy: { deliveredAt: 'desc' },
          take: 1,
        },
      },
    });

    return contract;
  } catch (error) {
    // If Order table doesn't exist yet (before migration), query without order
    if (error.code === 'P2021' && error.meta?.table === 'Order') {
      const contract = await prisma.contract.findFirst({
        where: {
          conversationId,
          OR: [
            { clientId: userId },
            { freelancerId: userId },
          ],
        },
        orderBy: {
          createdAt: 'desc', // Get the LATEST contract
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
          deliverables: {
            orderBy: { deliveredAt: 'desc' },
            take: 1,
          },
        },
      });
      return contract;
    }
    throw error;
  }
}

/* =====================================================
   GET ALL CONTRACTS BY CONVERSATION ID
   Returns ALL contracts for a conversation (for displaying multiple contracts)
===================================================== */
export async function getAllContractsByConversationId(conversationId, userId) {
  try {
    const contracts = await prisma.contract.findMany({
      where: {
        conversationId,
        OR: [
          { clientId: userId },
          { freelancerId: userId },
        ],
      },
      orderBy: {
        createdAt: 'desc', // Latest first
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
        order: {
          include: {
            deliverables: {
              orderBy: { deliveredAt: 'desc' },
              take: 1,
            },
          },
        },
        deliverables: {
          orderBy: { deliveredAt: 'desc' },
          take: 1,
        },
      },
    });

    return contracts;
  } catch (error) {
    // If Order table doesn't exist yet (before migration), query without order
    if (error.code === 'P2021' && error.meta?.table === 'Order') {
      const contracts = await prisma.contract.findMany({
        where: {
          conversationId,
          OR: [
            { clientId: userId },
            { freelancerId: userId },
          ],
        },
        orderBy: {
          createdAt: 'desc',
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
          deliverables: {
            orderBy: { deliveredAt: 'desc' },
            take: 1,
          },
        },
      });
      return contracts;
    }
    throw error;
  }
}
