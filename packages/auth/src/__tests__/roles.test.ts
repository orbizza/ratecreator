/**
 * Tests for Auth Roles utilities
 * Tests canAccessCreatorOps, canAccessContent, canAccessWeb, hasRole, isAdmin
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAuth, mockClerkClient } = vi.hoisted(() => {
  const mockAuth = vi.fn();
  const mockClerkClient = vi.fn();
  return { mockAuth, mockClerkClient };
});

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
  clerkClient: mockClerkClient,
}));

import {
  canAccessCreatorOps,
  canAccessContent,
  canAccessWeb,
  hasRole,
  isAdmin,
  getCurrentUserRoles,
} from "../roles";

function setupUser(roles: string[], email = "user@example.com") {
  mockAuth.mockResolvedValue({ userId: "clerk-123" });
  mockClerkClient.mockResolvedValue({
    users: {
      getUser: vi.fn().mockResolvedValue({
        id: "clerk-123",
        emailAddresses: [{ id: "email-1", emailAddress: email }],
        primaryEmailAddressId: "email-1",
        publicMetadata: { roles },
      }),
    },
  });
}

function setupUnauthenticated() {
  mockAuth.mockResolvedValue({ userId: null });
}

describe("Auth Roles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("canAccessCreatorOps", () => {
    it("should return true for CREATOR role", async () => {
      setupUser(["CREATOR"]);
      expect(await canAccessCreatorOps()).toBe(true);
    });

    it("should return true for WRITER role", async () => {
      setupUser(["WRITER"]);
      expect(await canAccessCreatorOps()).toBe(true);
    });

    it("should return true for ADMIN role", async () => {
      setupUser(["ADMIN"]);
      expect(await canAccessCreatorOps()).toBe(true);
    });

    it("should return false for USER-only role", async () => {
      setupUser(["USER"]);
      expect(await canAccessCreatorOps()).toBe(false);
    });

    it("should return false for BRAND-only role", async () => {
      setupUser(["BRAND"]);
      expect(await canAccessCreatorOps()).toBe(false);
    });

    it("should return true for user with USER and CREATOR roles", async () => {
      setupUser(["USER", "CREATOR"]);
      expect(await canAccessCreatorOps()).toBe(true);
    });

    it("should return false for unauthenticated user", async () => {
      setupUnauthenticated();
      expect(await canAccessCreatorOps()).toBe(false);
    });
  });

  describe("canAccessContent", () => {
    it("should return true for WRITER role", async () => {
      setupUser(["WRITER"]);
      expect(await canAccessContent()).toBe(true);
    });

    it("should return true for ADMIN role", async () => {
      setupUser(["ADMIN"]);
      expect(await canAccessContent()).toBe(true);
    });

    it("should return false for USER-only role", async () => {
      setupUser(["USER"]);
      expect(await canAccessContent()).toBe(false);
    });

    it("should return false for CREATOR-only role", async () => {
      setupUser(["CREATOR"]);
      expect(await canAccessContent()).toBe(false);
    });
  });

  describe("canAccessWeb", () => {
    it("should return true for USER role", async () => {
      setupUser(["USER"]);
      expect(await canAccessWeb()).toBe(true);
    });

    it("should return true for ADMIN role", async () => {
      setupUser(["ADMIN"]);
      expect(await canAccessWeb()).toBe(true);
    });
  });

  describe("isAdmin", () => {
    it("should return true for ADMIN role", async () => {
      setupUser(["ADMIN"]);
      expect(await isAdmin()).toBe(true);
    });

    it("should return false for non-ADMIN roles", async () => {
      setupUser(["USER", "CREATOR"]);
      expect(await isAdmin()).toBe(false);
    });

    it("should return true for protected admin email", async () => {
      setupUser(["USER"], "hi@deepshaswat.com");
      expect(await isAdmin()).toBe(true);
    });
  });

  describe("getCurrentUserRoles", () => {
    it("should return empty array for unauthenticated user", async () => {
      setupUnauthenticated();
      expect(await getCurrentUserRoles()).toEqual([]);
    });

    it("should return ADMIN for protected admin email", async () => {
      setupUser(["USER"], "hi@deepshaswat.com");
      expect(await getCurrentUserRoles()).toEqual(["ADMIN"]);
    });

    it("should return roles from metadata", async () => {
      setupUser(["USER", "WRITER"]);
      expect(await getCurrentUserRoles()).toEqual(["USER", "WRITER"]);
    });

    it("should default to USER when no roles in metadata", async () => {
      mockAuth.mockResolvedValue({ userId: "clerk-123" });
      mockClerkClient.mockResolvedValue({
        users: {
          getUser: vi.fn().mockResolvedValue({
            id: "clerk-123",
            emailAddresses: [
              { id: "email-1", emailAddress: "user@example.com" },
            ],
            primaryEmailAddressId: "email-1",
            publicMetadata: {},
          }),
        },
      });
      expect(await getCurrentUserRoles()).toEqual(["USER"]);
    });
  });
});
