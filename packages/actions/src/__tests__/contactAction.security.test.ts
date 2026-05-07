/**
 * Tests for the real contact action — Redis-backed rate limiting.
 * The neighboring contactAction.test.ts simulates contact() inline; this
 * file imports the actual exported function so the rate limiter is exercised.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockContactFormCreate, mockPrisma, mockRedis } = vi.hoisted(() => {
  const mockContactFormCreate = vi.fn();
  const mockPrisma = {
    contactForm: { create: mockContactFormCreate },
  };
  const mockRedis = {
    incr: vi.fn(),
    expire: vi.fn(),
  };
  return { mockContactFormCreate, mockPrisma, mockRedis };
});

vi.mock("@ratecreator/db/client", () => ({
  getPrismaClient: vi.fn(() => mockPrisma),
}));

vi.mock("@ratecreator/db/redis-do", () => ({
  getRedisClient: vi.fn(() => mockRedis),
}));

vi.mock("@ratecreator/types/review", () => ({
  ContactSchema: {
    safeParse: vi.fn((data) => ({ success: true, data })),
  },
}));

import { contact } from "../review/contact/contact";

describe("contact (real source) — rate limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContactFormCreate.mockResolvedValue({ id: "c1" });
  });

  it("creates ContactForm row on the first call and sets TTL on first hit", async () => {
    mockRedis.incr.mockResolvedValueOnce(1);
    mockRedis.expire.mockResolvedValueOnce(1);

    const result = await contact({
      email: "u@example.com",
      name: "U",
      message: "hi",
    });

    expect(result).toEqual({ success: "Message sent!" });
    expect(mockRedis.incr).toHaveBeenCalledWith("rl:contact:u@example.com");
    expect(mockRedis.expire).toHaveBeenCalledWith(
      "rl:contact:u@example.com",
      60 * 60,
    );
    expect(mockContactFormCreate).toHaveBeenCalled();
  });

  it("does not set TTL on subsequent calls in the same window", async () => {
    mockRedis.incr.mockResolvedValueOnce(2);

    await contact({
      email: "u@example.com",
      name: "U",
      message: "hi",
    });

    expect(mockRedis.expire).not.toHaveBeenCalled();
    expect(mockContactFormCreate).toHaveBeenCalled();
  });

  it("rejects the 6th submission from the same email within an hour", async () => {
    mockRedis.incr.mockResolvedValueOnce(6);

    const result = await contact({
      email: "u@example.com",
      name: "U",
      message: "hi",
    });

    expect(result).toEqual({
      error: "Too many messages. Please try again later.",
    });
    expect(mockContactFormCreate).not.toHaveBeenCalled();
  });

  it("normalizes email to lowercase for the rate-limit key", async () => {
    mockRedis.incr.mockResolvedValueOnce(1);
    mockRedis.expire.mockResolvedValueOnce(1);

    await contact({
      email: "Mixed.CASE@Example.COM",
      name: "U",
      message: "hi",
    });

    expect(mockRedis.incr).toHaveBeenCalledWith(
      "rl:contact:mixed.case@example.com",
    );
  });
});
