/**
 * Tests for Member Management Actions
 * Tests fetchMembers, countMembers, updateMemberRoles, fetchMemberStats
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocks
const { mockPrisma, mockAuth, mockClerkClient, mockInvalidateCache } =
  vi.hoisted(() => {
    const mockPrisma = {
      user: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
    };

    const mockAuth = vi.fn();
    const mockClerkClient = vi.fn();
    const mockInvalidateCache = vi.fn().mockResolvedValue(undefined);

    return {
      mockPrisma,
      mockAuth,
      mockClerkClient,
      mockInvalidateCache,
    };
  });

// Mock modules
vi.mock("@ratecreator/db/client", () => ({
  getPrismaClient: vi.fn(() => mockPrisma),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
  clerkClient: mockClerkClient,
}));

vi.mock("@prisma/client", () => ({
  UserRole: {
    USER: "USER",
    ADMIN: "ADMIN",
    WRITER: "WRITER",
    CREATOR: "CREATOR",
    BRAND: "BRAND",
  },
}));

// Mock cache module: withCache passes through to fetcher
vi.mock("../content/cache", () => ({
  withCache: vi.fn(
    async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) =>
      fetcher(),
  ),
  invalidateCache: mockInvalidateCache,
  CACHE_TTL: {
    MEMBER_STATS: 120,
  },
  CacheKeys: {
    memberStats: () => "members:stats",
  },
}));

import {
  fetchMembers,
  countMembers,
  updateMemberRoles,
  fetchMemberStats,
  invalidateMembersCache,
} from "../content/members";

// Helper to set up admin authentication
function setupAdminAuth() {
  mockAuth.mockResolvedValue({ userId: "admin-clerk-id" });
  mockClerkClient.mockResolvedValue({
    users: {
      getUser: vi.fn().mockResolvedValue({
        id: "admin-clerk-id",
        emailAddresses: [
          {
            id: "email-1",
            emailAddress: "hi@deepshaswat.com",
          },
        ],
        primaryEmailAddressId: "email-1",
        publicMetadata: { roles: ["ADMIN"] },
        imageUrl: "https://example.com/admin.jpg",
      }),
      updateUserMetadata: vi.fn().mockResolvedValue({}),
    },
  });
}

// Helper to set up non-admin authentication
function setupNonAdminAuth() {
  mockAuth.mockResolvedValue({ userId: "user-clerk-id" });
  mockClerkClient.mockResolvedValue({
    users: {
      getUser: vi.fn().mockResolvedValue({
        id: "user-clerk-id",
        emailAddresses: [
          {
            id: "email-2",
            emailAddress: "regular@example.com",
          },
        ],
        primaryEmailAddressId: "email-2",
        publicMetadata: {},
        imageUrl: "https://example.com/user.jpg",
      }),
      updateUserMetadata: vi.fn().mockResolvedValue({}),
    },
  });
}

function setupUnauthenticated() {
  mockAuth.mockResolvedValue({ userId: null });
}

describe("Member Management Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchMembers", () => {
    it("should throw when user is not admin", async () => {
      setupNonAdminAuth();

      await expect(fetchMembers()).rejects.toThrow(
        "Unauthorized: Admin access required",
      );
    });

    it("should throw when user is not authenticated", async () => {
      setupUnauthenticated();

      await expect(fetchMembers()).rejects.toThrow(
        "Unauthorized: Admin access required",
      );
    });

    it("should fetch members when user is admin", async () => {
      setupAdminAuth();

      const mockUsers = [
        {
          id: "user-1",
          clerkId: "clerk-1",
          email: "user1@example.com",
          firstName: "John",
          lastName: "Doe",
          username: "johndoe",
          role: ["USER"],
          createdAt: new Date("2024-01-01"),
        },
      ];
      mockPrisma.user.findMany.mockResolvedValueOnce(mockUsers);

      // Re-mock clerkClient so the second call (for fetching member images) works
      const mockGetUser = vi.fn().mockResolvedValue({
        imageUrl: "https://example.com/user1.jpg",
        publicMetadata: { roles: ["USER"] },
      });
      mockClerkClient
        .mockResolvedValueOnce({
          users: {
            getUser: vi.fn().mockResolvedValue({
              id: "admin-clerk-id",
              emailAddresses: [
                { id: "email-1", emailAddress: "hi@deepshaswat.com" },
              ],
              primaryEmailAddressId: "email-1",
              publicMetadata: { roles: ["ADMIN"] },
            }),
          },
        })
        .mockResolvedValueOnce({
          users: {
            getUser: mockGetUser,
          },
        });

      const result = await fetchMembers();

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe("user1@example.com");
      expect(mockPrisma.user.findMany).toHaveBeenCalled();
    });

    it("should apply search filter across multiple fields", async () => {
      setupAdminAuth();
      mockPrisma.user.findMany.mockResolvedValueOnce([]);

      await fetchMembers({ search: "john" });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isDeleted: false,
            OR: [
              { email: { contains: "john", mode: "insensitive" } },
              { firstName: { contains: "john", mode: "insensitive" } },
              { lastName: { contains: "john", mode: "insensitive" } },
              { username: { contains: "john", mode: "insensitive" } },
            ],
          }),
        }),
      );
    });

    it("should apply pagination with default values", async () => {
      setupAdminAuth();
      mockPrisma.user.findMany.mockResolvedValueOnce([]);

      await fetchMembers();

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        }),
      );
    });

    it("should apply custom pagination", async () => {
      setupAdminAuth();
      mockPrisma.user.findMany.mockResolvedValueOnce([]);

      await fetchMembers({ pageNumber: 2, pageSize: 10 });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        }),
      );
    });

    it("should apply role filter with 'is' operator", async () => {
      setupAdminAuth();
      mockPrisma.user.findMany.mockResolvedValueOnce([]);

      await fetchMembers({
        role: { operator: "is", value: "ADMIN" },
      });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: { has: "ADMIN" },
          }),
        }),
      );
    });

    it("should apply role filter with 'is not' operator", async () => {
      setupAdminAuth();
      mockPrisma.user.findMany.mockResolvedValueOnce([]);

      await fetchMembers({
        role: { operator: "is not", value: "ADMIN" },
      });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([{ NOT: { role: { has: "ADMIN" } } }]),
          }),
        }),
      );
    });

    it("should ensure protected admin emails always have ADMIN role", async () => {
      setupAdminAuth();

      const mockUsers = [
        {
          id: "admin-user",
          clerkId: "clerk-admin",
          email: "hi@deepshaswat.com",
          firstName: "Deep",
          lastName: "Shaswat",
          username: "deepshaswat",
          role: ["USER"],
          createdAt: new Date("2024-01-01"),
        },
      ];
      mockPrisma.user.findMany.mockResolvedValueOnce(mockUsers);

      // Mock Clerk to return no roles for the member
      mockClerkClient
        .mockResolvedValueOnce({
          users: {
            getUser: vi.fn().mockResolvedValue({
              id: "admin-clerk-id",
              emailAddresses: [
                { id: "email-1", emailAddress: "hi@deepshaswat.com" },
              ],
              primaryEmailAddressId: "email-1",
              publicMetadata: { roles: ["ADMIN"] },
            }),
          },
        })
        .mockResolvedValueOnce({
          users: {
            getUser: vi.fn().mockResolvedValue({
              imageUrl: "https://example.com/admin.jpg",
              publicMetadata: {},
            }),
          },
        });

      const result = await fetchMembers();

      expect(result[0].isProtectedAdmin).toBe(true);
      expect(result[0].role).toContain("ADMIN");
    });

    it("should apply email filter", async () => {
      setupAdminAuth();
      mockPrisma.user.findMany.mockResolvedValueOnce([]);

      await fetchMembers({
        email: { operator: "contains", value: "example.com" },
      });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              { email: { contains: "example.com", mode: "insensitive" } },
            ]),
          }),
        }),
      );
    });

    it("should apply name filter across firstName and lastName", async () => {
      setupAdminAuth();
      mockPrisma.user.findMany.mockResolvedValueOnce([]);

      await fetchMembers({
        name: { operator: "starts with", value: "Jo" },
      });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              {
                OR: [
                  { firstName: { startsWith: "Jo", mode: "insensitive" } },
                  { lastName: { startsWith: "Jo", mode: "insensitive" } },
                ],
              },
            ]),
          }),
        }),
      );
    });

    it("should order members by createdAt descending", async () => {
      setupAdminAuth();
      mockPrisma.user.findMany.mockResolvedValueOnce([]);

      await fetchMembers();

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        }),
      );
    });
  });

  describe("countMembers", () => {
    it("should return 0 when user is not admin", async () => {
      setupNonAdminAuth();

      const result = await countMembers();

      expect(result).toBe(0);
    });

    it("should return count when user is admin", async () => {
      setupAdminAuth();
      mockPrisma.user.count.mockResolvedValueOnce(42);

      const result = await countMembers();

      expect(result).toBe(42);
      expect(mockPrisma.user.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isDeleted: false }),
        }),
      );
    });

    it("should apply search filter to count", async () => {
      setupAdminAuth();
      mockPrisma.user.count.mockResolvedValueOnce(5);

      const result = await countMembers({ search: "test" });

      expect(result).toBe(5);
      expect(mockPrisma.user.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { email: { contains: "test", mode: "insensitive" } },
            ]),
          }),
        }),
      );
    });

    it("should apply role filter to count", async () => {
      setupAdminAuth();
      mockPrisma.user.count.mockResolvedValueOnce(3);

      const result = await countMembers({
        role: { operator: "is", value: "WRITER" },
      });

      expect(result).toBe(3);
      expect(mockPrisma.user.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: { has: "WRITER" },
          }),
        }),
      );
    });
  });

  describe("updateMemberRoles", () => {
    it("should return error when user is not admin", async () => {
      setupNonAdminAuth();

      const result = await updateMemberRoles("user-1", ["WRITER"]);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized: Admin access required");
    });

    it("should return error when member not found", async () => {
      setupAdminAuth();
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      const result = await updateMemberRoles("nonexistent", ["USER"]);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Member not found");
    });

    it("should prevent removing admin from protected email", async () => {
      setupAdminAuth();
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        clerkId: "clerk-admin",
        email: "hi@deepshaswat.com",
      });

      const result = await updateMemberRoles("admin-user", ["USER", "WRITER"]);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Cannot remove admin role from protected admin email",
      );
    });

    it("should update roles successfully", async () => {
      setupAdminAuth();
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        clerkId: "clerk-regular",
        email: "user@example.com",
      });
      mockPrisma.user.update.mockResolvedValueOnce({});

      const mockUpdateMetadata = vi.fn().mockResolvedValue({});
      mockClerkClient
        .mockResolvedValueOnce({
          users: {
            getUser: vi.fn().mockResolvedValue({
              id: "admin-clerk-id",
              emailAddresses: [
                { id: "email-1", emailAddress: "hi@deepshaswat.com" },
              ],
              primaryEmailAddressId: "email-1",
              publicMetadata: { roles: ["ADMIN"] },
            }),
          },
        })
        .mockResolvedValueOnce({
          users: {
            updateUserMetadata: mockUpdateMetadata,
          },
        });

      const result = await updateMemberRoles("user-1", ["USER", "WRITER"]);

      expect(result.success).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { role: ["USER", "WRITER"] },
      });
    });

    it("should invalidate members cache after successful update", async () => {
      setupAdminAuth();
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        clerkId: "clerk-regular",
        email: "user@example.com",
      });
      mockPrisma.user.update.mockResolvedValueOnce({});

      mockClerkClient
        .mockResolvedValueOnce({
          users: {
            getUser: vi.fn().mockResolvedValue({
              id: "admin-clerk-id",
              emailAddresses: [
                { id: "email-1", emailAddress: "hi@deepshaswat.com" },
              ],
              primaryEmailAddressId: "email-1",
              publicMetadata: { roles: ["ADMIN"] },
            }),
          },
        })
        .mockResolvedValueOnce({
          users: {
            updateUserMetadata: vi.fn().mockResolvedValue({}),
          },
        });

      await updateMemberRoles("user-1", ["USER"]);

      expect(mockInvalidateCache).toHaveBeenCalledWith("members:*");
    });

    it("should handle database errors gracefully", async () => {
      setupAdminAuth();
      mockPrisma.user.findUnique.mockRejectedValueOnce(new Error("DB Error"));

      const result = await updateMemberRoles("user-1", ["USER"]);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to update member roles");
    });
  });

  describe("fetchMemberStats", () => {
    it("should return zeros when user is not admin", async () => {
      setupNonAdminAuth();

      const result = await fetchMemberStats();

      expect(result).toEqual({
        totalMembers: 0,
        admins: 0,
        writers: 0,
        creators: 0,
        brands: 0,
        users: 0,
      });
    });

    it("should return correct stats when user is admin", async () => {
      setupAdminAuth();

      const mockUsers = [
        { role: ["ADMIN"], email: "hi@deepshaswat.com" },
        { role: ["USER", "WRITER"], email: "writer@example.com" },
        { role: ["USER", "CREATOR"], email: "creator@example.com" },
        { role: ["USER", "BRAND"], email: "brand@example.com" },
        { role: ["USER"], email: "regular@example.com" },
      ];
      mockPrisma.user.findMany.mockResolvedValueOnce(mockUsers);

      const result = await fetchMemberStats();

      expect(result.totalMembers).toBe(5);
      expect(result.admins).toBe(1);
      expect(result.writers).toBe(1);
      expect(result.creators).toBe(1);
      expect(result.brands).toBe(1);
      expect(result.users).toBe(1);
    });

    it("should count protected admin emails as admins even without ADMIN role", async () => {
      setupAdminAuth();

      const mockUsers = [
        { role: ["USER"], email: "hi@deepshaswat.com" },
        { role: ["USER"], email: "deepshaswat@gmail.com" },
      ];
      mockPrisma.user.findMany.mockResolvedValueOnce(mockUsers);

      const result = await fetchMemberStats();

      expect(result.admins).toBe(2);
    });

    it("should count regular users (only USER role, not admin/writer/etc)", async () => {
      setupAdminAuth();

      const mockUsers = [
        { role: ["USER"], email: "user1@example.com" },
        { role: ["USER"], email: "user2@example.com" },
        { role: ["USER", "ADMIN"], email: "admin@example.com" },
      ];
      mockPrisma.user.findMany.mockResolvedValueOnce(mockUsers);

      const result = await fetchMemberStats();

      // Only the first two are pure regular users
      expect(result.users).toBe(2);
    });

    it("should query only non-deleted users", async () => {
      setupAdminAuth();
      mockPrisma.user.findMany.mockResolvedValueOnce([]);

      await fetchMemberStats();

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isDeleted: false },
        }),
      );
    });
  });

  describe("invalidateMembersCache", () => {
    it("should invalidate members cache pattern", async () => {
      await invalidateMembersCache();

      expect(mockInvalidateCache).toHaveBeenCalledWith("members:*");
    });
  });
});
