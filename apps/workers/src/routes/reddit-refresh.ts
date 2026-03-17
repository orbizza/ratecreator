import { Hono } from "hono";
import {
  parsePubSubMessage,
  getMessageId,
  getMessageAttributes,
} from "../lib/message";
import { processRedditRefresh } from "../processors/reddit-refresh";

export const redditRefreshRoute = new Hono();

redditRefreshRoute.post("/", async (c) => {
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

    console.log(`Processing reddit-refresh job (message: ${messageId})`);
    await processRedditRefresh(data, attributes);
    return c.json({ success: true }, 200);
  } catch (error) {
    console.error("reddit-refresh job failed:", error);
    return c.json({ error: "Processing failed" }, 500);
  }
});
