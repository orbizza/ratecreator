/**
 * @fileoverview Redis client implementation for Rate Creator platform
 * @module clients/redis-do
 * @description Provides a singleton client for interacting with Redis cache service,
 * handling cache operations, connection management, and error handling.
 */

import Redis from "ioredis";

/**
 * Singleton instance of the Redis client
 * @private
 */
let redisClient: Redis | null = null;

/**
 * Returns a singleton instance of the Redis client
 * @returns {Redis} The Redis client instance
 * @throws {Error} If Redis credentials are not configured
 */
export const getRedisClient = (): Redis => {
  if (!redisClient) {
    const host = process.env.REDIS_HOST || "";
    const port = parseInt(process.env.REDIS_PORT || "6379", 10);

    if (!host) {
      console.warn(
        "[Redis] REDIS_HOST environment variable is not set. " +
          "Connection will fall back to 127.0.0.1:6379, which will fail in production. " +
          "Ensure REDIS_HOST, REDIS_PORT, REDIS_USERNAME, and REDIS_PASSWORD are configured.",
      );
    }

    redisClient = new Redis({
      host,
      port,
      username: process.env.REDIS_USERNAME || "",
      password: process.env.REDIS_PASSWORD || "",
      tls: {},
    });

    redisClient.on("error", (err) => {
      console.error("Redis client error:", err);
    });

    redisClient.on("connect", () => {
      // Connection established
    });

    // process.on("SIGINT", async () => {
    //   console.log("Gracefully shutting down...");
    //   await closeRedisConnection();
    //   process.exit(0);
    // });

    // process.on("SIGTERM", async () => {
    //   console.log("Gracefully shutting down...");
    //   await closeRedisConnection();
    //   process.exit(0);
    // });
  }

  return redisClient;
};

/**
 * Closes the Redis connection
 * @returns {Promise<void>} Promise that resolves when the connection is closed
 */
export const closeRedisConnection = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};

export default getRedisClient;
