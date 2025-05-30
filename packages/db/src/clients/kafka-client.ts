/**
 * @fileoverview Kafka client implementation for Rate Creator platform
 * @module clients/kafka-client
 * @description Provides a singleton client for interacting with Kafka message broker,
 * handling message publishing, consumption, and topic management.
 */

import { Kafka, Producer, Consumer, Admin, Partitioners } from "kafkajs";
import "../utils/loadEnv";

/**
 * Singleton instance of the Kafka client
 * @private
 */
let kafkaInstance: Kafka | null = null;

/**
 * Singleton instance of the Kafka producer
 * @private
 */
let producerInstance: Producer | null = null;

/**
 * Promise tracking the producer connection status
 * @private
 */
let producerConnectPromise: Promise<void> | null = null;

/**
 * Returns a singleton instance of the Kafka client
 * @returns {Kafka} The Kafka client instance
 * @throws {Error} If Kafka credentials are not configured
 */
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

/**
 * Connects the Kafka producer with retry logic
 * @param {Producer} producer - The Kafka producer instance
 * @returns {Promise<void>} Promise that resolves when the producer is connected
 * @private
 */
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

/**
 * Returns a singleton instance of the Kafka producer
 * @returns {Promise<Producer>} The Kafka producer instance
 * @throws {Error} If producer initialization fails
 */
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

/**
 * Disconnects the Kafka producer
 * @returns {Promise<void>} Promise that resolves when the producer is disconnected
 */
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

/**
 * Returns a new Kafka consumer instance
 * @param {string} groupId - The consumer group ID
 * @returns {Consumer} The Kafka consumer instance
 */
export function getKafkaConsumer(groupId: string): Consumer {
  return getKafkaClient().consumer({ groupId });
}

/**
 * Creates a Kafka topic if it doesn't exist
 * @param {string} topicName - The name of the topic to create
 * @returns {Promise<void>} Promise that resolves when the topic is created
 * @throws {Error} If topic creation fails
 */
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
