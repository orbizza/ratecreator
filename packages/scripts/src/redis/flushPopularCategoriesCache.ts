// Load monorepo root .env so REDIS_HOST / REDIS_PASSWORD are available when
// the script is invoked via `tsx` directly (not through Next.js).
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
loadEnv({ path: resolve(__dirname, "../../../../.env") });

import { getRedisClient } from "@ratecreator/db/redis-do";

const KEYS = [
  "category-popular",
  "category-popular-accounts",
  "category-root",
  "category-all",
  "category-alphabetical",
];

const PREFIXES = ["category-accounts:", "category-single-glossary-"];

const flush = async () => {
  const redis = getRedisClient();

  for (const key of KEYS) {
    const removed = await redis.del(key);
    console.log(`del ${key} -> ${removed}`);
  }

  for (const prefix of PREFIXES) {
    const matches = await redis.keys(`${prefix}*`);
    if (matches.length === 0) continue;
    const removed = await redis.del(...matches);
    console.log(`del ${prefix}* (${matches.length} keys) -> ${removed}`);
  }

  console.log("Done.");
  process.exit(0);
};

flush().catch((err) => {
  console.error(err);
  process.exit(1);
});
