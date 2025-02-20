import Redis from "ioredis";

let redisClient: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || "",
      port: parseInt(process.env.REDIS_PORT || "6379", 10),
      username: process.env.REDIS_USERNAME || "",
      password: process.env.REDIS_PASSWORD || "",
      tls: {
        rejectUnauthorized: false, // For self-signed certificates
      },
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    redisClient.on("error", (err) => {
      console.error("Redis client error:", err);
      // Don't throw the error, just log it
      // The client will automatically try to reconnect
    });

    redisClient.on("connect", () => {
      console.log("Connected to Redis");
    });

    redisClient.on("ready", () => {
      console.log("Redis client is ready");
    });

    redisClient.on("reconnecting", () => {
      console.log("Redis client is reconnecting");
    });

    process.on("SIGINT", async () => {
      console.log("Gracefully shutting down Redis connection...");
      await closeRedisConnection();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.log("Gracefully shutting down Redis connection...");
      await closeRedisConnection();
      process.exit(0);
    });
  }

  return redisClient;
};

export const closeRedisConnection = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};

export default getRedisClient;
