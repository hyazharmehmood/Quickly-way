/**
 * Global Presence Store - Single source of truth for online users
 * Used by: socket.js (updates), getPublicServicesServer (reads)
 * Multi-device: User is online if ANY socket is connected.
 */
const onlineUsers = new Map();

/**
 * Add user/socket - supports multiple devices per user
 */
function addUser(userId, socketId, { role, isSeller, sellerStatus }) {
  let userData = onlineUsers.get(userId);
  if (!userData) {
    userData = {
      socketIds: new Set(),
      role,
      isSeller: isSeller ?? false,
      sellerStatus: sellerStatus || null,
      lastActive: Date.now(),
      chattingWith: null,
    };
    onlineUsers.set(userId, userData);
  }
  userData.socketIds.add(socketId);
  userData.lastActive = Date.now();
  return userData;
}

/**
 * Update user data (chattingWith, lastActive, etc.)
 */
function updateUserData(userId, updates) {
  const userData = onlineUsers.get(userId);
  if (!userData) return;
  Object.assign(userData, updates);
}

/**
 * Remove socket on disconnect - user stays online if other devices connected
 */
function removeSocket(userId, socketId) {
  const userData = onlineUsers.get(userId);
  if (!userData) return false;
  userData.socketIds.delete(socketId);
  if (userData.socketIds.size === 0) {
    onlineUsers.delete(userId);
    return true; // user fully offline
  }
  return false;
}

/**
 * Get online freelancer/seller IDs
 * - FREELANCER role → seller
 * - CLIENT with isSeller true AND sellerStatus APPROVED → seller
 */
function getOnlineFreelancerIds() {
  return Array.from(onlineUsers.entries())
    .filter(([, data]) => {
      if (data.role === 'FREELANCER') return true;
      if (data.role === 'CLIENT' && data.isSeller && data.sellerStatus === 'APPROVED') return true;
      return false;
    })
    .map(([userId]) => userId);
}

function isUserOnline(userId) {
  return onlineUsers.has(userId);
}

function getOnlineUser(userId) {
  const data = onlineUsers.get(userId);
  if (!data) return null;
  const socketIds = Array.from(data.socketIds);
  return {
    ...data,
    socketId: socketIds[0],
    socketIds,
  };
}

function getOnlineUsers() {
  return Array.from(onlineUsers.entries()).map(([userId, data]) => {
    const socketIds = Array.from(data.socketIds);
    return {
      userId,
      socketId: socketIds[0],
      role: data.role,
      isSeller: data.isSeller,
      lastActive: data.lastActive,
      chattingWith: data.chattingWith,
      socketIds, // for internal use (e.g. room checks)
    };
  });
}

module.exports = {
  onlineUsers,
  addUser,
  removeSocket,
  updateUserData,
  getOnlineFreelancerIds,
  isUserOnline,
  getOnlineUser,
  getOnlineUsers,
};
