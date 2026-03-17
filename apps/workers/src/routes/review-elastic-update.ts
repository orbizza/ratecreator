import { Hono } from "hono";
import {
  parsePubSubMessage,
  getMessageId,
  getMessageAttributes,
} from "../lib/message";
import { processReviewElasticUpdate } from "../processors/review-elastic-update";

export const reviewElasticUpdateRoute = new Hono();

reviewElasticUpdateRoute.post("/", async (c) => {
  try {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      body = {};
    }
    const data = parsePubSubMessage<Record<string, unknown>>(body);
    const messageId = getMessageId(body);
    const attributes = getMessageAttributes(body);

    console.log(`Processing review-elastic-update job (message: ${messageId})`);
    await processReviewElasticUpdate(data, attributes);
    return c.json({ success: true }, 200);
  } catch (error) {
    console.error("review-elastic-update job failed:", error);
    return c.json({ error: "Processing failed" }, 500);
  }
});
