import Redis from "ioredis";

let redisClient: Redis | null = null;

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
      console.log("Connected to Redis");
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

export const closeRedisConnection = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};

export default getRedisClient;
