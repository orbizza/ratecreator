/**
 * GCP Pub/Sub client implementation for Rate Creator platform
 *
 * Plain topic/subscription names — no environment suffixing.
 * Same GCP project, DB, and Redis are shared across dev/prod.
 *
 * When GCP_PROJECT_ID is not set, publish functions skip gracefully.
 * Consumer functions throw since they cannot operate without Pub/Sub.
 */

import { PubSub, Topic, Subscription, Message } from "@google-cloud/pubsub";
import "../utils/loadEnv";

let pubsubInstance: PubSub | null = null;
let pubsubUnavailable = false;

// ── Topic & Subscription constants ──────────────────────────

export const PUBSUB_TOPICS = {
  CLERK_USER_EVENTS: "clerk-user-events",
  ACCOUNT_ADDED: "account-added",
  ACCOUNT_DATA_FETCHED: "account-data-fetched",
  ACCOUNT_TRANSLATED: "account-translated",
  ACCOUNT_ROOT_CATEGORISED: "account-root-categorised",
  ACCOUNT_CATEGORISED: "account-categorised",
  NEW_REVIEW_CALCULATE: "new-review-calculate",
  NEW_REVIEW_ELASTIC_UPDATE: "new-review-elastic-update",
  DATA_REFRESH_YOUTUBE: "data-refresh-youtube",
  DATA_REFRESH_INSTAGRAM: "data-refresh-instagram",
  DATA_REFRESH_REDDIT: "data-refresh-reddit",
  DATA_REFRESH_TIKTOK: "data-refresh-tiktok",
  ACCOUNT_PROFILE_UPDATED: "account-profile-updated",
  DEAD_LETTER: "dead-letter",
} as const;

export const PUBSUB_SUBSCRIPTIONS = {
  CLERK_USER_EVENTS: "clerk-user-events-sub",
  ACCOUNT_ADDED: "account-added-sub",
  ACCOUNT_DATA_FETCHED: "account-data-fetched-sub",
  ACCOUNT_TRANSLATED: "account-translated-sub",
  ACCOUNT_ROOT_CATEGORISED: "account-root-categorised-sub",
  ACCOUNT_CATEGORISED_ELASTIC: "account-categorised-elastic-sub",
  NEW_REVIEW_CALCULATE: "new-review-calculate-sub",
  NEW_REVIEW_ELASTIC_UPDATE: "new-review-elastic-update-sub",
  DATA_REFRESH_YOUTUBE: "data-refresh-youtube-sub",
  DATA_REFRESH_INSTAGRAM: "data-refresh-instagram-sub",
  DATA_REFRESH_REDDIT: "data-refresh-reddit-sub",
  DATA_REFRESH_TIKTOK: "data-refresh-tiktok-sub",
  ACCOUNT_PROFILE_UPDATED: "account-profile-updated-sub",
} as const;

// ── Client ──────────────────────────────────────────────────

export function getPubSubClient(): PubSub | null {
  if (pubsubUnavailable) return null;

  if (!pubsubInstance) {
    const projectId = process.env.GCP_PROJECT_ID;

    if (!projectId) {
      console.warn("[pubsub] GCP_PROJECT_ID not set — Pub/Sub unavailable.");
      pubsubUnavailable = true;
      return null;
    }

    const base64Credentials = process.env.GCP_SERVICE_ACCOUNT_KEY_BASE64;

    if (base64Credentials) {
      const credentials = JSON.parse(
        Buffer.from(base64Credentials, "base64").toString("utf-8"),
      );
      pubsubInstance = new PubSub({ projectId, credentials });
    } else {
      pubsubInstance = new PubSub({ projectId });
    }

    console.log(`[pubsub] Initialized for project: ${projectId}`);
  }

  return pubsubInstance;
}

function requirePubSubClient(): PubSub {
  const client = getPubSubClient();
  if (!client) {
    throw new Error("GCP_PROJECT_ID not set. Pub/Sub is required.");
  }
  return client;
}

