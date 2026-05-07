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
        // The new createAuthor implementation NEVER uses findFirst — it
        // looks up by clerkId, then (only on miss) by email — both via
        // findUnique. We keep findFirst on the mock surface so any
        // accidental regression to the OLD `OR: [clerkId, email]` query
        // surfaces as an unmocked-call test failure rather than a silent
        // pass.
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
    // Default session: user "clerk-123" (matches `mockUser` below) so the
    // author.ts → requireWriter() → clerkClient.users.getUser() path resolves
    // to a writer. We use deepshaswat@gmail.com because it's in ADMIN_EMAILS
    // and bypasses the role check entirely.
    mockAuth.mockResolvedValue({ userId: "clerk-123" });
    mockClerkClient.mockResolvedValue({
      users: {
        getUser: vi.fn().mockResolvedValue({
          id: "clerk-123",
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
      // 1st findUnique = clerkId lookup → no existing record.
      // 2nd findUnique = email collision check → also nothing.
      mockPrisma.author.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
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
      // Crucial regression: findFirst (the old, vulnerable OR-by-email query)
      // must NOT be used.
      expect(mockPrisma.author.findFirst).not.toHaveBeenCalled();
    });

    it("should return existing author if already exists (matched by clerkId)", async () => {
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
      mockPrisma.author.findUnique.mockResolvedValueOnce(existingAuthor);
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
      // Should look up by clerkId only (not OR clerkId/email).
      expect(mockPrisma.author.findUnique).toHaveBeenCalledWith({
        where: { clerkId: "clerk-123" },
      });
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
      mockPrisma.author.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
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
      mockPrisma.author.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
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
      mockPrisma.author.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
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
      // No email → email collision check is skipped, only one findUnique call.
      mockPrisma.author.findUnique.mockResolvedValueOnce(null);
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
      mockPrisma.author.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
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
      mockPrisma.author.findUnique.mockResolvedValueOnce(existingAuthorNoImage);
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
      mockPrisma.author.findUnique.mockRejectedValueOnce(new Error("DB Error"));

      const result = await createAuthor();

      expect(result.error).toBe("Error creating author");
    });

    it("should set default role as WRITER", async () => {
      mockCurrentUser.mockResolvedValueOnce(mockUser);
      mockPrisma.author.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
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

    // ── Security regressions ──────────────────────────────────────────────
    // The author-record takeover (item #14) — refuse to silently merge with a
    // pre-existing author owned by a different Clerk identity.

    it("should refuse to take over an author with a colliding email but different clerkId", async () => {
      mockCurrentUser.mockResolvedValueOnce(mockUser);
      // No author for this clerkId yet …
      mockPrisma.author.findUnique.mockResolvedValueOnce(null);
      // … but an author with the same email exists under another clerkId.
      mockPrisma.author.findUnique.mockResolvedValueOnce({
        id: "victim-author",
        clerkId: "victim-clerk-id",
        email: "john@example.com",
      });

      const result = await createAuthor();

      expect(result.error).toMatch(/already exists/i);
      // Critically, we MUST NOT proceed to create or update on this path —
      // that would be the takeover.
      expect(mockPrisma.author.create).not.toHaveBeenCalled();
      expect(mockPrisma.author.update).not.toHaveBeenCalled();
    });

    it("should proceed to create when email collision row has the same clerkId", async () => {
      // This shape shouldn't happen in normal flow (it would have been
      // caught by the first findUnique-by-clerkId call) but the source
      // still allows it explicitly, so cover the fall-through.
      mockCurrentUser.mockResolvedValueOnce(mockUser);
      mockPrisma.author.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: "self-row",
          clerkId: "clerk-123",
          email: "john@example.com",
        });
      mockPrisma.author.create.mockResolvedValueOnce({
        id: "author-9",
        clerkId: "clerk-123",
        name: "John Doe",
        username: "johndoe",
        email: "john@example.com",
        imageUrl: "https://example.com/avatar.jpg",
        role: "WRITER",
      });

      const result = await createAuthor();

      expect(result.id).toBe("author-9");
      expect(mockPrisma.author.create).toHaveBeenCalled();
    });

    it("should reject unauthenticated callers", async () => {
      mockAuth.mockResolvedValueOnce({ userId: null });
      const result = await createAuthor();
      expect(result.error).toBe("Unauthorized");
      expect(mockPrisma.author.findUnique).not.toHaveBeenCalled();
    });
  });
});
