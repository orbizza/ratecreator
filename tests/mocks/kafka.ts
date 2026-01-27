/**
 * Kafka Mock
 * Provides mocked Kafka producer and consumer for testing
 */

import { vi } from "vitest";

// Track sent messages for assertions
export const sentMessages: Array<{
  topic: string;
  messages: Array<{ key?: string; value: string }>;
}> = [];

// Mock Kafka Producer
export const mockKafkaProducer = {
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  send: vi.fn(async (params: { topic: string; messages: Array<{ key?: string; value: string }> }) => {
    sentMessages.push(params);
    return [{ partition: 0, offset: "0" }];
  }),
  sendBatch: vi.fn().mockResolvedValue([{ partition: 0, offset: "0" }]),
  isIdempotent: vi.fn().mockReturnValue(false),
  events: {
    CONNECT: "producer.connect",
    DISCONNECT: "producer.disconnect",
    REQUEST: "producer.request",
    REQUEST_TIMEOUT: "producer.request_timeout",
    REQUEST_QUEUE_SIZE: "producer.request_queue_size",
  },
  on: vi.fn(),
};

// Track consumed messages for assertions
export const consumedMessages: Array<{
  topic: string;
  partition: number;
  message: { key: Buffer | null; value: Buffer | null };
}> = [];

// Mock Kafka Consumer
export const mockKafkaConsumer = {
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  subscribe: vi.fn().mockResolvedValue(undefined),
  run: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn().mockResolvedValue(undefined),
  seek: vi.fn().mockResolvedValue(undefined),
  describeGroup: vi.fn().mockResolvedValue({
    members: [],
    state: "Stable",
  }),
  pause: vi.fn(),
  resume: vi.fn(),
  events: {
    CONNECT: "consumer.connect",
    DISCONNECT: "consumer.disconnect",
    STOP: "consumer.stop",
    CRASH: "consumer.crash",
    HEARTBEAT: "consumer.heartbeat",
    COMMIT_OFFSETS: "consumer.commit_offsets",
    GROUP_JOIN: "consumer.group_join",
    FETCH: "consumer.fetch",
    START_BATCH_PROCESS: "consumer.start_batch_process",
    END_BATCH_PROCESS: "consumer.end_batch_process",
    REBALANCING: "consumer.rebalancing",
    RECEIVED_UNSUBSCRIBED_TOPICS: "consumer.received_unsubscribed_topics",
  },
  on: vi.fn(),
};

// Mock Kafka Admin
export const mockKafkaAdmin = {
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  createTopics: vi.fn().mockResolvedValue(true),
  deleteTopics: vi.fn().mockResolvedValue(undefined),
  listTopics: vi.fn().mockResolvedValue(["test-topic"]),
  fetchTopicMetadata: vi.fn().mockResolvedValue({ topics: [] }),
  fetchOffsets: vi.fn().mockResolvedValue([]),
  fetchTopicOffsets: vi.fn().mockResolvedValue([]),
};

// Mock Kafka Client
export const mockKafka = {
  producer: vi.fn().mockReturnValue(mockKafkaProducer),
  consumer: vi.fn().mockReturnValue(mockKafkaConsumer),
  admin: vi.fn().mockReturnValue(mockKafkaAdmin),
};

// Helper to simulate receiving a message
export const simulateMessage = async (
  topic: string,
  message: { key?: string; value: string },
  eachMessageHandler?: (params: {
    topic: string;
    partition: number;
    message: { key: Buffer | null; value: Buffer };
  }) => Promise<void>
) => {
  const msgPayload = {
    topic,
    partition: 0,
    message: {
      key: message.key ? Buffer.from(message.key) : null,
      value: Buffer.from(message.value),
    },
  };
  consumedMessages.push(msgPayload);
  if (eachMessageHandler) {
    await eachMessageHandler(msgPayload);
  }
};

// Reset all Kafka mocks
export const resetKafkaMocks = () => {
  sentMessages.length = 0;
  consumedMessages.length = 0;
  mockKafkaProducer.connect.mockReset().mockResolvedValue(undefined);
  mockKafkaProducer.disconnect.mockReset().mockResolvedValue(undefined);
  mockKafkaProducer.send.mockReset().mockImplementation(async (params) => {
    sentMessages.push(params);
    return [{ partition: 0, offset: "0" }];
  });
  mockKafkaConsumer.connect.mockReset().mockResolvedValue(undefined);
  mockKafkaConsumer.disconnect.mockReset().mockResolvedValue(undefined);
  mockKafkaConsumer.subscribe.mockReset().mockResolvedValue(undefined);
  mockKafkaConsumer.run.mockReset().mockResolvedValue(undefined);
};

// Get all sent messages for a specific topic
export const getMessagesByTopic = (topic: string) => {
  return sentMessages.filter((m) => m.topic === topic);
};

export default mockKafka;
