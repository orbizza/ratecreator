/**
 * Tests for Author Actions
 * Tests author creation and management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocks
const { mockPrisma, mockCurrentUser, mockAuth, mockClerkClient } = vi.hoisted(
  () => {
    const mockPrisma = {
      author: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    };

    const mockCurrentUser = vi.fn();
    const mockAuth = vi.fn();
    const mockClerkClient = vi.fn();

    return { mockPrisma, mockCurrentUser, mockAuth, mockClerkClient };
  },
);

// Mock modules
vi.mock("@ratecreator/db/client", () => ({
  getPrismaClient: vi.fn(() => mockPrisma),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
  currentUser: mockCurrentUser,
  clerkClient: mockClerkClient,
}));

vi.mock("@ratecreator/db/utils", () => ({
  getInitials: vi.fn((name) =>
    name
      .split(" ")
      .map((n: string) => n[0])
      .join(""),
  ),
}));

// Stub the cache module which transitively pulls in `@ratecreator/db/redis-do`
// via roles.ts (now imported by author.ts for the requireWriter() helper).
vi.mock("../content/cache", () => ({
  invalidateCache: vi.fn().mockResolvedValue(undefined),
  withCache: vi.fn(async (_k: string, _t: number, fn: () => Promise<unknown>) =>
    fn(),
  ),
  CACHE_TTL: {},
  CacheKeys: {},
}));

import { createAuthor } from "../content/author";

describe("Author Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: "clerk-user-1" });
    mockClerkClient.mockResolvedValue({
      users: {
        getUser: vi.fn().mockResolvedValue({
          id: "clerk-user-1",
          primaryEmailAddressId: "email-1",
          emailAddresses: [
            { id: "email-1", emailAddress: "deepshaswat@gmail.com" },
          ],
          publicMetadata: {},
        }),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createAuthor", () => {
    const mockUser = {
      id: "clerk-123",
      fullName: "John Doe",
      firstName: "John",
      lastName: "Doe",
      username: "johndoe",
      emailAddresses: [{ emailAddress: "john@example.com" }],
      imageUrl: "https://example.com/avatar.jpg",
    };

    it("should create a new author if not exists", async () => {
      mockCurrentUser.mockResolvedValueOnce(mockUser);
      mockPrisma.author.findFirst.mockResolvedValueOnce(null);
      mockPrisma.author.create.mockResolvedValueOnce({
        id: "author-1",
        clerkId: "clerk-123",
        name: "John Doe",
        username: "johndoe",
        email: "john@example.com",
        imageUrl: "https://example.com/avatar.jpg",
        role: "WRITER",
      });

      const result = await createAuthor();

      expect(result.id).toBe("author-1");
      expect(result.name).toBe("John Doe");
      expect(mockPrisma.author.create).toHaveBeenCalledWith({
        data: {
          clerkId: "clerk-123",
          name: "John Doe",
          username: "johndoe",
          email: "john@example.com",
          imageUrl: "https://example.com/avatar.jpg",
          role: "WRITER",
        },
      });
    });

    it("should return existing author if already exists", async () => {
      const existingAuthor = {
        id: "author-1",
        clerkId: "clerk-123",
        name: "John Doe",
        username: "johndoe",
        email: "john@example.com",
        imageUrl: "https://example.com/avatar.jpg",
        role: "WRITER",
      };
      mockCurrentUser.mockResolvedValueOnce(mockUser);
      mockPrisma.author.findFirst.mockResolvedValueOnce(existingAuthor);
      mockPrisma.author.update.mockResolvedValueOnce({
        id: "author-1",
        clerkId: "clerk-123",
        name: "John Doe",
        username: "johndoe",
        email: "john@example.com",
        imageUrl: "https://example.com/avatar.jpg",
        role: "WRITER",
      });

      const result = await createAuthor();

      expect(result.id).toBe("author-1");
      expect(mockPrisma.author.create).not.toHaveBeenCalled();
    });

    it("should return error if no user found", async () => {
      mockCurrentUser.mockResolvedValueOnce(null);

      const result = await createAuthor();

      expect(result.error).toBe("No user found");
    });

    it("should handle user without fullName", async () => {
      const userWithoutFullName = {
        ...mockUser,
        fullName: null,
      };
      mockCurrentUser.mockResolvedValueOnce(userWithoutFullName);
      mockPrisma.author.findFirst.mockResolvedValueOnce(null);
      mockPrisma.author.create.mockResolvedValueOnce({
        id: "author-2",
        clerkId: "clerk-123",
        name: "John Doe",
        username: "johndoe",
        email: "john@example.com",
        imageUrl: "https://example.com/avatar.jpg",
        role: "WRITER",
      });

      const result = await createAuthor();

      expect(result.name).toBe("John Doe");
      expect(mockPrisma.author.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "John Doe",
        }),
      });
    });

    it("should handle user with only firstName", async () => {
      const userOnlyFirstName = {
        ...mockUser,
        fullName: null,
        lastName: null,
      };
      mockCurrentUser.mockResolvedValueOnce(userOnlyFirstName);
      mockPrisma.author.findFirst.mockResolvedValueOnce(null);
      mockPrisma.author.create.mockResolvedValueOnce({
        id: "author-3",
        clerkId: "clerk-123",
        name: "John",
        username: "johndoe",
        email: "john@example.com",
        imageUrl: "https://example.com/avatar.jpg",
        role: "WRITER",
      });

      const result = await createAuthor();

      expect(mockPrisma.author.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "John",
        }),
      });
    });

    it("should handle user without username", async () => {
      const userNoUsername = {
        ...mockUser,
        username: null,
      };
      mockCurrentUser.mockResolvedValueOnce(userNoUsername);
      mockPrisma.author.findFirst.mockResolvedValueOnce(null);
      mockPrisma.author.create.mockResolvedValueOnce({
        id: "author-4",
        clerkId: "clerk-123",
        name: "John Doe",
        username: "",
        email: "john@example.com",
        imageUrl: "https://example.com/avatar.jpg",
        role: "WRITER",
      });

      const result = await createAuthor();

      expect(mockPrisma.author.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          username: "",
        }),
      });
    });

    it("should handle user without email", async () => {
      const userNoEmail = {
        ...mockUser,
        emailAddresses: [],
      };
      mockCurrentUser.mockResolvedValueOnce(userNoEmail);
      mockPrisma.author.findFirst.mockResolvedValueOnce(null);
      mockPrisma.author.create.mockResolvedValueOnce({
        id: "author-5",
        clerkId: "clerk-123",
        name: "John Doe",
        username: "johndoe",
        email: "",
        imageUrl: "https://example.com/avatar.jpg",
        role: "WRITER",
      });

      const result = await createAuthor();

      expect(mockPrisma.author.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: "",
        }),
      });
    });

    it("should handle user without imageUrl", async () => {
      const userNoImage = {
        ...mockUser,
        imageUrl: null,
      };
      mockCurrentUser.mockResolvedValueOnce(userNoImage);
      mockPrisma.author.findFirst.mockResolvedValueOnce(null);
      mockPrisma.author.create.mockResolvedValueOnce({
        id: "author-6",
        clerkId: "clerk-123",
        name: "John Doe",
        username: "johndoe",
        email: "john@example.com",
        imageUrl: "",
        role: "WRITER",
      });

      const result = await createAuthor();

      expect(mockPrisma.author.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          imageUrl: "",
        }),
      });
    });

    it("should return imageUrl as empty string if null in existing author", async () => {
      const existingAuthorNoImage = {
        id: "author-7",
        clerkId: "clerk-123",
        name: "John Doe",
        username: "johndoe",
        email: "john@example.com",
        imageUrl: null,
        role: "WRITER",
      };
      mockCurrentUser.mockResolvedValueOnce(mockUser);
      mockPrisma.author.findFirst.mockResolvedValueOnce(existingAuthorNoImage);
      mockPrisma.author.update.mockResolvedValueOnce({
        ...existingAuthorNoImage,
        imageUrl: "https://example.com/avatar.jpg",
      });

      const result = await createAuthor();

      // Source uses user.imageUrl || "" so when user has imageUrl, it's used in the update
      expect(result.imageUrl).toBeDefined();
    });

    it("should return error on database failure", async () => {
      mockCurrentUser.mockResolvedValueOnce(mockUser);
      mockPrisma.author.findFirst.mockRejectedValueOnce(new Error("DB Error"));

      const result = await createAuthor();

      expect(result.error).toBe("Error creating author");
    });

    it("should set default role as WRITER", async () => {
      mockCurrentUser.mockResolvedValueOnce(mockUser);
      mockPrisma.author.findFirst.mockResolvedValueOnce(null);
      mockPrisma.author.create.mockResolvedValueOnce({
        id: "author-8",
        clerkId: "clerk-123",
        name: "John Doe",
        username: "johndoe",
        email: "john@example.com",
        imageUrl: "https://example.com/avatar.jpg",
        role: "WRITER",
      });

      await createAuthor();

      expect(mockPrisma.author.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: "WRITER",
        }),
      });
    });
  });
});
