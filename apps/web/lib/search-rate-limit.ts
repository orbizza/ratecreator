import type { NextRequest } from "next/server";
import { getRedisClient } from "@ratecreator/db/redis-do";

const redis = getRedisClient();

// Public ES discovery endpoints. Per-IP cap to deter scraping while still
// letting real users (incl. anonymous landing-page visitors) hit it freely.
const SEARCH_RATE_PER_MIN = 120;
const SEARCH_RATE_WINDOW_SEC = 60;

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

export async function searchRateLimitOk(
  req: NextRequest,
  bucket: string,
): Promise<boolean> {
  const ip = clientIp(req);
  const key = `rl:search:${bucket}:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, SEARCH_RATE_WINDOW_SEC);
  }
  return count <= SEARCH_RATE_PER_MIN;
}
