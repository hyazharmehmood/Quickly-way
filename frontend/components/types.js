// Basic type definitions for Service and Review
// In a real TS project these would be interfaces, but for JS we just export empty objects or JSDoc

/**
 * @typedef {Object} Provider
 * @property {string} name
 * @property {string} avatarUrl
 * @property {boolean} isOnline
 * @property {string} location
 * @property {string[]} languages
 * @property {string} memberSince
 */

/**
 * @typedef {Object} Review
 * @property {string} id
 * @property {string} userName
 * @property {string} [userAvatar]
 * @property {number} rating
 * @property {string} comment
 * @property {string} date
 * @property {string} [details]
 */

/**
 * @typedef {Object} Service
 * @property {string} id
 * @property {Provider} provider
 * @property {number} rating
 * @property {number} reviewCount
 * @property {number} hires
 * @property {string} description
 * @property {string[]} [galleryUrls]
 * @property {string} bio
 * @property {string[]} [skills]
 * @property {string} expertise
 * @property {string} price
 * @property {string} [priceRange]
 * @property {Object} [workingHours]
 * @property {string[]} [paymentMethods]
 * @property {Review[]} [reviewsList]
 * @property {number} yearsExperience
 */

export const Service = {};
export const Review = {};
