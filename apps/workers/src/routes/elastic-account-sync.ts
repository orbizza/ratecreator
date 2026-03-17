import { Hono } from "hono";
import {
  parsePubSubMessage,
  getMessageId,
  getMessageAttributes,
} from "../lib/message";
import { processElasticAccountSync } from "../processors/elastic-account-sync";

export const elasticAccountSyncRoute = new Hono();

elasticAccountSyncRoute.post("/", async (c) => {
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

    console.log(`Processing elastic-account-sync job (message: ${messageId})`);
    await processElasticAccountSync(data, attributes);
    return c.json({ success: true }, 200);
  } catch (error) {
    console.error("elastic-account-sync job failed:", error);
    return c.json({ error: "Processing failed" }, 500);
  }
});
