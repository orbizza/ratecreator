import { Hono } from "hono";
import { processScheduledNewsletters } from "../processors/newsletter-scheduler";

export const newsletterSchedulerRoute = new Hono();

newsletterSchedulerRoute.post("/", async (c) => {
  try {
    await processScheduledNewsletters();
    return c.json({ success: true }, 200);
  } catch (error) {
    console.error("newsletter-scheduler job failed:", error);
    return c.json({ error: "Processing failed" }, 500);
  }
});
