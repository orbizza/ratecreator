/**
 * Tests for Search Categories API Route — public read with per-IP rate limit.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const { mockSearchCategories, mockRateLimitOk } = vi.hoisted(() => {
  const mockSearchCategories = vi.fn();
  const mockRateLimitOk = vi.fn();
  return { mockSearchCategories, mockRateLimitOk };
});

vi.mock("@ratecreator/db/elasticsearch-client", () => ({
  searchCategories: mockSearchCategories,
}));

vi.mock("../../../lib/search-rate-limit", () => ({
  searchRateLimitOk: mockRateLimitOk,
}));

import { GET } from "../search/categories/route";

describe("Search Categories API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimitOk.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createRequest = (qs = "") =>
    new NextRequest(
      new URL(`http://localhost:3000/api/search/categories${qs}`),
    );

  it("returns 429 when per-IP rate limit exceeded and never queries ES", async () => {
    mockRateLimitOk.mockResolvedValueOnce(false);

    const response = await GET(createRequest("?query=tech"));
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toBe("Too many requests");
    expect(mockSearchCategories).not.toHaveBeenCalled();
  });

  it("returns empty hits when query is blank without calling ES", async () => {
    const response = await GET(createRequest("?query="));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ hits: [] });
    expect(mockSearchCategories).not.toHaveBeenCalled();
  });

  it("calls ES and applies the limit cap for anonymous callers", async () => {
    const hits = Array.from({ length: 50 }, (_, i) => ({ id: `c${i}` }));
    mockSearchCategories.mockResolvedValueOnce(hits);

    const response = await GET(createRequest("?query=tech&limit=15"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockSearchCategories).toHaveBeenCalledWith("tech");
    expect(data.hits).toHaveLength(15);
  });

  it("uses default limit of 20 when not specified", async () => {
    const hits = Array.from({ length: 50 }, (_, i) => ({ id: `c${i}` }));
    mockSearchCategories.mockResolvedValueOnce(hits);

    const response = await GET(createRequest("?query=tech"));
    const data = await response.json();

    expect(data.hits).toHaveLength(20);
  });

  it("sets Cache-Control to public with short s-maxage (catalog data)", async () => {
    mockSearchCategories.mockResolvedValueOnce([{ id: "c1" }]);

    const response = await GET(createRequest("?query=tech"));

    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=0, s-maxage=60",
    );
  });

  it("returns 500 when ES throws", async () => {
    mockSearchCategories.mockRejectedValueOnce(new Error("ES down"));

    const response = await GET(createRequest("?query=tech"));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to search categories");
  });
});
