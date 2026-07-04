const prisma = require('../../config/prisma');

async function findById(id) {
  return prisma.user.findUnique({ where: { id } });
}

function isOwnerOrAdmin(user, resourceOwnerId) {
  return user.role === 'ADMIN' || user.id === resourceOwnerId;
}

module.exports = { findById, isOwnerOrAdmin };
