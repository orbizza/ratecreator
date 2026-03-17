import { Hono } from "hono";
import {
  parsePubSubMessage,
  getMessageId,
  getMessageAttributes,
} from "../lib/message";
import { processTranslate } from "../processors/translate";

export const translateRoute = new Hono();

translateRoute.post("/", async (c) => {
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

    console.log(`Processing translate job (message: ${messageId})`);
    await processTranslate(data, attributes);
    return c.json({ success: true }, 200);
  } catch (error) {
    console.error("translate job failed:", error);
    return c.json({ error: "Processing failed" }, 500);
  }
});
