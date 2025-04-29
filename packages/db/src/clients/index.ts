/**
 * @fileoverview Database clients index file for Rate Creator platform
 * @module clients/index
 * @description Exports all database and service clients for use throughout the application.
 * Provides a centralized point for accessing database clients and ensures consistent
 * client instances across the application.
 */

// import { PrismaClient } from "@prisma/client";

// const prismaClientSingleton = () => {
//   return new PrismaClient();
// };

// type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

// // eslint-disable-next-line
// const globalForPrisma = globalThis as unknown as {
//   prisma: PrismaClientSingleton | undefined;
// };

// const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

// export default prisma;

// if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
import { PrismaClient } from "@prisma/client";

/**
 * Global declaration for Prisma client
 * @private
 */
declare global {
  // Allow global `prisma` variable
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Prisma client instance
 * @private
 */
let prisma: PrismaClient;

/**
 * Returns a singleton instance of the Prisma client
 * @returns {PrismaClient} The Prisma client instance
 */
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = globalThis.prisma || new PrismaClient();

    if (process.env.NODE_ENV !== "production") {
      globalThis.prisma = prisma;
    }
  }
  return prisma;
}

export default getPrismaClient;
