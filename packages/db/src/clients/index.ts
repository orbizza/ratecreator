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

declare global {
  // Allow global `prisma` variable
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma =
      globalThis.prisma ||
      new PrismaClient({
        log: [
          { level: "error", emit: "event" },
          { level: "warn", emit: "event" },
        ],
        errorFormat: "pretty",
      });

    // Add event listeners for connection issues
    // @ts-ignore - Types are not properly exposed in Prisma
    prisma.$on("error", (e) => {
      console.error("Prisma Client error:", e);
    });

    // @ts-ignore - Types are not properly exposed in Prisma
    prisma.$on("warn", (e) => {
      console.warn("Prisma Client warning:", e);
    });

    if (process.env.NODE_ENV !== "production") {
      globalThis.prisma = prisma;
    }
  }
  return prisma;
}

export default getPrismaClient;