// ── Publishing ──────────────────────────────────────────────

export async function getPublisher(topicName: string): Promise<Topic | null> {
  const pubsub = getPubSubClient();
  if (!pubsub) return null;

  return pubsub.topic(topicName, {
    batching: { maxMessages: 100, maxMilliseconds: 100 },
    messageOrdering: true,
  });
}

export async function publishMessage(
  topicName: string,
  data: Record<string, unknown>,
  orderingKey?: string,
): Promise<string> {
  const topic = await getPublisher(topicName);
  if (!topic) {
    console.warn(`[pubsub] Skipping publish to ${topicName}`);
    return "";
  }

  return topic.publishMessage({
    data: Buffer.from(JSON.stringify(data)),
    orderingKey: orderingKey || "",
  });
}

export async function publishMessageWithKey(
  topicName: string,
  key: string,
  data: Record<string, unknown>,
): Promise<string> {
  const topic = await getPublisher(topicName);
  if (!topic) {
    console.warn(`[pubsub] Skipping publish to ${topicName}`);
    return "";
  }

  return topic.publishMessage({
    data: Buffer.from(JSON.stringify(data)),
    orderingKey: key,
    attributes: { key },
  });
}

// ── Subscribing ─────────────────────────────────────────────

export function getSubscriber(
  subscriptionName: string,
  options?: { maxMessages?: number },
): Subscription {
  const pubsub = requirePubSubClient();
  return pubsub.subscription(subscriptionName, {
    flowControl: { maxMessages: options?.maxMessages || 10 },
  });
}

export async function startSubscriber(
  subscriptionName: string,
  handler: (
    data: Record<string, unknown>,
    attributes: Record<string, string>,
  ) => Promise<void>,
  options?: { maxMessages?: number },
): Promise<Subscription> {
  const subscription = getSubscriber(subscriptionName, options);

  subscription.on("message", async (message: Message) => {
    try {
      const data = JSON.parse(message.data.toString());
      await handler(data, message.attributes);
      message.ack();
    } catch (error) {
      console.error(
        `Error processing message ${message.id} from ${subscriptionName}:`,
        error,
      );
      message.nack();
    }
  });

  subscription.on("error", (error) => {
    console.error(`Subscription ${subscriptionName} error:`, error);
  });

  console.log(`[pubsub] Subscriber started: ${subscriptionName}`);
  return subscription;
}

// ── Admin ───────────────────────────────────────────────────

export async function ensureTopicAndSubscription(
  topicName: string,
  subscriptionName: string,
  options?: {
    deadLetterTopic?: string;
    maxDeliveryAttempts?: number;
    messageRetentionDuration?: { seconds: number };
  },
): Promise<void> {
  const pubsub = requirePubSubClient();

  const [topicExists] = await pubsub.topic(topicName).exists();
  if (!topicExists) {
    await pubsub.createTopic(topicName);
    console.log(`Created topic: ${topicName}`);
  }

  const [subExists] = await pubsub.subscription(subscriptionName).exists();
  if (!subExists) {
    const subOptions: Record<string, unknown> = {
      ackDeadlineSeconds: 60,
      enableMessageOrdering: true,
    };

    if (options?.messageRetentionDuration) {
      subOptions.messageRetentionDuration = options.messageRetentionDuration;
    }

    if (options?.deadLetterTopic) {
      subOptions.deadLetterPolicy = {
        deadLetterTopic: `projects/${process.env.GCP_PROJECT_ID}/topics/${options.deadLetterTopic}`,
        maxDeliveryAttempts: options.maxDeliveryAttempts || 5,
      };
    }

    await pubsub.createSubscription(topicName, subscriptionName, subOptions);
    console.log(`Created subscription: ${subscriptionName}`);
  }
}

export async function closePubSubClient(): Promise<void> {
  if (pubsubInstance) {
    await pubsubInstance.close();
    pubsubInstance = null;
    console.log("[pubsub] Client closed");
  }
}
