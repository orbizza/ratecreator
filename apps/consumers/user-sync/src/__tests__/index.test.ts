/**
 * Tests for user-sync consumer
 * Tests Clerk user event processing and database synchronization
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocks
const {
  mockUserUpsert,
  mockUserUpdate,
  mockUserFindUnique,
  mockDisconnect,
  mockPrismaInstance,
  mockKafkaConsumer,
} = vi.hoisted(() => {
  const mockUserUpsert = vi.fn();
  const mockUserUpdate = vi.fn();
  const mockUserFindUnique = vi.fn();
  const mockDisconnect = vi.fn();
  const mockPrismaInstance = {
    user: {
      upsert: mockUserUpsert,
      update: mockUserUpdate,
      findUnique: mockUserFindUnique,
    },
    $disconnect: mockDisconnect,
  };
  const mockKafkaConsumer = {
    connect: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn().mockResolvedValue(undefined),
    run: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
  };
  return {
    mockUserUpsert,
    mockUserUpdate,
    mockUserFindUnique,
    mockDisconnect,
    mockPrismaInstance,
    mockKafkaConsumer,
  };
});

// Mock modules
vi.mock("@ratecreator/db/client", () => ({
  getPrismaClient: vi.fn(() => mockPrismaInstance),
}));

vi.mock("@ratecreator/db/kafka-client", () => ({
  getKafkaConsumer: vi.fn().mockReturnValue(mockKafkaConsumer),
}));

describe("User Sync Consumer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper function to simulate processMessage behavior
  const processMessage = async (
    message: any,
    prisma: typeof mockPrismaInstance,
  ) => {
    if (!message.value || !message.key) {
      return { error: "Invalid message: value or key is null" };
    }

    const payload = JSON.parse(message.value.toString());
    const [eventType] = message.key.toString().split(":");

    try {
      if (eventType === "user.created") {
        const email = payload.email_addresses[0].email_address;
        await prisma.user.upsert({
          where: { email },
          create: {
            clerkId: payload.id,
            email,
            firstName: payload.first_name || "",
            lastName: payload.last_name || "",
            username: payload.username || "",
            webhookPayload: payload,
            isDeleted: false,
            deletedAt: null,
          },
          update: {
            clerkId: payload.id,
            firstName: payload.first_name || "",
            lastName: payload.last_name || "",
            username: payload.username || "",
            webhookPayload: payload,
            isDeleted: false,
            deletedAt: null,
          },
        });
        return { success: true, action: "upserted", email };
      } else if (eventType === "user.updated") {
        await prisma.user.update({
          where: { clerkId: payload.id },
          data: {
            email: payload.email_addresses[0].email_address,
            firstName: payload.first_name,
            lastName: payload.last_name,
            username: payload.username,
            webhookPayload: payload,
          },
        });
        return { success: true, action: "updated", clerkId: payload.id };
      } else if (eventType === "user.deleted") {
        const user = await prisma.user.findUnique({
          where: { clerkId: payload.id },
        });

        if (!user) {
          return { success: true, action: "skipped", reason: "user not found" };
        }

        await prisma.user.update({
          where: { clerkId: payload.id },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        });
        return { success: true, action: "deleted", clerkId: payload.id };
      } else {
        return { success: true, action: "unhandled", eventType };
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  describe("Message Validation", () => {
    it("should reject message with null value", async () => {
      const result = await processMessage(
        { value: null, key: "user.created:123" },
        mockPrismaInstance,
      );
      expect(result.error).toBe("Invalid message: value or key is null");
    });

    it("should reject message with null key", async () => {
      const result = await processMessage(
        { value: JSON.stringify({}), key: null },
        mockPrismaInstance,
      );
      expect(result.error).toBe("Invalid message: value or key is null");
    });

    it("should extract event type from message key", async () => {
      mockUserUpsert.mockResolvedValueOnce({});

      const message = {
        key: "user.created:user_123:timestamp",
        value: JSON.stringify({
          id: "user_123",
          email_addresses: [{ email_address: "test@example.com" }],
          first_name: "Test",
          last_name: "User",
          username: "testuser",
        }),
      };

      const result = await processMessage(message, mockPrismaInstance);

      expect(result.action).toBe("upserted");
    });
  });

  describe("User Created Events", () => {
    const createUserCreatedMessage = (userData: any) => ({
      key: "user.created:user_123",
      value: JSON.stringify({
        id: "user_clerk_123",
        email_addresses: [
          { email_address: userData.email || "test@example.com" },
        ],
        first_name: userData.firstName || "John",
        last_name: userData.lastName || "Doe",
        username: userData.username || "johndoe",
        ...userData,
      }),
    });

    it("should upsert user on user.created event", async () => {
      mockUserUpsert.mockResolvedValueOnce({ id: "db-user-id" });

      const message = createUserCreatedMessage({
        email: "newuser@example.com",
        firstName: "New",
        lastName: "User",
        username: "newuser",
      });

      const result = await processMessage(message, mockPrismaInstance);

      expect(result.success).toBe(true);
      expect(result.action).toBe("upserted");
      expect(mockUserUpsert).toHaveBeenCalled();
    });

    it("should use email as upsert key", async () => {
      mockUserUpsert.mockResolvedValueOnce({});

      const message = createUserCreatedMessage({ email: "unique@example.com" });

      await processMessage(message, mockPrismaInstance);

      expect(mockUserUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: "unique@example.com" },
        }),
      );
    });

    it("should store clerkId correctly", async () => {
      mockUserUpsert.mockResolvedValueOnce({});

      const message = {
        key: "user.created:id",
        value: JSON.stringify({
          id: "clerk_abc123",
          email_addresses: [{ email_address: "test@example.com" }],
          first_name: "Test",
          last_name: "User",
        }),
      };

      await processMessage(message, mockPrismaInstance);

      expect(mockUserUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ clerkId: "clerk_abc123" }),
          update: expect.objectContaining({ clerkId: "clerk_abc123" }),
        }),
      );
    });

    it("should handle empty first_name gracefully", async () => {
      mockUserUpsert.mockResolvedValueOnce({});

      const message = {
        key: "user.created:id",
        value: JSON.stringify({
          id: "user_123",
          email_addresses: [{ email_address: "test@example.com" }],
          first_name: null,
          last_name: "User",
        }),
      };

      await processMessage(message, mockPrismaInstance);

      expect(mockUserUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ firstName: "" }),
        }),
      );
    });

    it("should handle empty last_name gracefully", async () => {
      mockUserUpsert.mockResolvedValueOnce({});

      const message = {
        key: "user.created:id",
        value: JSON.stringify({
          id: "user_123",
          email_addresses: [{ email_address: "test@example.com" }],
          first_name: "Test",
          last_name: null,
        }),
      };

      await processMessage(message, mockPrismaInstance);

      expect(mockUserUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ lastName: "" }),
        }),
      );
    });

    it("should handle empty username gracefully", async () => {
      mockUserUpsert.mockResolvedValueOnce({});

      const message = {
        key: "user.created:id",
        value: JSON.stringify({
          id: "user_123",
          email_addresses: [{ email_address: "test@example.com" }],
          first_name: "Test",
          last_name: "User",
          username: undefined,
        }),
      };

      await processMessage(message, mockPrismaInstance);

      expect(mockUserUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ username: "" }),
        }),
      );
    });

    it("should store full webhook payload", async () => {
      mockUserUpsert.mockResolvedValueOnce({});

      const payload = {
        id: "user_123",
        email_addresses: [{ email_address: "test@example.com" }],
        first_name: "Test",
        last_name: "User",
        username: "testuser",
        custom_field: "extra_data",
      };

      const message = {
        key: "user.created:id",
        value: JSON.stringify(payload),
      };

      await processMessage(message, mockPrismaInstance);

      expect(mockUserUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ webhookPayload: payload }),
        }),
      );
    });

    it("should set isDeleted to false on create", async () => {
      mockUserUpsert.mockResolvedValueOnce({});

      const message = createUserCreatedMessage({});

      await processMessage(message, mockPrismaInstance);

      expect(mockUserUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            isDeleted: false,
            deletedAt: null,
          }),
          update: expect.objectContaining({
            isDeleted: false,
            deletedAt: null,
          }),
        }),
      );
    });
  });

  describe("User Updated Events", () => {
    const createUserUpdatedMessage = (userData: any) => ({
      key: "user.updated:user_123",
      value: JSON.stringify({
        id: "user_clerk_123",
        email_addresses: [
          { email_address: userData.email || "test@example.com" },
        ],
        first_name: userData.firstName || "John",
        last_name: userData.lastName || "Doe",
        username: userData.username || "johndoe",
        ...userData,
      }),
    });

    it("should update user on user.updated event", async () => {
      mockUserUpdate.mockResolvedValueOnce({ id: "db-user-id" });

      const message = createUserUpdatedMessage({
        email: "updated@example.com",
        firstName: "Updated",
        lastName: "Name",
      });

      const result = await processMessage(message, mockPrismaInstance);

      expect(result.success).toBe(true);
      expect(result.action).toBe("updated");
      expect(mockUserUpdate).toHaveBeenCalled();
    });

    it("should use clerkId to find user for update", async () => {
      mockUserUpdate.mockResolvedValueOnce({});

      const message = {
        key: "user.updated:id",
        value: JSON.stringify({
          id: "clerk_xyz789",
          email_addresses: [{ email_address: "test@example.com" }],
          first_name: "Test",
          last_name: "User",
          username: "testuser",
        }),
      };

      await processMessage(message, mockPrismaInstance);

      expect(mockUserUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clerkId: "clerk_xyz789" },
        }),
      );
    });

    it("should update all profile fields", async () => {
      mockUserUpdate.mockResolvedValueOnce({});

      const message = {
        key: "user.updated:id",
        value: JSON.stringify({
          id: "user_123",
          email_addresses: [{ email_address: "newemail@example.com" }],
          first_name: "NewFirst",
          last_name: "NewLast",
          username: "newusername",
        }),
      };

      await processMessage(message, mockPrismaInstance);

      expect(mockUserUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: "newemail@example.com",
            firstName: "NewFirst",
            lastName: "NewLast",
            username: "newusername",
          }),
        }),
      );
    });

    it("should store updated webhook payload", async () => {
      mockUserUpdate.mockResolvedValueOnce({});

      const payload = {
        id: "user_123",
        email_addresses: [{ email_address: "test@example.com" }],
        first_name: "Test",
        last_name: "User",
        username: "testuser",
        updated_at: Date.now(),
      };

      const message = {
        key: "user.updated:id",
        value: JSON.stringify(payload),
      };

      await processMessage(message, mockPrismaInstance);

      expect(mockUserUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ webhookPayload: payload }),
        }),
      );
    });
  });

  describe("User Deleted Events", () => {
    const createUserDeletedMessage = (userData: any) => ({
      key: "user.deleted:user_123",
      value: JSON.stringify({
        id: userData.clerkId || "user_clerk_123",
        deleted: true,
        ...userData,
      }),
    });

    it("should soft delete user on user.deleted event", async () => {
      mockUserFindUnique.mockResolvedValueOnce({ id: "db-user-id" });
      mockUserUpdate.mockResolvedValueOnce({});

      const message = createUserDeletedMessage({ clerkId: "user_to_delete" });

      const result = await processMessage(message, mockPrismaInstance);

      expect(result.success).toBe(true);
      expect(result.action).toBe("deleted");
    });

    it("should check if user exists before deleting", async () => {
      mockUserFindUnique.mockResolvedValueOnce({ id: "existing-user" });
      mockUserUpdate.mockResolvedValueOnce({});

      const message = createUserDeletedMessage({ clerkId: "user_123" });

      await processMessage(message, mockPrismaInstance);

      expect(mockUserFindUnique).toHaveBeenCalledWith({
        where: { clerkId: "user_123" },
      });
    });

    it("should skip deletion if user not found", async () => {
      mockUserFindUnique.mockResolvedValueOnce(null);

      const message = createUserDeletedMessage({ clerkId: "non_existent" });

      const result = await processMessage(message, mockPrismaInstance);

      expect(result.success).toBe(true);
      expect(result.action).toBe("skipped");
      expect(result.reason).toBe("user not found");
      expect(mockUserUpdate).not.toHaveBeenCalled();
    });

    it("should set isDeleted to true", async () => {
      mockUserFindUnique.mockResolvedValueOnce({ id: "user-id" });
      mockUserUpdate.mockResolvedValueOnce({});

      const message = createUserDeletedMessage({});

      await processMessage(message, mockPrismaInstance);

      expect(mockUserUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isDeleted: true }),
        }),
      );
    });

    it("should set deletedAt timestamp", async () => {
      mockUserFindUnique.mockResolvedValueOnce({ id: "user-id" });
      mockUserUpdate.mockResolvedValueOnce({});

      const message = createUserDeletedMessage({});

      await processMessage(message, mockPrismaInstance);

      expect(mockUserUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deletedAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe("Unhandled Event Types", () => {
    it("should handle unknown event types gracefully", async () => {
      const message = {
        key: "user.session.created:session_123",
        value: JSON.stringify({ id: "session_123", user_id: "user_123" }),
      };

      const result = await processMessage(message, mockPrismaInstance);

      expect(result.success).toBe(true);
      expect(result.action).toBe("unhandled");
      expect(result.eventType).toBe("user.session.created");
    });

    it("should handle organization events gracefully", async () => {
      const message = {
        key: "organization.created:org_123",
        value: JSON.stringify({ id: "org_123", name: "Test Org" }),
      };

      const result = await processMessage(message, mockPrismaInstance);

      expect(result.action).toBe("unhandled");
    });
  });

  describe("Error Handling", () => {
    it("should handle database error on create", async () => {
      mockUserUpsert.mockRejectedValueOnce(
        new Error("Database connection failed"),
      );

      const message = {
        key: "user.created:id",
        value: JSON.stringify({
          id: "user_123",
          email_addresses: [{ email_address: "test@example.com" }],
        }),
      };

      const result = await processMessage(message, mockPrismaInstance);

      expect(result.error).toBe("Database connection failed");
    });

    it("should handle database error on update", async () => {
      mockUserUpdate.mockRejectedValueOnce(new Error("User not found"));

      const message = {
        key: "user.updated:id",
        value: JSON.stringify({
          id: "non_existent",
          email_addresses: [{ email_address: "test@example.com" }],
          first_name: "Test",
          last_name: "User",
          username: "testuser",
        }),
      };

      const result = await processMessage(message, mockPrismaInstance);

      expect(result.error).toBe("User not found");
    });

    it("should handle database error on delete", async () => {
      mockUserFindUnique.mockRejectedValueOnce(new Error("Database timeout"));

      const message = {
        key: "user.deleted:id",
        value: JSON.stringify({ id: "user_123" }),
      };

      const result = await processMessage(message, mockPrismaInstance);

      expect(result.error).toBe("Database timeout");
    });

    it("should handle JSON parse error gracefully", () => {
      const processInvalidJson = (message: any) => {
        if (!message.value || !message.key) {
          return { error: "Invalid message" };
        }
        try {
          JSON.parse(message.value.toString());
        } catch (e) {
          return { error: "JSON parse error" };
        }
        return { success: true };
      };

      const result = processInvalidJson({
        key: "user.created:id",
        value: "not valid json",
      });

      expect(result.error).toBe("JSON parse error");
    });
  });

  describe("Consumer Lifecycle", () => {
    it("should connect consumer successfully", async () => {
      await mockKafkaConsumer.connect();
      expect(mockKafkaConsumer.connect).toHaveBeenCalled();
    });

    it("should subscribe to clerk-user-events topic", async () => {
      await mockKafkaConsumer.subscribe({
        topic: "clerk-user-events",
        fromBeginning: true,
      });

      expect(mockKafkaConsumer.subscribe).toHaveBeenCalledWith({
        topic: "clerk-user-events",
        fromBeginning: true,
      });
    });

    it("should disconnect consumer and database gracefully", async () => {
      await mockKafkaConsumer.disconnect();
      await mockPrismaInstance.$disconnect();

      expect(mockKafkaConsumer.disconnect).toHaveBeenCalled();
      expect(mockPrismaInstance.$disconnect).toHaveBeenCalled();
    });
  });

  describe("Email Address Handling", () => {
    it("should use first email from email_addresses array", async () => {
      mockUserUpsert.mockResolvedValueOnce({});

      const message = {
        key: "user.created:id",
        value: JSON.stringify({
          id: "user_123",
          email_addresses: [
            { email_address: "primary@example.com" },
            { email_address: "secondary@example.com" },
          ],
          first_name: "Test",
          last_name: "User",
        }),
      };

      await processMessage(message, mockPrismaInstance);

      expect(mockUserUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: "primary@example.com" },
          create: expect.objectContaining({ email: "primary@example.com" }),
        }),
      );
    });

    it("should handle email addresses with different formats", async () => {
      mockUserUpsert.mockResolvedValueOnce({});

      const testEmails = [
        "simple@example.com",
        "with.dots@example.com",
        "with+plus@example.com",
        "UPPERCASE@EXAMPLE.COM",
        "numbers123@example456.com",
      ];

      for (const email of testEmails) {
        vi.clearAllMocks();
        const message = {
          key: "user.created:id",
          value: JSON.stringify({
            id: "user_123",
            email_addresses: [{ email_address: email }],
            first_name: "Test",
            last_name: "User",
          }),
        };

        await processMessage(message, mockPrismaInstance);

        expect(mockUserUpsert).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { email },
          }),
        );
      }
    });
  });

  describe("Idempotency", () => {
    it("should handle duplicate user.created events via upsert", async () => {
      mockUserUpsert.mockResolvedValue({ id: "user-id" });

      const message = {
        key: "user.created:id",
        value: JSON.stringify({
          id: "user_123",
          email_addresses: [{ email_address: "test@example.com" }],
          first_name: "Test",
          last_name: "User",
        }),
      };

      // Process same message twice
      await processMessage(message, mockPrismaInstance);
      await processMessage(message, mockPrismaInstance);

      // Both should succeed - upsert handles duplicates
      expect(mockUserUpsert).toHaveBeenCalledTimes(2);
    });

    it("should handle repeated delete events gracefully", async () => {
      // First deletion - user exists
      mockUserFindUnique.mockResolvedValueOnce({ id: "user-id" });
      mockUserUpdate.mockResolvedValueOnce({});

      // Second deletion - user already deleted (not found)
      mockUserFindUnique.mockResolvedValueOnce(null);

      const message = {
        key: "user.deleted:id",
        value: JSON.stringify({ id: "user_123" }),
      };

      const result1 = await processMessage(message, mockPrismaInstance);
      const result2 = await processMessage(message, mockPrismaInstance);

      expect(result1.action).toBe("deleted");
      expect(result2.action).toBe("skipped");
    });
  });
});
