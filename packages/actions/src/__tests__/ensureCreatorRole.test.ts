/**
 * Tests for ensureCreatorRole
 * Tests auto-promotion of USER → CREATOR on CreatorOps access
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted for mocks
const { mockPrisma, mockAuth, mockClerkClientFn, mockClerkClient } = vi.hoisted(
  () => {
    const mockPrisma = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };

    const mockClerkClient = {
      users: {
        updateUserMetadata: vi.fn(),
      },
    };

    const mockClerkClientFn = vi.fn(() => Promise.resolve(mockClerkClient));
    const mockAuth = vi.fn();

    return { mockPrisma, mockAuth, mockClerkClientFn, mockClerkClient };
  },
);

// Mock modules
vi.mock("@ratecreator/db/client", () => ({
  getPrismaClient: vi.fn(() => mockPrisma),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
  clerkClient: mockClerkClientFn,
}));

vi.mock("../content/cache", () => ({
  invalidateCache: vi.fn(),
  withCache: vi.fn(),
  CACHE_TTL: {},
  CacheKeys: {},
}));

import { ensureCreatorRole } from "../content/roles";

describe("ensureCreatorRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should add CREATOR role to user with only USER role", async () => {
    // The clerkId arg must match the session userId — both are "clerk-123"
    mockAuth.mockResolvedValue({ userId: "clerk-123" });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      role: ["USER"],
      email: "test@example.com",
    });
    mockPrisma.user.update.mockResolvedValue({});
    mockClerkClient.users.updateUserMetadata.mockResolvedValue({});

    await ensureCreatorRole("clerk-123");

    expect(mockClerkClient.users.updateUserMetadata).toHaveBeenCalledWith(
      "clerk-123",
      {
        publicMetadata: { roles: ["USER", "CREATOR"] },
      },
    );
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { clerkId: "clerk-123" },
      data: { role: ["USER", "CREATOR"] },
    });
  });

  it("should not modify user who already has CREATOR role", async () => {
    mockAuth.mockResolvedValue({ userId: "clerk-456" });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-2",
      role: ["USER", "CREATOR"],
      email: "creator@example.com",
    });

    await ensureCreatorRole("clerk-456");

    expect(mockClerkClient.users.updateUserMetadata).not.toHaveBeenCalled();
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("should not modify user who already has WRITER role", async () => {
    mockAuth.mockResolvedValue({ userId: "clerk-789" });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-3",
      role: ["WRITER"],
      email: "writer@example.com",
    });

    await ensureCreatorRole("clerk-789");

    expect(mockClerkClient.users.updateUserMetadata).not.toHaveBeenCalled();
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("should not modify user who already has ADMIN role", async () => {
    mockAuth.mockResolvedValue({ userId: "clerk-admin" });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-4",
      role: ["ADMIN"],
      email: "admin@example.com",
    });

    await ensureCreatorRole("clerk-admin");

    expect(mockClerkClient.users.updateUserMetadata).not.toHaveBeenCalled();
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("should return early without error for non-existent user", async () => {
    mockAuth.mockResolvedValue({ userId: "clerk-nonexistent" });
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await ensureCreatorRole("clerk-nonexistent");

    expect(mockClerkClient.users.updateUserMetadata).not.toHaveBeenCalled();
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("should throw Unauthorized for unauthenticated callers", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    await expect(ensureCreatorRole("clerk-123")).rejects.toThrow(
      "Unauthorized",
    );
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("should throw Forbidden when clerkId arg doesn't match session", async () => {
    mockAuth.mockResolvedValue({ userId: "session-user" });

    await expect(ensureCreatorRole("other-user")).rejects.toThrow(
      "Forbidden: cannot modify another user's role",
    );
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });
});
