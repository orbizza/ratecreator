import { Hono } from "hono";
import {
  parsePubSubMessage,
  getMessageId,
  getMessageAttributes,
} from "../lib/message";
import { processDataFetch } from "../processors/data-fetch";

export const dataFetchRoute = new Hono();

dataFetchRoute.post("/", async (c) => {
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

    console.log(`Processing data-fetch job (message: ${messageId})`);
    await processDataFetch(data, attributes);
    return c.json({ success: true }, 200);
  } catch (error) {
    console.error("data-fetch job failed:", error);
    return c.json({ error: "Processing failed" }, 500);
  }
});
