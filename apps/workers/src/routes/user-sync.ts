import { Hono } from "hono";
import {
  parsePubSubMessage,
  getMessageId,
  getMessageAttributes,
} from "../lib/message";
import { processUserSync } from "../processors/user-sync";

export const userSyncRoute = new Hono();

userSyncRoute.post("/", async (c) => {
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

    console.log(`Processing user-sync job (message: ${messageId})`);
    await processUserSync(data, attributes);
    return c.json({ success: true }, 200);
  } catch (error) {
    console.error("user-sync job failed:", error);
    return c.json({ error: "Processing failed" }, 500);
  }
});
