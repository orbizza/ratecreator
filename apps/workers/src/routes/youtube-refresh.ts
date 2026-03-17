import { Hono } from "hono";
import {
  parsePubSubMessage,
  getMessageId,
  getMessageAttributes,
} from "../lib/message";
import { processYoutubeRefresh } from "../processors/youtube-refresh";

export const youtubeRefreshRoute = new Hono();

youtubeRefreshRoute.post("/", async (c) => {
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

    console.log(`Processing youtube-refresh job (message: ${messageId})`);
    await processYoutubeRefresh(data, attributes);
    return c.json({ success: true }, 200);
  } catch (error) {
    console.error("youtube-refresh job failed:", error);
    return c.json({ error: "Processing failed" }, 500);
  }
});
