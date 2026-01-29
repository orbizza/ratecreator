/**
 * Tests for Redis client
 * Tests singleton behavior and connection management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocks
const { mockRedisInstance, MockRedis } = vi.hoisted(() => {
  const mockRedisInstance = {
    on: vi.fn(),
    quit: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
    keys: vi.fn(),
    hget: vi.fn(),
    hset: vi.fn(),
    hdel: vi.fn(),
    hgetall: vi.fn(),
    expire: vi.fn(),
  };

  const MockRedis = vi.fn(() => mockRedisInstance);

  return { mockRedisInstance, MockRedis };
});

// Mock ioredis
vi.mock("ioredis", () => ({
  default: MockRedis,
}));

describe("Redis Client", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env = {
      ...originalEnv,
      REDIS_HOST: "test-redis-host",
      REDIS_PORT: "6379",
      REDIS_USERNAME: "test-user",
      REDIS_PASSWORD: "test-password",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("getRedisClient", () => {
    it("should create redis client with correct configuration", async () => {
      const { getRedisClient } = await import("../clients/redis-do");
      const client = getRedisClient();

      expect(client).toBeDefined();
      expect(MockRedis).toHaveBeenCalledWith({
        host: "test-redis-host",
        port: 6379,
        username: "test-user",
        password: "test-password",
        tls: {},
      });
    });

    it("should return singleton instance on subsequent calls", async () => {
      const { getRedisClient } = await import("../clients/redis-do");

      const client1 = getRedisClient();
      const client2 = getRedisClient();

      expect(client1).toBe(client2);
      expect(MockRedis).toHaveBeenCalledTimes(1);
    });

    it("should register error event handler", async () => {
      const { getRedisClient } = await import("../clients/redis-do");
      getRedisClient();

      expect(mockRedisInstance.on).toHaveBeenCalledWith(
        "error",
        expect.any(Function),
      );
    });

    it("should register connect event handler", async () => {
      const { getRedisClient } = await import("../clients/redis-do");
      getRedisClient();

      expect(mockRedisInstance.on).toHaveBeenCalledWith(
        "connect",
        expect.any(Function),
      );
    });

    it("should use default port when REDIS_PORT is not set", async () => {
      vi.resetModules();
      delete process.env.REDIS_PORT;

      const { getRedisClient } = await import("../clients/redis-do");
      getRedisClient();

      expect(MockRedis).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 6379,
        }),
      );
    });

    it("should use empty strings when credentials are not set", async () => {
      vi.resetModules();
      delete process.env.REDIS_HOST;
      delete process.env.REDIS_USERNAME;
      delete process.env.REDIS_PASSWORD;

      const { getRedisClient } = await import("../clients/redis-do");
      getRedisClient();

      expect(MockRedis).toHaveBeenCalledWith(
        expect.objectContaining({
          host: "",
          username: "",
          password: "",
        }),
      );
    });
  });

  describe("closeRedisConnection", () => {
    beforeEach(() => {
      mockRedisInstance.quit.mockResolvedValue(undefined);
    });

    it("should close redis connection successfully", async () => {
      const { getRedisClient, closeRedisConnection } =
        await import("../clients/redis-do");

      getRedisClient();
      await closeRedisConnection();

      expect(mockRedisInstance.quit).toHaveBeenCalled();
    });

    it("should handle close when no client exists", async () => {
      vi.resetModules();

      const { closeRedisConnection } = await import("../clients/redis-do");

      await expect(closeRedisConnection()).resolves.not.toThrow();
    });

    it("should allow creating new client after close", async () => {
      const { getRedisClient, closeRedisConnection } =
        await import("../clients/redis-do");

      getRedisClient();
      await closeRedisConnection();

      vi.resetModules();
      const { getRedisClient: getRedisClient2 } =
        await import("../clients/redis-do");

      const newClient = getRedisClient2();
      expect(newClient).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should log error when error event is emitted", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { getRedisClient } = await import("../clients/redis-do");
      getRedisClient();

      // Find the error handler and call it
      const errorHandler = mockRedisInstance.on.mock.calls.find(
        (call) => call[0] === "error",
      )?.[1];

      expect(errorHandler).toBeDefined();
      errorHandler(new Error("Test error"));

      expect(consoleSpy).toHaveBeenCalledWith(
        "Redis client error:",
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Default Export", () => {
    it("should export getRedisClient as default", async () => {
      const module = await import("../clients/redis-do");

      expect(module.default).toBeDefined();
      expect(module.default).toBe(module.getRedisClient);
    });
  });
});

describe("Redis Client Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.REDIS_HOST = "test-host";
    process.env.REDIS_PORT = "6379";
    process.env.REDIS_USERNAME = "test-user";
    process.env.REDIS_PASSWORD = "test-password";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should support get operation", async () => {
    mockRedisInstance.get.mockResolvedValue("test-value");

    const { getRedisClient } = await import("../clients/redis-do");
    const client = getRedisClient();

    const result = await client.get("test-key");

    expect(mockRedisInstance.get).toHaveBeenCalledWith("test-key");
    expect(result).toBe("test-value");
  });

  it("should support set operation", async () => {
    mockRedisInstance.set.mockResolvedValue("OK");

    const { getRedisClient } = await import("../clients/redis-do");
    const client = getRedisClient();

    await client.set("test-key", "test-value");

    expect(mockRedisInstance.set).toHaveBeenCalledWith(
      "test-key",
      "test-value",
    );
  });

  it("should support setex operation with TTL", async () => {
    mockRedisInstance.setex.mockResolvedValue("OK");

    const { getRedisClient } = await import("../clients/redis-do");
    const client = getRedisClient();

    await client.setex("test-key", 3600, "test-value");

    expect(mockRedisInstance.setex).toHaveBeenCalledWith(
      "test-key",
      3600,
      "test-value",
    );
  });

  it("should support del operation", async () => {
    mockRedisInstance.del.mockResolvedValue(1);

    const { getRedisClient } = await import("../clients/redis-do");
    const client = getRedisClient();

    await client.del("test-key");

    expect(mockRedisInstance.del).toHaveBeenCalledWith("test-key");
  });

  it("should support hash operations", async () => {
    mockRedisInstance.hset.mockResolvedValue(1);
    mockRedisInstance.hget.mockResolvedValue("field-value");
    mockRedisInstance.hgetall.mockResolvedValue({ field1: "value1" });

    const { getRedisClient } = await import("../clients/redis-do");
    const client = getRedisClient();

    await client.hset("hash-key", "field", "value");
    await client.hget("hash-key", "field");
    await client.hgetall("hash-key");

    expect(mockRedisInstance.hset).toHaveBeenCalled();
    expect(mockRedisInstance.hget).toHaveBeenCalled();
    expect(mockRedisInstance.hgetall).toHaveBeenCalled();
  });
});
