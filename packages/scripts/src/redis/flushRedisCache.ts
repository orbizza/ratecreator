import { getRedisClient } from "@ratecreator/db/redis-do";

const redisFlush = async () => {
  const redis = getRedisClient();
  await redis.flushall();
};

redisFlush().catch(console.error);
