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
    redisClient = new Redis({
      host: process.env.REDIS_HOST || "",
      port: parseInt(process.env.REDIS_PORT || "6379", 10),
      username: process.env.REDIS_USERNAME || "",
      password: process.env.REDIS_PASSWORD || "",
      tls: {},
    });

    redisClient.on("error", (err) => {
      console.error("Redis client error:", err);
    });

    redisClient.on("connect", () => {
      // console.log("Connected to Redis");
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
