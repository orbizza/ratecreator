import { Hono } from "hono";
import {
  parsePubSubMessage,
  getMessageId,
  getMessageAttributes,
} from "../lib/message";
import { processTiktokRefresh } from "../processors/tiktok-refresh";

export const tiktokRefreshRoute = new Hono();

tiktokRefreshRoute.post("/", async (c) => {
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

    console.log(`Processing tiktok-refresh job (message: ${messageId})`);
    await processTiktokRefresh(data, attributes);
    return c.json({ success: true }, 200);
  } catch (error) {
    console.error("tiktok-refresh job failed:", error);
    return c.json({ error: "Processing failed" }, 500);
  }
});
