import { Hono } from "hono";
import {
  parsePubSubMessage,
  getMessageId,
  getMessageAttributes,
} from "../lib/message";
import { processReviewCalculate } from "../processors/review-calculate";

export const reviewCalculateRoute = new Hono();

reviewCalculateRoute.post("/", async (c) => {
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

    console.log(`Processing review-calculate job (message: ${messageId})`);
    await processReviewCalculate(data, attributes);
    return c.json({ success: true }, 200);
  } catch (error) {
    console.error("review-calculate job failed:", error);
    return c.json({ error: "Processing failed" }, 500);
  }
});
