import { Hono } from "hono";
import {
  parsePubSubMessage,
  getMessageId,
  getMessageAttributes,
} from "../lib/message";
import { processCategoriseSub } from "../processors/categorise-sub";

export const categoriseSubRoute = new Hono();

categoriseSubRoute.post("/", async (c) => {
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

    console.log(`Processing categorise-sub job (message: ${messageId})`);
    await processCategoriseSub(data, attributes);
    return c.json({ success: true }, 200);
  } catch (error) {
    console.error("categorise-sub job failed:", error);
    return c.json({ error: "Processing failed" }, 500);
  }
});
