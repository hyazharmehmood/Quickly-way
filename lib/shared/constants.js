/**
 * User roles
 */
export const USER_ROLES = {
    CLIENT: 'CLIENT',
    FREELANCER: 'FREELANCER',
    ADMIN: 'ADMIN',
};

/**
 * Project statuses
 */
export const PROJECT_STATUS = {
    OPEN: 'OPEN',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
};

/**
 * Proposal statuses
 */
export const PROPOSAL_STATUS = {
    PENDING: 'PENDING',
    ACCEPTED: 'ACCEPTED',
    REJECTED: 'REJECTED',
};

/**
 * Seller application statuses
 */
export const SELLER_STATUS = {
    NONE: 'NONE',
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
};

/**
 * API response codes
 */
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
};
