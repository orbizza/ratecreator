import { Kafka, Producer, Consumer, Admin, Partitioners } from "kafkajs";
import "../utils/loadEnv";

let kafkaInstance: Kafka | null = null;
let producerInstance: Producer | null = null;
let producerConnectPromise: Promise<void> | null = null;

export function getKafkaClient(): Kafka {
  if (!kafkaInstance) {
    // Validate required environment variables
    if (!process.env.KAFKA_USERNAME || !process.env.KAFKA_PASSWORD) {
      throw new Error("Kafka credentials not found in environment variables");
    }
    if (!process.env.KAFKA_CA_CERT) {
      throw new Error(
        "Kafka CA certificate not found in environment variables",
      );
    }

    kafkaInstance = new Kafka({
      clientId: "ratecreator-app",
      brokers: [
        "db-kafka-nyc3-91394-do-user-17726573-0.j.db.ondigitalocean.com:25073",
      ],
      ssl: {
        rejectUnauthorized: true, // Enable certificate validation
        ca: [process.env.KAFKA_CA_CERT],
      },
      sasl: {
        mechanism: "plain",
        username: process.env.KAFKA_USERNAME,
        password: process.env.KAFKA_PASSWORD,
      },
      connectionTimeout: 30000,
      retry: {
        initialRetryTime: 100,
        retries: 15, // Increased retries
        maxRetryTime: 30000,
        factor: 0.2, // Exponential backoff factor
        multiplier: 2, // Retry time multiplier
      },
      requestTimeout: 30000, // Reduced from 60s to 30s
    });
  }
  return kafkaInstance;
}

async function connectProducer(producer: Producer): Promise<void> {
  if (!producerConnectPromise) {
    producerConnectPromise = producer
      .connect()
      .then(() => {
        console.log("✅ Producer connected successfully");
      })
      .catch(async (error) => {
        console.error("❌ Producer connection failed:", error.message);
        producerConnectPromise = null;
        producerInstance = null;

        // Implement exponential backoff
        const backoff = Math.floor(Math.random() * 10) * 1000; // Random backoff between 0-10 seconds
        console.log(`Retrying connection in ${backoff / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, backoff));
        await getKafkaProducer();
      });
  }
  return producerConnectPromise;
}

export async function getKafkaProducer(): Promise<Producer> {
  if (!producerInstance) {
    producerInstance = getKafkaClient().producer({
      allowAutoTopicCreation: true,
      retry: {
        initialRetryTime: 100,
        retries: 8,
        maxRetryTime: 30000,
      },
      createPartitioner: Partitioners.LegacyPartitioner,
      idempotent: true, // Enable exactly-once delivery semantics
    });

    // Add connection error handlers
    producerInstance.on("producer.connect", () => {
      console.log("✅ Kafka Producer connected successfully");
    });

    producerInstance.on("producer.disconnect", async () => {
      console.warn(
        "⚠️ Kafka Producer disconnected! Attempting reconnection...",
      );
      producerConnectPromise = null;
      await connectProducer(producerInstance!);
    });

    producerInstance.on("producer.network.request_timeout", async (error) => {
      console.error("❌ Producer network timeout:", error);
      producerConnectPromise = null;
      await connectProducer(producerInstance!);
    });

    await connectProducer(producerInstance);
  } else if (!producerConnectPromise) {
    await connectProducer(producerInstance);
  }

  return producerInstance;
}

export async function disconnectProducer() {
  if (producerInstance) {
    try {
      await producerInstance.disconnect();
      console.log("Producer disconnected successfully");
    } catch (error) {
      console.error("Error disconnecting producer:", error);
    }
    producerInstance = null;
    producerConnectPromise = null;
  }
}

export function getKafkaConsumer(groupId: string): Consumer {
  return getKafkaClient().consumer({ groupId });
}

export async function createTopicIfNotExists(topicName: string) {
  const kafka = getKafkaClient();
  const admin: Admin = kafka.admin();
  await admin.connect();

  const topics = await admin.listTopics();
  if (!topics.includes(topicName)) {
    await admin.createTopics({
      topics: [{ topic: topicName }],
    });
    console.log(`Topic ${topicName} created.`);
  } else {
    console.log(`Topic ${topicName} already exists.`);
  }

  await admin.disconnect();
}
