/**
 * Tests for MongoDB client
 * Tests singleton behavior and connection management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocks
const { mockMongoClient, MockMongoClient } = vi.hoisted(() => {
  const mockDb = {
    command: vi.fn(),
    collection: vi.fn(),
  };

  const mockMongoClient = {
    connect: vi.fn(),
    close: vi.fn(),
    db: vi.fn(() => mockDb),
  };

  const MockMongoClient = vi.fn(() => mockMongoClient);

  return { mockMongoClient, MockMongoClient, mockDb };
});

// Mock mongodb
vi.mock("mongodb", () => ({
  MongoClient: MockMongoClient,
}));

describe("MongoDB Client", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env = {
      ...originalEnv,
      DATABASE_URL_ONLINE:
        "mongodb+srv://test:password@cluster.mongodb.net/testdb",
      NODE_ENV: "test",
    };
    // Reset global
    delete (global as any)._mongoClientPromise;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("Client Creation", () => {
    it("should create MongoDB client with correct URI", async () => {
      mockMongoClient.connect.mockResolvedValue(mockMongoClient);

      const clientPromise = (await import("../clients/mongo-client")).default;
      await clientPromise;

      expect(MockMongoClient).toHaveBeenCalledWith(
        "mongodb+srv://test:password@cluster.mongodb.net/testdb",
        expect.objectContaining({
          connectTimeoutMS: 10000,
          socketTimeoutMS: 45000,
        }),
      );
    });

    it("should throw error when DATABASE_URL_ONLINE is not set", async () => {
      vi.resetModules();
      delete process.env.DATABASE_URL_ONLINE;

      await expect(import("../clients/mongo-client")).rejects.toThrow(
        "DATABASE_URL_ONLINE is not set",
      );
    });

    it("should connect to MongoDB", async () => {
      mockMongoClient.connect.mockResolvedValue(mockMongoClient);

      const clientPromise = (await import("../clients/mongo-client")).default;
      await clientPromise;

      expect(mockMongoClient.connect).toHaveBeenCalled();
    });

    it("should handle connection failure", async () => {
      mockMongoClient.connect.mockRejectedValue(new Error("Connection failed"));

      const clientPromise = (await import("../clients/mongo-client")).default;

      await expect(clientPromise).rejects.toThrow("Connection failed");
    });
  });

  describe("Development Mode", () => {
    it("should use global instance in development", async () => {
      vi.resetModules();
      process.env.NODE_ENV = "development";
      delete (global as any)._mongoClientPromise;

      mockMongoClient.connect.mockResolvedValue(mockMongoClient);

      await import("../clients/mongo-client");

      expect((global as any)._mongoClientPromise).toBeDefined();
    });

    it("should reuse global instance in development", async () => {
      vi.resetModules();
      process.env.NODE_ENV = "development";

      const mockClientPromise = Promise.resolve(mockMongoClient);
      (global as any)._mongoClientPromise = mockClientPromise;

      mockMongoClient.connect.mockResolvedValue(mockMongoClient);

      const { default: clientPromise } =
        await import("../clients/mongo-client");

      expect(clientPromise).toBe(mockClientPromise);
      // Should not create new client since global exists
      expect(MockMongoClient).not.toHaveBeenCalled();
    });
  });

  describe("Production Mode", () => {
    it("should create new instance in production", async () => {
      vi.resetModules();
      process.env.NODE_ENV = "production";
      delete (global as any)._mongoClientPromise;

      mockMongoClient.connect.mockResolvedValue(mockMongoClient);

      await import("../clients/mongo-client");

      expect(MockMongoClient).toHaveBeenCalled();
    });
  });

  describe("checkMongoConnection", () => {
    it("should return true when connection is successful", async () => {
      mockMongoClient.connect.mockResolvedValue(mockMongoClient);
      mockMongoClient.db().command.mockResolvedValue({ ok: 1 });

      const { checkMongoConnection } = await import("../clients/mongo-client");

      const result = await checkMongoConnection();

      expect(result).toBe(true);
      expect(mockMongoClient.db().command).toHaveBeenCalledWith({ ping: 1 });
    });

    it("should return false when connection fails", async () => {
      mockMongoClient.connect.mockResolvedValue(mockMongoClient);
      mockMongoClient.db().command.mockRejectedValue(new Error("Ping failed"));

      const { checkMongoConnection } = await import("../clients/mongo-client");

      const result = await checkMongoConnection();

      expect(result).toBe(false);
    });

    it("should log error when connection check fails", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockMongoClient.connect.mockResolvedValue(mockMongoClient);
      mockMongoClient.db().command.mockRejectedValue(new Error("Ping failed"));

      const { checkMongoConnection } = await import("../clients/mongo-client");

      await checkMongoConnection();

      expect(consoleSpy).toHaveBeenCalledWith(
        "MongoDB connection check failed:",
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Client Promise Export", () => {
    it("should export clientPromise as default", async () => {
      mockMongoClient.connect.mockResolvedValue(mockMongoClient);

      const module = await import("../clients/mongo-client");

      expect(module.default).toBeDefined();
      expect(typeof module.default.then).toBe("function");
    });

    it("should resolve to MongoClient instance", async () => {
      mockMongoClient.connect.mockResolvedValue(mockMongoClient);

      const clientPromise = (await import("../clients/mongo-client")).default;
      const client = await clientPromise;

      expect(client).toBe(mockMongoClient);
    });
  });
});

describe("MongoDB Client Configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env = {
      ...originalEnv,
      DATABASE_URL_ONLINE:
        "mongodb+srv://test:password@cluster.mongodb.net/testdb",
      NODE_ENV: "test",
    };
    delete (global as any)._mongoClientPromise;
    mockMongoClient.connect.mockResolvedValue(mockMongoClient);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("should configure connection timeout", async () => {
    const clientPromise = (await import("../clients/mongo-client")).default;
    await clientPromise;

    expect(MockMongoClient).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        connectTimeoutMS: 10000,
      }),
    );
  });

  it("should configure socket timeout", async () => {
    const clientPromise = (await import("../clients/mongo-client")).default;
    await clientPromise;

    expect(MockMongoClient).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        socketTimeoutMS: 45000,
      }),
    );
  });
});

describe("MongoDB Error Handling", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env = {
      ...originalEnv,
      DATABASE_URL_ONLINE:
        "mongodb+srv://test:password@cluster.mongodb.net/testdb",
      NODE_ENV: "test",
    };
    delete (global as any)._mongoClientPromise;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("should log error when connection fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockMongoClient.connect.mockRejectedValue(new Error("Connection refused"));

    const clientPromise = (await import("../clients/mongo-client")).default;

    await expect(clientPromise).rejects.toThrow();

    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to connect to MongoDB:",
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });

  it("should log error when DATABASE_URL is missing", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    delete process.env.DATABASE_URL_ONLINE;

    await expect(import("../clients/mongo-client")).rejects.toThrow();

    expect(consoleSpy).toHaveBeenCalledWith("DATABASE_URL_ONLINE is not set.");

    consoleSpy.mockRestore();
  });
});
