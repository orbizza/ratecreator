/**
 * Tests for Role Management Actions
 * Tests isCurrentUserAdmin, fetchAllUsersWithRoles, updateUserRoles,
 * getUserRolesByEmail, syncUserRolesFromClerk
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocks
const { mockPrisma, mockAuth, mockClerkClient } = vi.hoisted(() => {
  const mockPrisma = {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };

  const mockAuth = vi.fn();
  const mockClerkClient = vi.fn();

  return { mockPrisma, mockAuth, mockClerkClient };
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

vi.mock("../content/cache", () => ({
  invalidateCache: vi.fn(),
}));

import {
  isCurrentUserAdmin,
  fetchAllUsersWithRoles,
  updateUserRoles,
  getUserRolesByEmail,
  syncUserRolesFromClerk,
} from "../content/roles";

describe("Role Management Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("isCurrentUserAdmin", () => {
    it("should return false when not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const result = await isCurrentUserAdmin();

      expect(result).toBe(false);
    });

    it("should return true for protected admin email", async () => {
      mockAuth.mockResolvedValue({ userId: "admin-clerk-id" });
      mockClerkClient.mockResolvedValue({
        users: {
          getUser: vi.fn().mockResolvedValue({
            id: "admin-clerk-id",
            emailAddresses: [
              { id: "email-1", emailAddress: "hi@deepshaswat.com" },
            ],
            primaryEmailAddressId: "email-1",
            publicMetadata: {},
          }),
        },
      });

      const result = await isCurrentUserAdmin();

      expect(result).toBe(true);
    });

    it("should return true for second protected admin email", async () => {
      mockAuth.mockResolvedValue({ userId: "admin-clerk-id-2" });
      mockClerkClient.mockResolvedValue({
        users: {
          getUser: vi.fn().mockResolvedValue({
            id: "admin-clerk-id-2",
            emailAddresses: [
              { id: "email-2", emailAddress: "deepshaswat@gmail.com" },
            ],
            primaryEmailAddressId: "email-2",
            publicMetadata: {},
          }),
        },
      });

      const result = await isCurrentUserAdmin();

      expect(result).toBe(true);
    });

    it("should return true when user has ADMIN role in metadata", async () => {
      mockAuth.mockResolvedValue({ userId: "user-clerk-id" });
      mockClerkClient.mockResolvedValue({
        users: {
          getUser: vi.fn().mockResolvedValue({
            id: "user-clerk-id",
            emailAddresses: [
              { id: "email-3", emailAddress: "otheradmin@example.com" },
            ],
            primaryEmailAddressId: "email-3",
            publicMetadata: { roles: ["ADMIN"] },
          }),
        },
      });

      const result = await isCurrentUserAdmin();

      expect(result).toBe(true);
    });

    it("should return false for regular user", async () => {
      mockAuth.mockResolvedValue({ userId: "regular-clerk-id" });
      mockClerkClient.mockResolvedValue({
        users: {
          getUser: vi.fn().mockResolvedValue({
            id: "regular-clerk-id",
            emailAddresses: [
              { id: "email-4", emailAddress: "regular@example.com" },
            ],
            primaryEmailAddressId: "email-4",
            publicMetadata: { roles: ["USER"] },
          }),
        },
      });

      const result = await isCurrentUserAdmin();

      expect(result).toBe(false);
    });

    it("should return false when user has no roles metadata", async () => {
      mockAuth.mockResolvedValue({ userId: "norole-clerk-id" });
      mockClerkClient.mockResolvedValue({
        users: {
          getUser: vi.fn().mockResolvedValue({
            id: "norole-clerk-id",
            emailAddresses: [
              { id: "email-5", emailAddress: "norole@example.com" },
            ],
            primaryEmailAddressId: "email-5",
            publicMetadata: {},
          }),
        },
      });

      const result = await isCurrentUserAdmin();

      expect(result).toBe(false);
    });
  });

  describe("fetchAllUsersWithRoles", () => {
    it("should throw when user is not admin", async () => {
      mockAuth.mockResolvedValue({ userId: "regular-clerk-id" });
      mockClerkClient.mockResolvedValue({
        users: {
          getUser: vi.fn().mockResolvedValue({
            id: "regular-clerk-id",
            emailAddresses: [
              { id: "email-1", emailAddress: "regular@example.com" },
            ],
            primaryEmailAddressId: "email-1",
            publicMetadata: {},
          }),
        },
      });

      await expect(fetchAllUsersWithRoles()).rejects.toThrow(
        "Unauthorized: Admin access required",
      );
    });

    it("should return users when admin", async () => {
      mockAuth.mockResolvedValue({ userId: "admin-clerk-id" });
      mockClerkClient.mockResolvedValue({
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
      });

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

      const result = await fetchAllUsersWithRoles();

      expect(result).toEqual(mockUsers);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { isDeleted: false },
        select: {
          id: true,
          clerkId: true,
          email: true,
          firstName: true,
          lastName: true,
          username: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("updateUserRoles", () => {
    function setupAsAdmin() {
      mockAuth.mockResolvedValue({ userId: "admin-clerk-id" });
      mockClerkClient.mockResolvedValue({
        users: {
          getUser: vi.fn().mockResolvedValue({
            id: "admin-clerk-id",
            emailAddresses: [
              { id: "email-1", emailAddress: "hi@deepshaswat.com" },
            ],
            primaryEmailAddressId: "email-1",
            publicMetadata: { roles: ["ADMIN"] },
          }),
          updateUserMetadata: vi.fn().mockResolvedValue({}),
        },
      });
    }

    it("should return error when not admin", async () => {
      mockAuth.mockResolvedValue({ userId: "regular-clerk-id" });
      mockClerkClient.mockResolvedValue({
        users: {
          getUser: vi.fn().mockResolvedValue({
            id: "regular-clerk-id",
            emailAddresses: [
              { id: "email-1", emailAddress: "regular@example.com" },
            ],
            primaryEmailAddressId: "email-1",
            publicMetadata: {},
          }),
        },
      });

      const result = await updateUserRoles("user-1", ["WRITER"]);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized: Admin access required");
    });

    it("should return error when user not found", async () => {
      setupAsAdmin();
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      const result = await updateUserRoles("nonexistent", ["USER"]);

      expect(result.success).toBe(false);
      expect(result.error).toBe("User not found");
    });

    it("should prevent removing admin from protected admin email", async () => {
      setupAsAdmin();
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        clerkId: "admin-clerk",
        email: "hi@deepshaswat.com",
      });

      const result = await updateUserRoles("admin-user", ["USER", "WRITER"]);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Cannot remove admin role from protected admin email",
      );
    });

    it("should update roles successfully for regular user", async () => {
      setupAsAdmin();
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        clerkId: "clerk-regular",
        email: "user@example.com",
      });
      mockPrisma.user.update.mockResolvedValueOnce({});

      const result = await updateUserRoles("user-1", ["USER", "WRITER"]);

      expect(result.success).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { role: ["USER", "WRITER"] },
      });
    });

    it("should allow keeping admin for protected emails", async () => {
      setupAsAdmin();
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        clerkId: "admin-clerk",
        email: "hi@deepshaswat.com",
      });
      mockPrisma.user.update.mockResolvedValueOnce({});

      const result = await updateUserRoles("admin-user", ["ADMIN", "WRITER"]);

      expect(result.success).toBe(true);
    });

    it("should handle database errors gracefully", async () => {
      setupAsAdmin();
      mockPrisma.user.findUnique.mockRejectedValueOnce(new Error("DB Error"));

      const result = await updateUserRoles("user-1", ["USER"]);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to update user roles");
    });
  });

  describe("getUserRolesByEmail", () => {
    it("should return roles for existing user", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        role: ["USER", "WRITER"],
      });

      const result = await getUserRolesByEmail("user@example.com");

      expect(result).toEqual(["USER", "WRITER"]);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "user@example.com" },
        select: { role: true },
      });
    });

    it("should return null for non-existent user", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      const result = await getUserRolesByEmail("nonexistent@example.com");

      expect(result).toBeNull();
    });
  });

  describe("syncUserRolesFromClerk", () => {
    it("should sync admin role for protected admin email", async () => {
      mockClerkClient.mockResolvedValue({
        users: {
          getUser: vi.fn().mockResolvedValue({
            id: "admin-clerk-id",
            emailAddresses: [
              { id: "email-1", emailAddress: "hi@deepshaswat.com" },
            ],
            primaryEmailAddressId: "email-1",
            publicMetadata: {},
          }),
        },
      });
      mockPrisma.user.update.mockResolvedValueOnce({});

      const result = await syncUserRolesFromClerk("admin-clerk-id");

      expect(result.success).toBe(true);
      expect(result.roles).toEqual(["ADMIN"]);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { clerkId: "admin-clerk-id" },
        data: { role: ["ADMIN"] },
      });
    });

    it("should sync roles from Clerk metadata", async () => {
      mockClerkClient.mockResolvedValue({
        users: {
          getUser: vi.fn().mockResolvedValue({
            id: "user-clerk-id",
            emailAddresses: [
              { id: "email-2", emailAddress: "user@example.com" },
            ],
            primaryEmailAddressId: "email-2",
            publicMetadata: { roles: ["writer", "creator"] },
          }),
        },
      });
      mockPrisma.user.update.mockResolvedValueOnce({});

      const result = await syncUserRolesFromClerk("user-clerk-id");

      expect(result.success).toBe(true);
      expect(result.roles).toEqual(["WRITER", "CREATOR"]);
    });

    it("should default to USER role when no roles in metadata", async () => {
      mockClerkClient.mockResolvedValue({
        users: {
          getUser: vi.fn().mockResolvedValue({
            id: "user-clerk-id",
            emailAddresses: [
              { id: "email-3", emailAddress: "noroles@example.com" },
            ],
            primaryEmailAddressId: "email-3",
            publicMetadata: {},
          }),
        },
      });
      mockPrisma.user.update.mockResolvedValueOnce({});

      const result = await syncUserRolesFromClerk("user-clerk-id");

      expect(result.success).toBe(true);
      expect(result.roles).toEqual(["USER"]);
    });

    it("should filter out invalid roles", async () => {
      mockClerkClient.mockResolvedValue({
        users: {
          getUser: vi.fn().mockResolvedValue({
            id: "user-clerk-id",
            emailAddresses: [
              { id: "email-4", emailAddress: "user@example.com" },
            ],
            primaryEmailAddressId: "email-4",
            publicMetadata: { roles: ["WRITER", "INVALID_ROLE", "SUPERADMIN"] },
          }),
        },
      });
      mockPrisma.user.update.mockResolvedValueOnce({});

      const result = await syncUserRolesFromClerk("user-clerk-id");

      expect(result.success).toBe(true);
      expect(result.roles).toEqual(["WRITER"]);
    });

    it("should default to USER when all roles are invalid", async () => {
      mockClerkClient.mockResolvedValue({
        users: {
          getUser: vi.fn().mockResolvedValue({
            id: "user-clerk-id",
            emailAddresses: [
              { id: "email-5", emailAddress: "user@example.com" },
            ],
            primaryEmailAddressId: "email-5",
            publicMetadata: { roles: ["INVALID", "FAKE"] },
          }),
        },
      });
      mockPrisma.user.update.mockResolvedValueOnce({});

      const result = await syncUserRolesFromClerk("user-clerk-id");

      expect(result.success).toBe(true);
      expect(result.roles).toEqual(["USER"]);
    });

    it("should handle errors gracefully", async () => {
      mockClerkClient.mockResolvedValue({
        users: {
          getUser: vi.fn().mockRejectedValue(new Error("Clerk error")),
        },
      });

      const result = await syncUserRolesFromClerk("bad-clerk-id");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to sync roles from Clerk");
    });
  });
});
