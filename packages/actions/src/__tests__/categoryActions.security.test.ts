/**
 * Tests for the real categoryActions implementation.
 *
 * `/categories` is a public discovery page (same pattern as the search
 * endpoints), so getCategoryData no longer auth-gates anonymous reads. The
 * gate broke the page for both anonymous visitors and SSR paths whose
 * Clerk cookies don't propagate. This file pins the *new* contract.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockAuth,
  mockRedisGet,
  mockRedisSet,
  mockCategoryFindMany,
  mockRedisClient,
  mockPrismaInstance,
} = vi.hoisted(() => {
  const mockAuth = vi.fn();
  const mockRedisGet = vi.fn();
  const mockRedisSet = vi.fn();
  const mockCategoryFindMany = vi.fn();
  const mockRedisClient = { get: mockRedisGet, set: mockRedisSet };
  const mockPrismaInstance = {
    category: {
      findMany: mockCategoryFindMany,
      findUnique: vi.fn(),
    },
    categoryMapping: {
      count: vi.fn(),
    },
  };
  return {
    mockAuth,
    mockRedisGet,
    mockRedisSet,
    mockCategoryFindMany,
    mockRedisClient,
    mockPrismaInstance,
  };
});

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("@ratecreator/db/client", () => ({
  getPrismaClient: vi.fn(() => mockPrismaInstance),
}));

vi.mock("@ratecreator/db/redis-do", () => ({
  getRedisClient: vi.fn(() => mockRedisClient),
  default: vi.fn(() => mockRedisClient),
}));

import {
  getCategoryData,
  getAllCategoriesAlphabetically,
  getSingleGlossaryCategory,
} from "../review/categories/categoryActions";

describe("getCategoryData (real source) — public read", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns cached data without consulting auth() for anonymous callers", async () => {
    const cached = [
      { id: "c1", name: "Tech", slug: "tech", subcategories: [] },
    ];
    mockRedisGet.mockResolvedValueOnce(JSON.stringify(cached));

    const result = await getCategoryData();
    expect(result).toEqual(cached);
    // Critical: the action must not call auth() — that's how it stays
    // usable from anonymous SSR paths where no Clerk cookie is present.
    expect(mockAuth).not.toHaveBeenCalled();
  });

  it("falls through to Prisma + caches when Redis is empty", async () => {
    mockRedisGet.mockResolvedValueOnce(null);
    mockCategoryFindMany.mockResolvedValueOnce([
      { id: "c1", name: "Tech", slug: "tech", parentId: null },
    ]);
    mockRedisSet.mockResolvedValue("OK");

    const result = await getCategoryData();
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("c1");
    expect(mockAuth).not.toHaveBeenCalled();
    expect(mockCategoryFindMany).toHaveBeenCalled();
  });
});

describe("Public glossary actions — remain accessible without auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getAllCategoriesAlphabetically does not require auth", async () => {
    // Powers the public /category-glossary page; must remain reachable.
    mockRedisGet.mockResolvedValueOnce(JSON.stringify({ A: [] }));

    const result = await getAllCategoriesAlphabetically();
    expect(result).toEqual({ A: [] });
    // Critically: did not call auth() at all.
    expect(mockAuth).not.toHaveBeenCalled();
  });

  it("getSingleGlossaryCategory does not require auth", async () => {
    mockRedisGet.mockResolvedValueOnce(
      JSON.stringify({
        category: { id: "c1", name: "Tech", slug: "tech" },
        accounts: 5,
      }),
    );

    const result = await getSingleGlossaryCategory("tech");
    expect(result.accounts).toBe(5);
    expect(mockAuth).not.toHaveBeenCalled();
  });
});
