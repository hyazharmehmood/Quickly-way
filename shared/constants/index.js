/**
 * User roles
 */
const USER_ROLES = {
  CLIENT: 'client',
  FREELANCER: 'freelancer',
};

/**
 * Project statuses
 */
const PROJECT_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

/**
 * Proposal statuses
 */
const PROPOSAL_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
};

/**
 * Seller application statuses
 */
const SELLER_STATUS = {
  NONE: 'none',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

/**
 * API response codes
 */
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

module.exports = {
  USER_ROLES,
  PROJECT_STATUS,
  PROPOSAL_STATUS,
  SELLER_STATUS,
  HTTP_STATUS,
};

