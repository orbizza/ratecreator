/**
 * Tests for Search Categories API Route — auth gate + cache header.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const { mockSearchCategories, mockAuth } = vi.hoisted(() => {
  const mockSearchCategories = vi.fn();
  const mockAuth = vi.fn();
  return { mockSearchCategories, mockAuth };
});

vi.mock("@ratecreator/db/elasticsearch-client", () => ({
  searchCategories: mockSearchCategories,
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

import { GET } from "../search/categories/route";

describe("Search Categories API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: "user-1" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createRequest = (qs = "") =>
    new NextRequest(
      new URL(`http://localhost:3000/api/search/categories${qs}`),
    );

  it("returns 401 for unauthenticated callers and never queries ES", async () => {
    mockAuth.mockResolvedValueOnce({ userId: null });

    const response = await GET(createRequest("?query=tech"));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
    expect(mockSearchCategories).not.toHaveBeenCalled();
  });

  it("returns empty hits when query is blank without calling ES", async () => {
    const response = await GET(createRequest("?query="));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ hits: [] });
    expect(mockSearchCategories).not.toHaveBeenCalled();
  });

  it("calls ES and applies the limit cap", async () => {
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

  it("sets Cache-Control to private/no-store (responses are user-scoped)", async () => {
    mockSearchCategories.mockResolvedValueOnce([{ id: "c1" }]);

    const response = await GET(createRequest("?query=tech"));

    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("returns 500 when ES throws", async () => {
    mockSearchCategories.mockRejectedValueOnce(new Error("ES down"));

    const response = await GET(createRequest("?query=tech"));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to search categories");
  });
});
