import { Hono } from "hono";
import { getKafkaProducer } from "@ratecreator/db/kafka-client";

const app = new Hono();

app.post("/webhook/clerk", async (c) => {
  const payload = await c.req.json();
  const producer = getKafkaProducer();

  // Ensure the payload contains the necessary fields
  const { type, data } = payload;
  if (!type || !data || !data.id || !data.email) {
    return c.json({ error: "Invalid payload" }, 400);
  }

  await producer.connect();
  await producer.send({
    topic: "clerk-user-events",
    messages: [{ key: type, value: JSON.stringify(data) }],
  });
  await producer.disconnect();

  return c.json({ message: "Webhook data pushed to Kafka" });
});

export default app;
