import { Hono } from "hono";
import {
  createTopicIfNotExists,
  getKafkaProducer,
} from "@ratecreator/db/src/clients/kafka-client";
import { serve } from "@hono/node-server";

const app = new Hono();

app.post("/webhook/clerk", async (c) => {
  const payload = await c.req.json();
  const producer = getKafkaProducer();

  const { type, data } = payload;
  if (!type || !data || !data.id || !data.email) {
    return c.json({ error: "Invalid payload" }, 400);
  }

  await producer.connect();
  await createTopicIfNotExists("clerk-user-events");
  await producer.send({
    topic: "clerk-user-events",
    messages: [{ key: type, value: JSON.stringify(data) }],
  });
  await producer.disconnect();

  return c.json({ message: "Webhook data pushed to Kafka" });
});

export default app;

// Use CommonJS check for main module
if (require.main === module) {
  const port = process.env.PORT || 3010;
  serve({
    fetch: app.fetch.bind(app),
    port: Number(port),
  });
}
