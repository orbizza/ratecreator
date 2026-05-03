/**
 * Tests for the real categoryActions implementation — auth gate verification.
 * The neighboring categoryActions.test.ts simulates behavior inline; this
 * file imports the actual exported `getCategoryData` to confirm the security
 * boundary added on the public `/categories` page.
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

describe("getCategoryData (real source) — auth gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws Unauthorized for signed-out callers and never queries Redis/Prisma", async () => {
    mockAuth.mockResolvedValueOnce({ userId: null });

    await expect(getCategoryData()).rejects.toThrow("Unauthorized");

    expect(mockRedisGet).not.toHaveBeenCalled();
    expect(mockCategoryFindMany).not.toHaveBeenCalled();
  });

  it("returns cached data for signed-in callers", async () => {
    mockAuth.mockResolvedValueOnce({ userId: "user-1" });
    const cached = [
      { id: "c1", name: "Tech", slug: "tech", subcategories: [] },
    ];
    mockRedisGet.mockResolvedValueOnce(JSON.stringify(cached));

    const result = await getCategoryData();
    expect(result).toEqual(cached);
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
