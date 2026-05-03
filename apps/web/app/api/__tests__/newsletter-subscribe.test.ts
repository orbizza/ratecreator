/**
 * Tests for /api/newsletter/subscribe — Redis-backed rate limiting.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const { mockPrisma, mockRedis, mockSendEmail, mockGenerateVerifyToken } =
  vi.hoisted(() => {
    const mockPrisma = {
      newsletterSubscriber: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    };
    const mockRedis = {
      incr: vi.fn(),
      expire: vi.fn(),
    };
    const mockSendEmail = vi.fn(() => Promise.resolve(undefined));
    const mockGenerateVerifyToken = vi.fn(() => "tok-1");
    return {
      mockPrisma,
      mockRedis,
      mockSendEmail,
      mockGenerateVerifyToken,
    };
  });

vi.mock("@ratecreator/db/client", () => ({
  getPrismaClient: vi.fn(() => mockPrisma),
}));

vi.mock("@ratecreator/db/redis-do", () => ({
  getRedisClient: vi.fn(() => mockRedis),
}));

vi.mock("@ratecreator/email", () => ({
  generateVerifyToken: mockGenerateVerifyToken,
  sendEmail: mockSendEmail,
  NewsletterVerifyEmail: vi.fn(),
  BASE_URL: "http://localhost:3000",
}));

import { POST } from "../newsletter/subscribe/route";

describe("Newsletter subscribe rate limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue(null);
    mockPrisma.newsletterSubscriber.create.mockResolvedValue({ id: "s-1" });
    // Ensure the mocked sendEmail returns a thenable so route's `.catch` works.
    mockSendEmail.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const buildRequest = (body: object, ip = "1.2.3.4") =>
    new NextRequest("http://localhost:3000/api/newsletter/subscribe", {
      method: "POST",
      headers: { "x-forwarded-for": ip, "content-type": "application/json" },
      body: JSON.stringify(body),
    });

  it("uses Redis incr+expire and accepts the 1st request", async () => {
    mockRedis.incr.mockResolvedValueOnce(1);
    mockRedis.expire.mockResolvedValueOnce(1);

    const response = await POST(
      buildRequest({ email: "a@example.com", name: "A" }),
    );

    expect(response.status).toBe(200);
    expect(mockRedis.incr).toHaveBeenCalledWith(
      "rl:newsletter:subscribe:1.2.3.4",
    );
    expect(mockRedis.expire).toHaveBeenCalledWith(
      "rl:newsletter:subscribe:1.2.3.4",
      60,
    );
  });

  it("does NOT call expire on subsequent requests in the same window", async () => {
    mockRedis.incr.mockResolvedValueOnce(5);

    const response = await POST(
      buildRequest({ email: "a@example.com", name: "A" }),
    );

    expect(response.status).toBe(200);
    expect(mockRedis.expire).not.toHaveBeenCalled();
  });

  it("returns 429 once the IP exceeds the limit", async () => {
    mockRedis.incr.mockResolvedValueOnce(11);

    const response = await POST(
      buildRequest({ email: "a@example.com", name: "A" }),
    );
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toBe("Too many requests. Please try again later.");
    expect(mockPrisma.newsletterSubscriber.findUnique).not.toHaveBeenCalled();
  });

  it("uses 'unknown' bucket when x-forwarded-for is missing", async () => {
    mockRedis.incr.mockResolvedValueOnce(1);
    mockRedis.expire.mockResolvedValueOnce(1);

    const request = new NextRequest(
      "http://localhost:3000/api/newsletter/subscribe",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "a@example.com", name: "A" }),
      },
    );

    await POST(request);

    expect(mockRedis.incr).toHaveBeenCalledWith(
      "rl:newsletter:subscribe:unknown",
    );
  });
});
