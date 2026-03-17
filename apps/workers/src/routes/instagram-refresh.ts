import { Hono } from "hono";
import {
  parsePubSubMessage,
  getMessageId,
  getMessageAttributes,
} from "../lib/message";
import { processInstagramRefresh } from "../processors/instagram-refresh";

export const instagramRefreshRoute = new Hono();

instagramRefreshRoute.post("/", async (c) => {
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

    console.log(`Processing instagram-refresh job (message: ${messageId})`);
    await processInstagramRefresh(data, attributes);
    return c.json({ success: true }, 200);
  } catch (error) {
    console.error("instagram-refresh job failed:", error);
    return c.json({ error: "Processing failed" }, 500);
  }
});
