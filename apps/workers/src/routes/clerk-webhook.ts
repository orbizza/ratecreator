import { Hono } from "hono";
import { Webhook } from "svix";
import { publishMessageWithKey } from "@ratecreator/db/pubsub-client";

const clerkWebhookRoute = new Hono();

const MAX_BODY_BYTES = 1024 * 100; // 100 KiB — Clerk webhooks are typically <10 KiB

clerkWebhookRoute.post("/", async (c) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET is not set");
    return c.json({ error: "Webhook secret not configured" }, 500);
  }

  // Refuse oversized bodies before reading them — protects worker memory.
  const contentLength = Number(c.req.header("content-length") || "0");
  if (contentLength > MAX_BODY_BYTES) {
    return c.json({ error: "Payload too large" }, 413);
  }

  // Extract Svix headers
  const svixId = c.req.header("svix-id");
  const svixTimestamp = c.req.header("svix-timestamp");
  const svixSignature = c.req.header("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return c.json({ error: "Missing Svix headers" }, 400);
  }

  // CRITICAL: Svix verifies the *raw* HTTP body. JSON.parse + JSON.stringify
  // does NOT preserve byte-equality (whitespace, key ordering, BigInt, unicode
  // escapes), so verify against the raw text and only then parse.
  const rawBody = await c.req.text();

  const wh = new Webhook(WEBHOOK_SECRET);
  try {
    wh.verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return c.json({ error: "Webhook verification failed" }, 400);
  }

  let payload: { type?: string; data?: { id?: string } };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  const { type, data } = payload;

  if (!type || !data || !data.id) {
    return c.json({ error: "Invalid payload: Missing required fields" }, 400);
  }

  try {
    await publishMessageWithKey(
      "clerk-user-events",
      `${type}:${data.id}`,
      data,
    );
    console.log("Clerk webhook event pushed to Pub/Sub:", type);
  } catch (err) {
    console.error("Error pushing clerk event to Pub/Sub:", err);
    return c.json({ error: "Internal server error" }, 500);
  }

  return c.json({ message: "Webhook processed successfully" });
});

export { clerkWebhookRoute };
