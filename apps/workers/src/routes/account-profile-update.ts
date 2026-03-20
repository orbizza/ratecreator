import { Hono } from "hono";
import { parsePubSubMessage, getMessageId } from "../lib/message";
import { processAccountProfileUpdate } from "../processors/account-profile-update";

export const accountProfileUpdateRoute = new Hono();

accountProfileUpdateRoute.post("/", async (c) => {
  try {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      body = {};
    }

    const data = parsePubSubMessage<Record<string, unknown>>(body);
    const messageId = getMessageId(body);

    console.log(
      `Processing account-profile-update job (message: ${messageId})`,
    );

    await processAccountProfileUpdate(
      data as {
        accountId: string;
        platform: string;
        updatedFields: string[];
      },
    );

    return c.json({ success: true }, 200);
  } catch (error) {
    console.error("account-profile-update job failed:", error);
    return c.json({ error: "Processing failed" }, 500);
  }
});
