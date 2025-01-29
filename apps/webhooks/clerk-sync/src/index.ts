import { Hono } from "hono";
import {
  createTopicIfNotExists,
  getKafkaProducer,
} from "@ratecreator/db/kafka-client";
import { serve } from "@hono/node-server";
import { Webhook } from "svix";

const app = new Hono();

app.post("/webhook/clerk", async (c) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET is not set");
    return c.json({ error: "Webhook secret not configured" }, 500);
  }

  // Extract Svix headers
  const svixId = c.req.header("svix-id");
  const svixTimestamp = c.req.header("svix-timestamp");
  const svixSignature = c.req.header("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return c.json({ error: "Missing Svix headers" }, 400);
  }

  // Parse payload
  const payload = await c.req.json();
  const body = JSON.stringify(payload);

  // Verify the webhook
  const wh = new Webhook(WEBHOOK_SECRET);
  try {
    wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return c.json({ error: "Webhook verification failed" }, 400);
  }

  // Kafka integration
  const producer = getKafkaProducer();
  const { type, data } = payload;

  // Validate payload data
  if (!type || !data || !data.id) {
    return c.json({ error: "Invalid payload: Missing required fields" }, 400);
  }

  try {
    await producer.connect();

    // Ensure topic exists
    const topicName = "clerk-user-events";
    await createTopicIfNotExists(topicName);

    // Push event data to Kafka
    await producer.send({
      topic: topicName,
      messages: [
        {
          key: `${type}:${data.id}`, // Combine event type and user ID
          value: JSON.stringify(data),
        },
      ],
    });

    console.log("Event pushed to Kafka:", type);
  } catch (err) {
    console.error("Error pushing event to Kafka:", err);
    return c.json({ error: "Internal server error" }, 500);
  } finally {
    await producer.disconnect();
  }

  return c.json({ message: "Webhook processed successfully" });
});

export default app;

// Start server if this is the main module
if (require.main === module) {
  const port = process.env.PORT || 3010;
  serve({
    fetch: app.fetch.bind(app),
    port: Number(port),
  });
}
