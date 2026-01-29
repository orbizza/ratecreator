/**
 * Tests for Categories API Route
 * Tests category fetching with different types and caching
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Use vi.hoisted for mocks
const { mockRedis, mockPrisma, mockMongoClient } = vi.hoisted(() => {
  const mockRedis = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  };

  const mockPrisma = {
    category: {
      findMany: vi.fn(),
    },
  };

  const mockCollection = {
    find: vi.fn(() => ({
      toArray: vi.fn(),
    })),
  };

  const mockDb = {
    collection: vi.fn(() => mockCollection),
  };

  const mockMongoClient = {
    db: vi.fn(() => mockDb),
  };

  return { mockRedis, mockPrisma, mockMongoClient, mockCollection, mockDb };
});

// Mock modules
vi.mock("@ratecreator/db/redis-do", () => ({
  getRedisClient: vi.fn(() => mockRedis),
}));

vi.mock("@ratecreator/db/client", () => ({
  getPrismaClient: vi.fn(() => mockPrisma),
}));

vi.mock("@ratecreator/db/mongo-client", () => ({
  getMongoClient: vi.fn(() => Promise.resolve(mockMongoClient)),
}));

vi.mock("@ratecreator/types/review", () => ({
  Account: {},
  Category: {},
  PopularCategory: {},
}));

vi.mock("mongodb", () => ({
  ObjectId: vi.fn((id) => ({ toString: () => id })),
}));

import { GET } from "../categories/route";

describe("Categories API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createRequest = (type: string) => {
    const url = new URL("http://localhost:3000/api/categories");
    url.searchParams.set("type", type);
    return new NextRequest(url);
  };

  describe("Parameter Validation", () => {
    it("should return 400 for invalid category type", async () => {
      const request = createRequest("invalid");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid category type");
    });

    it("should return 400 when type is not provided", async () => {
      const url = new URL("http://localhost:3000/api/categories");
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid category type");
    });
  });

  describe("All Categories (type=all)", () => {
    const mockCategories = [
      { id: "1", name: "Tech", slug: "tech", depth: 0, parentId: null },
      {
        id: "2",
        name: "Software",
        slug: "software",
        depth: 1,
        parentId: "1",
      },
      { id: "3", name: "Gaming", slug: "gaming", depth: 0, parentId: null },
    ];

    it("should return cached categories if available", async () => {
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(mockCategories));

      const request = createRequest("all");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockCategories);
      expect(mockPrisma.category.findMany).not.toHaveBeenCalled();
    });

    it("should fetch from database and cache when cache miss", async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      mockPrisma.category.findMany.mockResolvedValueOnce(mockCategories);

      const request = createRequest("all");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockCategories);
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        orderBy: { depth: "asc" },
      });
      expect(mockRedis.set).toHaveBeenCalledWith(
        "category-all",
        JSON.stringify(mockCategories),
      );
    });

    it("should order categories by depth", async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      mockPrisma.category.findMany.mockResolvedValueOnce(mockCategories);

      const request = createRequest("all");
      await GET(request);

      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        orderBy: { depth: "asc" },
      });
    });
  });

  describe("Root Categories (type=root)", () => {
    const mockCategories = [
      { id: "1", name: "Tech", slug: "tech", depth: 0, parentId: null },
      {
        id: "2",
        name: "Software",
        slug: "software",
        depth: 1,
        parentId: "1",
      },
      { id: "3", name: "Web Dev", slug: "web-dev", depth: 2, parentId: "2" },
      { id: "4", name: "Gaming", slug: "gaming", depth: 0, parentId: null },
    ];

    it("should return cached root categories if available", async () => {
      const rootCats = [
        { id: "1", name: "Tech", slug: "tech", subcategories: [] },
      ];
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(rootCats));

      const request = createRequest("root");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(rootCats);
    });

    it("should build hierarchical structure from flat list", async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      mockPrisma.category.findMany.mockResolvedValueOnce(mockCategories);

      const request = createRequest("root");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Should only have root categories (depth=0)
      expect(data.length).toBe(2);
      expect(data[0].name).toBe("Tech");
      expect(data[1].name).toBe("Gaming");
    });

    it("should nest subcategories under parents", async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      mockPrisma.category.findMany.mockResolvedValueOnce(mockCategories);

      const request = createRequest("root");
      const response = await GET(request);
      const data = await response.json();

      // Tech should have Software as subcategory
      const techCategory = data.find((c: any) => c.name === "Tech");
      expect(techCategory.subcategories).toBeDefined();
      expect(techCategory.subcategories.length).toBe(1);
      expect(techCategory.subcategories[0].name).toBe("Software");
    });

    it("should cache both root and all categories", async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      mockPrisma.category.findMany.mockResolvedValueOnce(mockCategories);

      const request = createRequest("root");
      await GET(request);

      expect(mockRedis.set).toHaveBeenCalledWith(
        "category-all",
        expect.any(String),
      );
      expect(mockRedis.set).toHaveBeenCalledWith(
        "category-root",
        expect.any(String),
      );
    });
  });

  describe("Popular Categories (type=popular-categories)", () => {
    const mockPopularCategories = [
      { id: "1", name: "Tech", slug: "tech" },
      { id: "2", name: "Gaming", slug: "gaming" },
    ];

    it("should return cached popular categories if available", async () => {
      mockRedis.get.mockResolvedValueOnce(
        JSON.stringify(mockPopularCategories),
      );

      const request = createRequest("popular-categories");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockPopularCategories);
    });

    it("should fetch popular categories with popular=true filter", async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      mockPrisma.category.findMany.mockResolvedValueOnce(mockPopularCategories);

      const request = createRequest("popular-categories");
      const response = await GET(request);

      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        where: { popular: true },
        select: { id: true, name: true, slug: true },
      });
    });

    it("should cache popular categories", async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      mockPrisma.category.findMany.mockResolvedValueOnce(mockPopularCategories);

      const request = createRequest("popular-categories");
      await GET(request);

      expect(mockRedis.set).toHaveBeenCalledWith(
        "category-popular",
        JSON.stringify(mockPopularCategories),
      );
    });
  });

  describe("Popular Category Data (type=popular-cat-data)", () => {
    it("should return cached full response if available", async () => {
      const cachedData = [
        {
          category: { id: "1", name: "Tech", slug: "tech" },
          accounts: [{ name: "Account 1" }],
        },
      ];
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(cachedData));

      const request = createRequest("popular-cat-data");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(cachedData);
    });
  });

  describe("Error Handling", () => {
    it("should return 500 on database error", async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      mockPrisma.category.findMany.mockRejectedValueOnce(
        new Error("Database error"),
      );

      const request = createRequest("all");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch categories");
    });

    it("should return 500 on redis error", async () => {
      mockRedis.get.mockRejectedValueOnce(new Error("Redis error"));

      const request = createRequest("all");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch categories");
    });

    it("should handle empty category list", async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      mockPrisma.category.findMany.mockResolvedValueOnce([]);

      const request = createRequest("all");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });
  });
});
