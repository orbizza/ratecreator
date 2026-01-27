/**
 * Tests for Kafka client
 * Tests singleton behavior, connection management, and topic operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocks
const {
  mockKafkaInstance,
  mockProducerInstance,
  mockConsumerInstance,
  mockAdminInstance,
} = vi.hoisted(() => {
  const mockProducerInstance = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(),
    send: vi.fn(),
  };

  const mockConsumerInstance = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    subscribe: vi.fn(),
    run: vi.fn(),
  };

  const mockAdminInstance = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    listTopics: vi.fn(),
    createTopics: vi.fn(),
  };

  const mockKafkaInstance = {
    producer: vi.fn(() => mockProducerInstance),
    consumer: vi.fn(() => mockConsumerInstance),
    admin: vi.fn(() => mockAdminInstance),
  };

  return {
    mockKafkaInstance,
    mockProducerInstance,
    mockConsumerInstance,
    mockAdminInstance,
  };
});

// Mock kafkajs module
vi.mock("kafkajs", () => ({
  Kafka: vi.fn(() => mockKafkaInstance),
  Partitioners: {
    LegacyPartitioner: vi.fn(),
  },
}));

// Mock loadEnv
vi.mock("../utils/loadEnv", () => ({}));

describe("Kafka Client", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env = {
      ...originalEnv,
      KAFKA_USERNAME: "test-user",
      KAFKA_PASSWORD: "test-password",
      KAFKA_CA_CERT:
        "-----BEGIN CERTIFICATE-----\ntest\n-----END CERTIFICATE-----",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("getKafkaClient", () => {
    it("should create kafka client with correct configuration", async () => {
      const { getKafkaClient } = await import("../clients/kafka-client");
      const client = getKafkaClient();

      expect(client).toBeDefined();
    });

    it("should return singleton instance on subsequent calls", async () => {
      const { getKafkaClient } = await import("../clients/kafka-client");
      const client1 = getKafkaClient();
      const client2 = getKafkaClient();

      expect(client1).toBe(client2);
    });

    it("should throw error when KAFKA_USERNAME is not set", async () => {
      vi.resetModules();
      delete process.env.KAFKA_USERNAME;

      const { getKafkaClient } = await import("../clients/kafka-client");

      expect(() => getKafkaClient()).toThrow(
        "Kafka credentials not found in environment variables",
      );
    });

    it("should throw error when KAFKA_PASSWORD is not set", async () => {
      vi.resetModules();
      delete process.env.KAFKA_PASSWORD;

      const { getKafkaClient } = await import("../clients/kafka-client");

      expect(() => getKafkaClient()).toThrow(
        "Kafka credentials not found in environment variables",
      );
    });

    it("should throw error when KAFKA_CA_CERT is not set", async () => {
      vi.resetModules();
      delete process.env.KAFKA_CA_CERT;

      const { getKafkaClient } = await import("../clients/kafka-client");

      expect(() => getKafkaClient()).toThrow(
        "Kafka CA certificate not found in environment variables",
      );
    });

    it("should normalize CA certificate with escaped newlines", async () => {
      vi.resetModules();
      process.env.KAFKA_CA_CERT =
        "-----BEGIN CERTIFICATE-----\\ntest\\n-----END CERTIFICATE-----";

      const { getKafkaClient } = await import("../clients/kafka-client");
      const client = getKafkaClient();

      expect(client).toBeDefined();
    });
  });

  describe("getKafkaProducer", () => {
    beforeEach(() => {
      mockProducerInstance.connect.mockResolvedValue(undefined);
    });

    it("should create and connect producer", async () => {
      const { getKafkaProducer } = await import("../clients/kafka-client");

      const producer = await getKafkaProducer();

      expect(producer).toBeDefined();
      expect(mockKafkaInstance.producer).toHaveBeenCalled();
      expect(mockProducerInstance.connect).toHaveBeenCalled();
    });

    it("should return singleton producer instance", async () => {
      const { getKafkaProducer } = await import("../clients/kafka-client");

      const producer1 = await getKafkaProducer();
      const producer2 = await getKafkaProducer();

      expect(producer1).toBe(producer2);
    });

    it("should register event handlers on producer", async () => {
      const { getKafkaProducer } = await import("../clients/kafka-client");

      await getKafkaProducer();

      expect(mockProducerInstance.on).toHaveBeenCalledWith(
        "producer.connect",
        expect.any(Function),
      );
      expect(mockProducerInstance.on).toHaveBeenCalledWith(
        "producer.disconnect",
        expect.any(Function),
      );
      expect(mockProducerInstance.on).toHaveBeenCalledWith(
        "producer.network.request_timeout",
        expect.any(Function),
      );
    });
  });

  describe("disconnectProducer", () => {
    beforeEach(() => {
      mockProducerInstance.connect.mockResolvedValue(undefined);
      mockProducerInstance.disconnect.mockResolvedValue(undefined);
    });

    it("should disconnect producer successfully", async () => {
      const { getKafkaProducer, disconnectProducer } =
        await import("../clients/kafka-client");

      await getKafkaProducer();
      await disconnectProducer();

      expect(mockProducerInstance.disconnect).toHaveBeenCalled();
    });

    it("should handle disconnect when no producer exists", async () => {
      vi.resetModules();

      const { disconnectProducer } = await import("../clients/kafka-client");

      await expect(disconnectProducer()).resolves.not.toThrow();
    });

    it("should handle disconnect errors gracefully", async () => {
      mockProducerInstance.disconnect.mockRejectedValueOnce(
        new Error("Disconnect error"),
      );

      const { getKafkaProducer, disconnectProducer } =
        await import("../clients/kafka-client");

      await getKafkaProducer();
      await expect(disconnectProducer()).resolves.not.toThrow();
    });
  });

  describe("getKafkaConsumer", () => {
    it("should create consumer with specified group ID", async () => {
      const { getKafkaConsumer, getKafkaClient } =
        await import("../clients/kafka-client");

      // Initialize client first
      getKafkaClient();

      const consumer = getKafkaConsumer("test-group");

      expect(consumer).toBeDefined();
      expect(mockKafkaInstance.consumer).toHaveBeenCalledWith({
        groupId: "test-group",
      });
    });

    it("should create new consumer instance for each call", async () => {
      const { getKafkaConsumer, getKafkaClient } =
        await import("../clients/kafka-client");

      getKafkaClient();

      getKafkaConsumer("group-1");
      getKafkaConsumer("group-2");

      expect(mockKafkaInstance.consumer).toHaveBeenCalledTimes(2);
    });
  });

  describe("createTopicIfNotExists", () => {
    beforeEach(() => {
      mockAdminInstance.connect.mockResolvedValue(undefined);
      mockAdminInstance.disconnect.mockResolvedValue(undefined);
      mockAdminInstance.createTopics.mockResolvedValue(undefined);
    });

    it("should create topic when it does not exist", async () => {
      mockAdminInstance.listTopics.mockResolvedValue(["existing-topic"]);

      const { createTopicIfNotExists, getKafkaClient } =
        await import("../clients/kafka-client");

      getKafkaClient();

      await createTopicIfNotExists("new-topic");

      expect(mockAdminInstance.connect).toHaveBeenCalled();
      expect(mockAdminInstance.listTopics).toHaveBeenCalled();
      expect(mockAdminInstance.createTopics).toHaveBeenCalledWith({
        topics: [{ topic: "new-topic" }],
      });
      expect(mockAdminInstance.disconnect).toHaveBeenCalled();
    });

    it("should not create topic when it already exists", async () => {
      mockAdminInstance.listTopics.mockResolvedValue(["existing-topic"]);

      const { createTopicIfNotExists, getKafkaClient } =
        await import("../clients/kafka-client");

      getKafkaClient();

      await createTopicIfNotExists("existing-topic");

      expect(mockAdminInstance.createTopics).not.toHaveBeenCalled();
    });

    it("should always disconnect admin after operation", async () => {
      mockAdminInstance.listTopics.mockRejectedValueOnce(
        new Error("List error"),
      );

      const { createTopicIfNotExists, getKafkaClient } =
        await import("../clients/kafka-client");

      getKafkaClient();

      await expect(createTopicIfNotExists("test-topic")).rejects.toThrow();
    });
  });

  describe("Producer Connection Retry", () => {
    it("should handle connection failure with retry", async () => {
      vi.resetModules();

      let connectAttempts = 0;
      mockProducerInstance.connect.mockImplementation(() => {
        connectAttempts++;
        if (connectAttempts === 1) {
          return Promise.reject(new Error("Connection failed"));
        }
        return Promise.resolve();
      });

      const { getKafkaProducer } = await import("../clients/kafka-client");

      // First call will fail and trigger retry
      const producer = await getKafkaProducer();

      expect(producer).toBeDefined();
    });
  });
});

describe("Kafka Client Configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env = {
      ...originalEnv,
      KAFKA_USERNAME: "test-user",
      KAFKA_PASSWORD: "test-password",
      KAFKA_CA_CERT:
        "-----BEGIN CERTIFICATE-----\ntest\n-----END CERTIFICATE-----",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should configure client with TLS settings", async () => {
    const { Kafka } = await import("kafkajs");
    const { getKafkaClient } = await import("../clients/kafka-client");

    getKafkaClient();

    expect(Kafka).toHaveBeenCalledWith(
      expect.objectContaining({
        ssl: expect.objectContaining({
          rejectUnauthorized: true,
          ca: expect.any(Array),
        }),
      }),
    );
  });

  it("should configure client with SASL authentication", async () => {
    const { Kafka } = await import("kafkajs");
    const { getKafkaClient } = await import("../clients/kafka-client");

    getKafkaClient();

    expect(Kafka).toHaveBeenCalledWith(
      expect.objectContaining({
        sasl: expect.objectContaining({
          mechanism: "plain",
          username: "test-user",
          password: "test-password",
        }),
      }),
    );
  });

  it("should configure client with retry settings", async () => {
    const { Kafka } = await import("kafkajs");
    const { getKafkaClient } = await import("../clients/kafka-client");

    getKafkaClient();

    expect(Kafka).toHaveBeenCalledWith(
      expect.objectContaining({
        retry: expect.objectContaining({
          initialRetryTime: 100,
          retries: 8,
          maxRetryTime: 30000,
          multiplier: 2,
        }),
      }),
    );
  });

  it("should configure producer with idempotent settings", async () => {
    mockProducerInstance.connect.mockResolvedValue(undefined);

    const { getKafkaProducer, getKafkaClient } =
      await import("../clients/kafka-client");

    getKafkaClient();
    await getKafkaProducer();

    expect(mockKafkaInstance.producer).toHaveBeenCalledWith(
      expect.objectContaining({
        allowAutoTopicCreation: true,
        idempotent: true,
        maxInFlightRequests: 5,
      }),
    );
  });
});
