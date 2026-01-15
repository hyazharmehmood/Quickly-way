const { PrismaClient } = require('@prisma/client');

const prismaClientSingleton = () => {
    return new PrismaClient();
};

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaGlobal = prisma;

module.exports = prisma;

