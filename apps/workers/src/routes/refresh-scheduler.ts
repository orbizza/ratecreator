import { Hono } from "hono";
import {
  triggerRefresh,
  type PlatformKey,
  PLATFORMS,
} from "../processors/refresh-scheduler";

export const refreshSchedulerRoute = new Hono();

refreshSchedulerRoute.post("/trigger/:platform", async (c) => {
  const platform = c.req.param("platform").toUpperCase() as PlatformKey;

  if (!PLATFORMS[platform]) {
    return c.json({ error: `Invalid platform: ${platform}` }, 400);
  }

  console.log(`Manual trigger received for ${platform} refresh`);

  try {
    const result = await triggerRefresh(platform);
    return c.json({ success: true, platform, ...result });
  } catch (error) {
    console.error(`Error triggering ${platform} refresh:`, error);
    return c.json({ error: `Failed to trigger ${platform} refresh` }, 500);
  }
});
