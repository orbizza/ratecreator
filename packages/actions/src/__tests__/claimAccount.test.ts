/**
 * Tests for Account Claiming Actions
 * Tests account claiming and verification flows
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocks
const { mockPrisma, mockAuth } = vi.hoisted(() => {
  const mockPrisma = {
    user: {
      findFirst: vi.fn(),
    },
    account: {
      findUnique: vi.fn(),
    },
    claimedAccount: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    userLinkedAccount: {
      upsert: vi.fn(),
    },
  };

  const mockAuth = vi.fn();

  return { mockPrisma, mockAuth };
});

// Mock modules
vi.mock("@ratecreator/db/client", () => ({
  getPrismaClient: vi.fn(() => mockPrisma),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

import { claimAccount, verifyClaim } from "../account/claimAccount";

describe("Account Claiming Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockUser = {
    id: "user-123",
    clerkId: "clerk-123",
    email: "test@example.com",
    name: "Test User",
  };

  const mockAccount = {
    id: "account-123",
    accountId: "yt-channel-123",
    platform: "YOUTUBE",
    name: "Test Channel",
  };

  describe("claimAccount", () => {
    it("should return unauthorized if no user is authenticated", async () => {
      mockAuth.mockResolvedValueOnce({ userId: null });

      const result = await claimAccount({ accountId: "account-123" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("should return error if user is not found in database", async () => {
      mockAuth.mockResolvedValueOnce({ userId: "clerk-123" });
      mockPrisma.user.findFirst.mockResolvedValueOnce(null);

      const result = await claimAccount({ accountId: "account-123" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("User not found");
    });

    it("should return error if account does not exist", async () => {
      mockAuth.mockResolvedValueOnce({ userId: "clerk-123" });
      mockPrisma.user.findFirst.mockResolvedValueOnce(mockUser);
      mockPrisma.account.findUnique.mockResolvedValueOnce(null);

      const result = await claimAccount({ accountId: "non-existent" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Account not found");
    });

    it("should return existing claim if user already claimed this account", async () => {
      const existingClaim = {
        id: "claim-123",
        userId: "user-123",
        accountId: "account-123",
        status: "PENDING",
      };

      mockAuth.mockResolvedValueOnce({ userId: "clerk-123" });
      mockPrisma.user.findFirst.mockResolvedValueOnce(mockUser);
      mockPrisma.account.findUnique.mockResolvedValueOnce(mockAccount);
      mockPrisma.claimedAccount.findFirst.mockResolvedValueOnce(existingClaim);

      const result = await claimAccount({ accountId: "account-123" });

      expect(result.success).toBe(true);
      expect(result.claimId).toBe("claim-123");
      expect(result.status).toBe("PENDING");
    });

    it("should return error if account is already verified by another user", async () => {
      const verifiedClaim = {
        id: "claim-other",
        userId: "other-user",
        accountId: "account-123",
        status: "VERIFIED",
      };

      mockAuth.mockResolvedValueOnce({ userId: "clerk-123" });
      mockPrisma.user.findFirst.mockResolvedValueOnce(mockUser);
      mockPrisma.account.findUnique.mockResolvedValueOnce(mockAccount);
      mockPrisma.claimedAccount.findFirst
        .mockResolvedValueOnce(null) // User's own claim
        .mockResolvedValueOnce(verifiedClaim); // Verified by another

      const result = await claimAccount({ accountId: "account-123" });

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "This account has already been claimed by another user",
      );
    });

    it("should create a new claim successfully", async () => {
      const newClaim = {
        id: "claim-new",
        userId: "user-123",
        accountId: "account-123",
        platform: "youtube",
        status: "PENDING",
      };

      mockAuth.mockResolvedValueOnce({ userId: "clerk-123" });
      mockPrisma.user.findFirst.mockResolvedValueOnce(mockUser);
      mockPrisma.account.findUnique.mockResolvedValueOnce(mockAccount);
      mockPrisma.claimedAccount.findFirst
        .mockResolvedValueOnce(null) // User's own claim
        .mockResolvedValueOnce(null); // Verified by another
      mockPrisma.claimedAccount.create.mockResolvedValueOnce(newClaim);

      const result = await claimAccount({ accountId: "account-123" });

      expect(result.success).toBe(true);
      expect(result.claimId).toBe("claim-new");
      expect(result.status).toBe("PENDING");
      expect(mockPrisma.claimedAccount.create).toHaveBeenCalledWith({
        data: {
          userId: "user-123",
          accountId: "account-123",
          platform: "youtube",
          status: "PENDING",
        },
      });
    });

    it("should use provided platform if specified", async () => {
      const newClaim = {
        id: "claim-new",
        userId: "user-123",
        accountId: "account-123",
        platform: "tiktok",
        status: "PENDING",
      };

      mockAuth.mockResolvedValueOnce({ userId: "clerk-123" });
      mockPrisma.user.findFirst.mockResolvedValueOnce(mockUser);
      mockPrisma.account.findUnique.mockResolvedValueOnce(mockAccount);
      mockPrisma.claimedAccount.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      mockPrisma.claimedAccount.create.mockResolvedValueOnce(newClaim);

      const result = await claimAccount({
        accountId: "account-123",
        platform: "tiktok",
      });

      expect(result.success).toBe(true);
      expect(mockPrisma.claimedAccount.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          platform: "tiktok",
        }),
      });
    });

    it("should handle database errors gracefully", async () => {
      mockAuth.mockResolvedValueOnce({ userId: "clerk-123" });
      mockPrisma.user.findFirst.mockRejectedValueOnce(
        new Error("DB connection failed"),
      );

      const result = await claimAccount({ accountId: "account-123" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("DB connection failed");
    });
  });

  describe("verifyClaim", () => {
    const mockClaim = {
      id: "claim-123",
      userId: "user-123",
      accountId: "account-123",
      platform: "youtube",
      status: "PENDING",
      account: {
        id: "account-123",
        accountId: "yt-channel-123",
      },
    };

    it("should return unauthorized if no user is authenticated", async () => {
      mockAuth.mockResolvedValueOnce({ userId: null });

      const result = await verifyClaim({
        claimId: "claim-123",
        verificationMethod: "oauth",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("should return error if user not found", async () => {
      mockAuth.mockResolvedValueOnce({ userId: "clerk-123" });
      mockPrisma.user.findFirst.mockResolvedValueOnce(null);

      const result = await verifyClaim({
        claimId: "claim-123",
        verificationMethod: "oauth",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("User not found");
    });

    it("should return error if claim not found", async () => {
      mockAuth.mockResolvedValueOnce({ userId: "clerk-123" });
      mockPrisma.user.findFirst.mockResolvedValueOnce(mockUser);
      mockPrisma.claimedAccount.findFirst.mockResolvedValueOnce(null);

      const result = await verifyClaim({
        claimId: "non-existent",
        verificationMethod: "oauth",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Claim not found");
    });

    it("should return success if claim is already verified", async () => {
      const verifiedClaim = { ...mockClaim, status: "VERIFIED" };

      mockAuth.mockResolvedValueOnce({ userId: "clerk-123" });
      mockPrisma.user.findFirst.mockResolvedValueOnce(mockUser);
      mockPrisma.claimedAccount.findFirst.mockResolvedValueOnce(verifiedClaim);

      const result = await verifyClaim({
        claimId: "claim-123",
        verificationMethod: "oauth",
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe("VERIFIED");
    });

    it("should refuse oauth verification (flow not yet implemented)", async () => {
      // verifyClaim no longer trusts client-supplied oauth data — the
      // verification handshake must happen server-side via the platform's
      // OAuth flow. Until that is implemented, oauth always fails.
      mockAuth.mockResolvedValueOnce({ userId: "clerk-123" });
      mockPrisma.user.findFirst.mockResolvedValueOnce(mockUser);
      mockPrisma.claimedAccount.findFirst.mockResolvedValueOnce(mockClaim);

      const result = await verifyClaim({
        claimId: "claim-123",
        verificationMethod: "oauth",
        verificationData: { platformUserId: "yt-channel-123" },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Verification flow not yet implemented");
      // No update should happen
      expect(mockPrisma.claimedAccount.update).not.toHaveBeenCalled();
      expect(mockPrisma.userLinkedAccount.upsert).not.toHaveBeenCalled();
    });

    it("should not link account when oauth verification is disabled", async () => {
      // Even with "matching" oauth data, no linked account is created
      // because the verification path now short-circuits.
      mockAuth.mockResolvedValueOnce({ userId: "clerk-123" });
      mockPrisma.user.findFirst.mockResolvedValueOnce(mockUser);
      mockPrisma.claimedAccount.findFirst.mockResolvedValueOnce(mockClaim);

      await verifyClaim({
        claimId: "claim-123",
        verificationMethod: "oauth",
        verificationData: { platformUserId: "yt-channel-123" },
      });

      expect(mockPrisma.userLinkedAccount.upsert).not.toHaveBeenCalled();
    });

    it("should refuse oauth verification regardless of client-supplied data", async () => {
      // The earlier behavior trusted whatever platformUserId the caller sent
      // and would have "succeeded" when it matched. The new behavior never
      // trusts client-supplied oauth identity.
      mockAuth.mockResolvedValueOnce({ userId: "clerk-123" });
      mockPrisma.user.findFirst.mockResolvedValueOnce(mockUser);
      mockPrisma.claimedAccount.findFirst.mockResolvedValueOnce(mockClaim);

      const result = await verifyClaim({
        claimId: "claim-123",
        verificationMethod: "oauth",
        verificationData: { platformUserId: "different-channel-id" },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Verification flow not yet implemented");
    });

    it("should return error for invalid verification method", async () => {
      mockAuth.mockResolvedValueOnce({ userId: "clerk-123" });
      mockPrisma.user.findFirst.mockResolvedValueOnce(mockUser);
      mockPrisma.claimedAccount.findFirst.mockResolvedValueOnce(mockClaim);

      const result = await verifyClaim({
        claimId: "claim-123",
        verificationMethod: "invalid_method",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid verification method");
    });

    it("should not verify with bio_link method (placeholder)", async () => {
      mockAuth.mockResolvedValueOnce({ userId: "clerk-123" });
      mockPrisma.user.findFirst.mockResolvedValueOnce(mockUser);
      mockPrisma.claimedAccount.findFirst.mockResolvedValueOnce(mockClaim);

      const result = await verifyClaim({
        claimId: "claim-123",
        verificationMethod: "bio_link",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Verification flow not yet implemented");
    });

    it("should not verify with dns method (placeholder)", async () => {
      mockAuth.mockResolvedValueOnce({ userId: "clerk-123" });
      mockPrisma.user.findFirst.mockResolvedValueOnce(mockUser);
      mockPrisma.claimedAccount.findFirst.mockResolvedValueOnce(mockClaim);

      const result = await verifyClaim({
        claimId: "claim-123",
        verificationMethod: "dns",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Verification flow not yet implemented");
    });

    it("should not verify with meta_tag method (placeholder)", async () => {
      mockAuth.mockResolvedValueOnce({ userId: "clerk-123" });
      mockPrisma.user.findFirst.mockResolvedValueOnce(mockUser);
      mockPrisma.claimedAccount.findFirst.mockResolvedValueOnce(mockClaim);

      const result = await verifyClaim({
        claimId: "claim-123",
        verificationMethod: "meta_tag",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Verification flow not yet implemented");
    });

    it("should handle database errors gracefully", async () => {
      mockAuth.mockResolvedValueOnce({ userId: "clerk-123" });
      mockPrisma.user.findFirst.mockRejectedValueOnce(new Error("DB timeout"));

      const result = await verifyClaim({
        claimId: "claim-123",
        verificationMethod: "oauth",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("DB timeout");
    });
  });
});
