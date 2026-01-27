/**
 * Tests for addAccount action
 * Tests account creation and platform identifier parsing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted to declare mocks that will be used inside vi.mock
const {
  mockAccountFindFirst,
  mockAccountCreate,
  mockKafkaSend,
  mockPrismaInstance,
} = vi.hoisted(() => {
  const mockAccountFindFirst = vi.fn();
  const mockAccountCreate = vi.fn();
  const mockKafkaSend = vi.fn().mockResolvedValue(undefined);
  const mockPrismaInstance = {
    account: {
      findFirst: mockAccountFindFirst,
      create: mockAccountCreate,
    },
  };
  return {
    mockAccountFindFirst,
    mockAccountCreate,
    mockKafkaSend,
    mockPrismaInstance,
  };
});

// Mock modules
vi.mock("@ratecreator/db/client", () => ({
  getPrismaClient: vi.fn(() => mockPrismaInstance),
}));

vi.mock("@ratecreator/db/kafka-client", () => ({
  getKafkaProducer: vi.fn(() =>
    Promise.resolve({
      send: mockKafkaSend,
    }),
  ),
  createTopicIfNotExists: vi.fn().mockResolvedValue(undefined),
}));

// Import after mocks
import { addAccount } from "../account/addAccount";

describe("addAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockKafkaSend.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Identifier Parsing", () => {
    describe("YouTube", () => {
      it("should parse YouTube channel URL", async () => {
        mockAccountFindFirst.mockResolvedValue(null);
        mockAccountCreate.mockResolvedValue({
          id: "account-id",
          accountId: "ChannelName",
          handle: "ChannelName",
        });

        await addAccount({
          platform: "youtube",
          identifier: "https://www.youtube.com/channel/ChannelName",
        });

        expect(mockAccountCreate).toHaveBeenCalledWith({
          data: expect.objectContaining({
            accountId: "ChannelName",
            handle: "ChannelName",
          }),
        });
      });

      it("should parse YouTube @handle URL", async () => {
        mockAccountFindFirst.mockResolvedValue(null);
        mockAccountCreate.mockResolvedValue({
          id: "account-id",
          accountId: "creator",
        });

        await addAccount({
          platform: "youtube",
          identifier: "https://www.youtube.com/@creator",
        });

        expect(mockAccountCreate).toHaveBeenCalledWith({
          data: expect.objectContaining({
            accountId: "creator",
          }),
        });
      });

      it("should parse plain YouTube username", async () => {
        mockAccountFindFirst.mockResolvedValue(null);
        mockAccountCreate.mockResolvedValue({
          id: "account-id",
          accountId: "creator",
        });

        await addAccount({
          platform: "youtube",
          identifier: "creator",
        });

        expect(mockAccountCreate).toHaveBeenCalledWith({
          data: expect.objectContaining({
            accountId: "creator",
          }),
        });
      });

      it("should strip @ from username", async () => {
        mockAccountFindFirst.mockResolvedValue(null);
        mockAccountCreate.mockResolvedValue({
          id: "account-id",
          accountId: "creator",
        });

        await addAccount({
          platform: "youtube",
          identifier: "@creator",
        });

        expect(mockAccountCreate).toHaveBeenCalledWith({
          data: expect.objectContaining({
            accountId: "creator",
          }),
        });
      });
    });

    describe("Twitter/X", () => {
      it("should parse twitter.com URL", async () => {
        mockAccountFindFirst.mockResolvedValue(null);
        mockAccountCreate.mockResolvedValue({
          id: "account-id",
          accountId: "username",
        });

        await addAccount({
          platform: "twitter",
          identifier: "https://twitter.com/username",
        });

        expect(mockAccountCreate).toHaveBeenCalledWith({
          data: expect.objectContaining({
            accountId: "username",
          }),
        });
      });

      it("should parse x.com URL", async () => {
        mockAccountFindFirst.mockResolvedValue(null);
        mockAccountCreate.mockResolvedValue({
          id: "account-id",
          accountId: "username",
        });

        await addAccount({
          platform: "twitter",
          identifier: "https://x.com/username",
        });

        expect(mockAccountCreate).toHaveBeenCalledWith({
          data: expect.objectContaining({
            accountId: "username",
          }),
        });
      });
    });

    describe("Instagram", () => {
      it("should parse Instagram URL", async () => {
        mockAccountFindFirst.mockResolvedValue(null);
        mockAccountCreate.mockResolvedValue({
          id: "account-id",
          accountId: "instauser",
        });

        await addAccount({
          platform: "instagram",
          identifier: "https://www.instagram.com/instauser",
        });

        expect(mockAccountCreate).toHaveBeenCalledWith({
          data: expect.objectContaining({
            accountId: "instauser",
          }),
        });
      });
    });

    describe("Reddit", () => {
      it("should parse Reddit user URL with /user/", async () => {
        mockAccountFindFirst.mockResolvedValue(null);
        mockAccountCreate.mockResolvedValue({
          id: "account-id",
          accountId: "redditor",
        });

        await addAccount({
          platform: "reddit",
          identifier: "https://www.reddit.com/user/redditor",
        });

        expect(mockAccountCreate).toHaveBeenCalledWith({
          data: expect.objectContaining({
            accountId: "redditor",
          }),
        });
      });

      it("should parse Reddit user URL with /u/", async () => {
        mockAccountFindFirst.mockResolvedValue(null);
        mockAccountCreate.mockResolvedValue({
          id: "account-id",
          accountId: "redditor",
        });

        await addAccount({
          platform: "reddit",
          identifier: "https://www.reddit.com/u/redditor",
        });

        expect(mockAccountCreate).toHaveBeenCalledWith({
          data: expect.objectContaining({
            accountId: "redditor",
          }),
        });
      });

      it("should strip u/ prefix from plain username", async () => {
        mockAccountFindFirst.mockResolvedValue(null);
        mockAccountCreate.mockResolvedValue({
          id: "account-id",
          accountId: "redditor",
        });

        await addAccount({
          platform: "reddit",
          identifier: "u/redditor",
        });

        expect(mockAccountCreate).toHaveBeenCalledWith({
          data: expect.objectContaining({
            accountId: "redditor",
          }),
        });
      });
    });

    describe("TikTok", () => {
      it("should parse TikTok URL", async () => {
        mockAccountFindFirst.mockResolvedValue(null);
        mockAccountCreate.mockResolvedValue({
          id: "account-id",
          accountId: "tiktoker",
        });

        await addAccount({
          platform: "tiktok",
          identifier: "https://www.tiktok.com/@tiktoker",
        });

        expect(mockAccountCreate).toHaveBeenCalledWith({
          data: expect.objectContaining({
            accountId: "tiktoker",
          }),
        });
      });
    });

    describe("Twitch", () => {
      it("should parse Twitch URL", async () => {
        mockAccountFindFirst.mockResolvedValue(null);
        mockAccountCreate.mockResolvedValue({
          id: "account-id",
          accountId: "streamer",
        });

        await addAccount({
          platform: "twitch",
          identifier: "https://www.twitch.tv/streamer",
        });

        expect(mockAccountCreate).toHaveBeenCalledWith({
          data: expect.objectContaining({
            accountId: "streamer",
          }),
        });
      });
    });
  });

  describe("Existing Account Check", () => {
    it("should return existing account when already exists", async () => {
      const existingAccount = {
        id: "existing-account-id",
        platform: "YOUTUBE",
        accountId: "creator",
        handle: "creator",
      };
      mockAccountFindFirst.mockResolvedValue(existingAccount);

      const result = await addAccount({
        platform: "youtube",
        identifier: "creator",
      });

      expect(result.success).toBe(true);
      expect(result.accountId).toBe("existing-account-id");
      expect(result.isExisting).toBe(true);
      expect(mockAccountCreate).not.toHaveBeenCalled();
    });

    it("should check both accountId and handle for existing accounts", async () => {
      mockAccountFindFirst.mockResolvedValue(null);
      mockAccountCreate.mockResolvedValue({
        id: "new-account-id",
        accountId: "creator",
      });

      await addAccount({
        platform: "youtube",
        identifier: "creator",
      });

      expect(mockAccountFindFirst).toHaveBeenCalledWith({
        where: {
          platform: "YOUTUBE",
          OR: [{ accountId: "creator" }, { handle: "creator" }],
        },
      });
    });
  });

  describe("New Account Creation", () => {
    it("should create new account with correct platform enum", async () => {
      mockAccountFindFirst.mockResolvedValue(null);
      mockAccountCreate.mockResolvedValue({
        id: "new-account-id",
        accountId: "creator",
        platform: "YOUTUBE",
      });

      const result = await addAccount({
        platform: "youtube",
        identifier: "creator",
      });

      expect(result.success).toBe(true);
      expect(result.accountId).toBe("new-account-id");
      expect(result.isExisting).toBe(false);
      expect(mockAccountCreate).toHaveBeenCalledWith({
        data: {
          platform: "YOUTUBE",
          accountId: "creator",
          handle: "creator",
          isSeeded: false,
          isDeleted: false,
        },
      });
    });

    it("should send Kafka event for new account", async () => {
      mockAccountFindFirst.mockResolvedValue(null);
      mockAccountCreate.mockResolvedValue({
        id: "new-account-id",
        accountId: "creator",
        platform: "YOUTUBE",
      });

      await addAccount({
        platform: "youtube",
        identifier: "creator",
        addedByUserId: "user-123",
      });

      expect(mockKafkaSend).toHaveBeenCalledWith({
        topic: "account-added",
        messages: [
          {
            key: "new-account-id",
            value: expect.stringContaining("creator"),
          },
        ],
      });
    });

    it("should not fail if Kafka event fails", async () => {
      mockAccountFindFirst.mockResolvedValue(null);
      mockAccountCreate.mockResolvedValue({
        id: "new-account-id",
        accountId: "creator",
        platform: "YOUTUBE",
      });
      mockKafkaSend.mockRejectedValue(new Error("Kafka error"));

      const result = await addAccount({
        platform: "youtube",
        identifier: "creator",
      });

      // Account creation should still succeed
      expect(result.success).toBe(true);
      expect(result.accountId).toBe("new-account-id");
    });
  });

  describe("Platform Enum Mapping", () => {
    const platformMappings = [
      { input: "youtube", expected: "YOUTUBE" },
      { input: "twitter", expected: "TWITTER" },
      { input: "instagram", expected: "INSTAGRAM" },
      { input: "reddit", expected: "REDDIT" },
      { input: "tiktok", expected: "TIKTOK" },
      { input: "twitch", expected: "TWITCH" },
    ];

    it.each(platformMappings)(
      "should map $input to $expected",
      async ({ input, expected }) => {
        mockAccountFindFirst.mockResolvedValue(null);
        mockAccountCreate.mockResolvedValue({
          id: "account-id",
          accountId: "username",
          platform: expected,
        });

        await addAccount({
          platform: input as any,
          identifier: "username",
        });

        expect(mockAccountCreate).toHaveBeenCalledWith({
          data: expect.objectContaining({
            platform: expected,
          }),
        });
      },
    );
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      mockAccountFindFirst.mockRejectedValue(
        new Error("Database connection error"),
      );

      const result = await addAccount({
        platform: "youtube",
        identifier: "creator",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database connection error");
    });

    it("should handle account creation errors", async () => {
      mockAccountFindFirst.mockResolvedValue(null);
      mockAccountCreate.mockRejectedValue(
        new Error("Unique constraint violation"),
      );

      const result = await addAccount({
        platform: "youtube",
        identifier: "creator",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unique constraint violation");
    });
  });

  describe("Input Trimming", () => {
    it("should trim whitespace from identifier", async () => {
      mockAccountFindFirst.mockResolvedValue(null);
      mockAccountCreate.mockResolvedValue({
        id: "account-id",
        accountId: "creator",
      });

      await addAccount({
        platform: "youtube",
        identifier: "  creator  ",
      });

      expect(mockAccountCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          accountId: "creator",
        }),
      });
    });
  });

  describe("URL Query Parameters", () => {
    it("should strip query parameters from URL", async () => {
      mockAccountFindFirst.mockResolvedValue(null);
      mockAccountCreate.mockResolvedValue({
        id: "account-id",
        accountId: "creator",
      });

      await addAccount({
        platform: "youtube",
        identifier: "https://www.youtube.com/@creator?sub_confirmation=1",
      });

      expect(mockAccountCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          accountId: "creator",
        }),
      });
    });
  });
});
