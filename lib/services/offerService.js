import prisma from '@/lib/prisma';

/**
 * Create a new offer (Fiverr-like: freelancer sends offer to client)
 * This does NOT create an order - order is created only when client accepts
 */
export async function createOffer({
  serviceId,
  clientId,
  freelancerId,
  conversationId,
  deliveryTime,
  revisionsIncluded = 0,
  scopeOfWork,
  cancellationPolicy = 'Standard cancellation policy applies',
  price,
}) {
  // Get service details
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: { freelancer: true },
  });

  if (!service) {
    throw new Error('Service not found');
  }

  // Validation
  if (freelancerId !== service.freelancerId) {
    throw new Error('You can only create offers for your own services');
  }

  // Use provided price or service price
  const offerPrice = price || service.price;
  if (!offerPrice || offerPrice <= 0) {
    throw new Error('Price must be set and greater than 0');
  }

  // Create offer (NOT an order yet)
  const offer = await prisma.offer.create({
    data: {
      serviceId,
      clientId,
      freelancerId,
      conversationId,
      status: 'PENDING',
      price: offerPrice,
      currency: service.currency || 'USD',
      deliveryTime: deliveryTime || 7,
      revisionsIncluded,
      scopeOfWork: scopeOfWork || service.description,
      cancellationPolicy,
      serviceTitle: service.title,
      serviceDescription: service.description,
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

  return offer;
}

/**
 * Accept offer by CLIENT - Creates the order
 */
export async function acceptOffer(offerId, userId, userRole, ipAddress) {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      service: true,
    },
  });

  if (!offer) {
    throw new Error('Offer not found');
  }

  // Only clients can accept offers
  if (userRole !== 'CLIENT') {
    throw new Error('Only clients can accept offers');
  }

  if (offer.clientId !== userId) {
    throw new Error('Unauthorized: Not your offer');
  }

  if (offer.status !== 'PENDING') {
    throw new Error(`Cannot accept offer with status: ${offer.status}`);
  }

  // Check if offer already has an order
  if (offer.orderId) {
    throw new Error('Offer already accepted - order already exists');
  }

  // Generate order number
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const orderNumber = `ORD-${year}-${random}`;

  // Calculate delivery date
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + offer.deliveryTime);

  // Create order from accepted offer
  const order = await prisma.order.create({
    data: {
      orderNumber,
      serviceId: offer.serviceId,
      clientId: offer.clientId,
      freelancerId: offer.freelancerId,
      conversationId: offer.conversationId,
      offerId: offer.id, // Link to the offer
      status: 'IN_PROGRESS', // Directly move to IN_PROGRESS since offer was accepted
      price: offer.price,
      currency: offer.currency,
      deliveryTime: offer.deliveryTime,
      revisionsIncluded: offer.revisionsIncluded,
      deliveryDate,
      clientIpAddress: ipAddress,
      contract: {
        create: {
          serviceTitle: offer.serviceTitle,
          serviceDescription: offer.serviceDescription || '',
          scopeOfWork: offer.scopeOfWork,
          price: offer.price,
          currency: offer.currency,
          deliveryTime: offer.deliveryTime,
          revisionsIncluded: offer.revisionsIncluded,
          cancellationPolicy: offer.cancellationPolicy || 'Standard cancellation policy applies',
          status: 'ACTIVE', // Contract is active since offer was accepted
          clientAcceptedAt: new Date(),
          clientIpAddress: ipAddress,
        },
      },
      events: {
        create: {
          userId: userId,
          eventType: 'ORDER_CREATED',
          description: `Order created from accepted offer`,
          metadata: {
            offerId: offer.id,
            serviceTitle: offer.serviceTitle,
            price: offer.price,
            deliveryTime: offer.deliveryTime,
            createdBy: 'CLIENT_ACCEPTED_OFFER',
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
          id: true,
          serviceTitle: true,
          serviceDescription: true,
          scopeOfWork: true,
          price: true,
          currency: true,
          deliveryTime: true,
          revisionsIncluded: true,
          cancellationPolicy: true,
          status: true,
          clientAcceptedAt: true,
          freelancerAcceptedAt: true,
          rejectionReason: true,
          rejectedAt: true,
          rejectedBy: true,
          createdAt: true,
          updatedAt: true,
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

  // Update offer status to ACCEPTED and link to order
  const updatedOffer = await prisma.offer.update({
    where: { id: offerId },
    data: {
      status: 'ACCEPTED',
      acceptedAt: new Date(),
      orderId: order.id,
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
          contract: true,
        },
      },
    },
  });

  return { offer: updatedOffer, order };
}

/**
 * Reject offer by CLIENT - Just mark as rejected, no order created
 */
export async function rejectOffer(offerId, userId, userRole, rejectionReason) {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
  });

  if (!offer) {
    throw new Error('Offer not found');
  }

  // Only clients can reject offers
  if (userRole !== 'CLIENT') {
    throw new Error('Only clients can reject offers');
  }

  if (offer.clientId !== userId) {
    throw new Error('Unauthorized: Not your offer');
  }

  if (offer.status !== 'PENDING') {
    throw new Error(`Cannot reject offer with status: ${offer.status}`);
  }

  // Update offer status to REJECTED (no order created)
  const updatedOffer = await prisma.offer.update({
    where: { id: offerId },
    data: {
      status: 'REJECTED',
      rejectedAt: new Date(),
      rejectionReason: rejectionReason || 'No reason provided',
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

  return updatedOffer;
}

/**
 * Get offer by ID with authorization check
 */
export async function getOfferById(offerId, userId, userRole) {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
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
      conversation: true,
      order: {
        include: {
          contract: true,
        },
      },
    },
  });

  if (!offer) {
    throw new Error('Offer not found');
  }

  // Authorization check
  const isClient = offer.clientId === userId;
  const isFreelancer = offer.freelancerId === userId;
  const isAdmin = userRole === 'ADMIN';

  if (!isClient && !isFreelancer && !isAdmin) {
    throw new Error('Unauthorized');
  }

  return offer;
}

/**
 * Get offers for a conversation
 */
export async function getOffersByConversationId(conversationId, userId) {
  const offers = await prisma.offer.findMany({
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
          contract: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return offers;
}

