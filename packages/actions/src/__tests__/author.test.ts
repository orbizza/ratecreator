/**
 * Tests for Author Actions
 * Tests author creation and management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocks
const { mockPrisma, mockSignedIn, mockRedirect, mockCurrentUser } = vi.hoisted(
  () => {
    const mockPrisma = {
      author: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    };

    const mockSignedIn = vi.fn();
    const mockRedirect = vi.fn();
    const mockCurrentUser = vi.fn();

    return { mockPrisma, mockSignedIn, mockRedirect, mockCurrentUser };
  },
);

// Mock modules
vi.mock("@ratecreator/db/client", () => ({
  getPrismaClient: vi.fn(() => mockPrisma),
}));

vi.mock("@clerk/nextjs", () => ({
  SignedIn: mockSignedIn,
}));

vi.mock("@clerk/nextjs/server", () => ({
  currentUser: mockCurrentUser,
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("@ratecreator/db/utils", () => ({
  getInitials: vi.fn((name) =>
    name
      .split(" ")
      .map((n: string) => n[0])
      .join(""),
  ),
}));

import { createAuthor } from "../content/author";

describe("Author Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignedIn.mockResolvedValue(true);
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
      mockPrisma.author.findUnique.mockResolvedValueOnce(null);
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
      mockPrisma.author.findUnique.mockResolvedValueOnce(existingAuthor);

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
      mockPrisma.author.findUnique.mockResolvedValueOnce(null);
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
      mockPrisma.author.findUnique.mockResolvedValueOnce(null);
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
      mockPrisma.author.findUnique.mockResolvedValueOnce(null);
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
      mockPrisma.author.findUnique.mockResolvedValueOnce(null);
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

      const result = await createAuthor();

      expect(result.imageUrl).toBe("");
    });

    it("should return error on database failure", async () => {
      mockCurrentUser.mockResolvedValueOnce(mockUser);
      mockPrisma.author.findUnique.mockRejectedValueOnce(new Error("DB Error"));

      const result = await createAuthor();

      expect(result.error).toBe("Error creating author");
    });

    it("should set default role as WRITER", async () => {
      mockCurrentUser.mockResolvedValueOnce(mockUser);
      mockPrisma.author.findUnique.mockResolvedValueOnce(null);
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
