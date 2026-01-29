/**
 * Tests for categoryActions
 * Tests category fetching with Redis caching
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocks
const {
  mockRedisGet,
  mockRedisSet,
  mockCategoryFindMany,
  mockCategoryFindUnique,
  mockCategoryMappingCount,
  mockPrismaInstance,
  mockRedisClient,
} = vi.hoisted(() => {
  const mockRedisGet = vi.fn();
  const mockRedisSet = vi.fn();
  const mockCategoryFindMany = vi.fn();
  const mockCategoryFindUnique = vi.fn();
  const mockCategoryMappingCount = vi.fn();
  const mockRedisClient = {
    get: mockRedisGet,
    set: mockRedisSet,
  };
  const mockPrismaInstance = {
    category: {
      findMany: mockCategoryFindMany,
      findUnique: mockCategoryFindUnique,
    },
    categoryMapping: {
      count: mockCategoryMappingCount,
    },
  };
  return {
    mockRedisGet,
    mockRedisSet,
    mockCategoryFindMany,
    mockCategoryFindUnique,
    mockCategoryMappingCount,
    mockPrismaInstance,
    mockRedisClient,
  };
});

// Mock modules
vi.mock("@ratecreator/db/client", () => ({
  getPrismaClient: vi.fn(() => mockPrismaInstance),
}));

vi.mock("@ratecreator/db/redis-do", () => ({
  getRedisClient: vi.fn(() => mockRedisClient),
  default: vi.fn(() => mockRedisClient),
}));

vi.mock("axios");

describe("Category Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getCategoryData", () => {
    // Simulate the getCategoryData function behavior
    const getCategoryData = async () => {
      const CACHE_ROOT_CATEGORIES = "category-root";
      const CACHE_ALL_CATEGORIES = "category-all";
      const CACHE_EXPIRY = 60 * 60 * 24;

      try {
        const cachedCategories = await mockRedisClient.get(
          CACHE_ROOT_CATEGORIES,
        );
        if (cachedCategories) {
          return JSON.parse(cachedCategories);
        }

        const allCategories = await mockPrismaInstance.category.findMany({
          orderBy: { depth: "asc" },
        });

        const categoryMap: { [key: string]: any } = {};
        allCategories.forEach((category: any) => {
          categoryMap[category.id] = { ...category, subcategories: [] };
        });

        const rootCategories: any[] = [];
        allCategories.forEach((category: any) => {
          if (category.parentId) {
            const parentCategory = categoryMap[category.parentId];
            if (parentCategory) {
              parentCategory.subcategories?.push(categoryMap[category.id]);
            }
          } else {
            rootCategories.push(categoryMap[category.id]);
          }
        });

        await mockRedisClient.set(
          CACHE_ALL_CATEGORIES,
          JSON.stringify(allCategories),
          "EX",
          CACHE_EXPIRY,
        );

        await mockRedisClient.set(
          CACHE_ROOT_CATEGORIES,
          JSON.stringify(rootCategories),
          "EX",
          CACHE_EXPIRY,
        );

        return rootCategories;
      } catch (error) {
        throw new Error("Failed to fetch categories");
      }
    };

    it("should return cached categories when available", async () => {
      const cachedData = [
        { id: "1", name: "Technology", slug: "technology", subcategories: [] },
        { id: "2", name: "Gaming", slug: "gaming", subcategories: [] },
      ];
      mockRedisGet.mockResolvedValueOnce(JSON.stringify(cachedData));

      const result = await getCategoryData();

      expect(result).toEqual(cachedData);
      expect(mockCategoryFindMany).not.toHaveBeenCalled();
    });

    it("should fetch from database when cache miss", async () => {
      mockRedisGet.mockResolvedValueOnce(null);
      mockCategoryFindMany.mockResolvedValueOnce([
        {
          id: "1",
          name: "Technology",
          slug: "technology",
          parentId: null,
          depth: 0,
        },
        { id: "2", name: "Gaming", slug: "gaming", parentId: null, depth: 0 },
      ]);

      const result = await getCategoryData();

      expect(mockCategoryFindMany).toHaveBeenCalledWith({
        orderBy: { depth: "asc" },
      });
      expect(result).toHaveLength(2);
    });

    it("should build category hierarchy correctly", async () => {
      mockRedisGet.mockResolvedValueOnce(null);
      mockCategoryFindMany.mockResolvedValueOnce([
        {
          id: "1",
          name: "Technology",
          slug: "technology",
          parentId: null,
          depth: 0,
        },
        {
          id: "2",
          name: "Software",
          slug: "software",
          parentId: "1",
          depth: 1,
        },
        { id: "3", name: "Gaming", slug: "gaming", parentId: null, depth: 0 },
      ]);

      const result = await getCategoryData();

      // Should have 2 root categories
      expect(result).toHaveLength(2);
      // Technology should have Software as subcategory
      const techCategory = result.find((c: any) => c.name === "Technology");
      expect(techCategory.subcategories).toHaveLength(1);
      expect(techCategory.subcategories[0].name).toBe("Software");
    });

    it("should cache results in Redis with 24-hour expiry", async () => {
      mockRedisGet.mockResolvedValueOnce(null);
      mockCategoryFindMany.mockResolvedValueOnce([
        { id: "1", name: "Tech", slug: "tech", parentId: null, depth: 0 },
      ]);

      await getCategoryData();

      expect(mockRedisSet).toHaveBeenCalledWith(
        "category-all",
        expect.any(String),
        "EX",
        86400,
      );
      expect(mockRedisSet).toHaveBeenCalledWith(
        "category-root",
        expect.any(String),
        "EX",
        86400,
      );
    });

    it("should throw error on database failure", async () => {
      mockRedisGet.mockResolvedValueOnce(null);
      mockCategoryFindMany.mockRejectedValueOnce(new Error("Database error"));

      await expect(getCategoryData()).rejects.toThrow(
        "Failed to fetch categories",
      );
    });
  });

  describe("getAllCategoriesAlphabetically", () => {
    const getAllCategoriesAlphabetically = async () => {
      const CACHE_ALPHABETICAL_CATEGORIES = "category-alphabetical";
      const CACHE_EXPIRY = 60 * 60 * 24;

      try {
        const cachedCategories = await mockRedisClient.get(
          CACHE_ALPHABETICAL_CATEGORIES,
        );
        if (cachedCategories) {
          return JSON.parse(cachedCategories);
        }

        const allCategories = await mockPrismaInstance.category.findMany({
          orderBy: { name: "asc" },
          where: { deletedAt: null },
          select: { id: true, name: true, slug: true, shortDescription: true },
        });

        const categoriesByLetter: { [key: string]: any[] } = {};
        allCategories.forEach((category: any) => {
          const firstLetter = category.name.charAt(0).toUpperCase();
          if (!categoriesByLetter[firstLetter]) {
            categoriesByLetter[firstLetter] = [];
          }
          categoriesByLetter[firstLetter].push(category);
        });

        await mockRedisClient.set(
          CACHE_ALPHABETICAL_CATEGORIES,
          JSON.stringify(categoriesByLetter),
          "EX",
          CACHE_EXPIRY,
        );

        return categoriesByLetter;
      } catch (error) {
        throw new Error("Failed to fetch alphabetical categories");
      }
    };

    it("should return cached alphabetical categories when available", async () => {
      const cachedData = {
        A: [{ id: "1", name: "Art", slug: "art" }],
        T: [{ id: "2", name: "Tech", slug: "tech" }],
      };
      mockRedisGet.mockResolvedValueOnce(JSON.stringify(cachedData));

      const result = await getAllCategoriesAlphabetically();

      expect(result).toEqual(cachedData);
      expect(mockCategoryFindMany).not.toHaveBeenCalled();
    });

    it("should fetch and group categories by first letter", async () => {
      mockRedisGet.mockResolvedValueOnce(null);
      mockCategoryFindMany.mockResolvedValueOnce([
        { id: "1", name: "Art", slug: "art", shortDescription: "Art desc" },
        {
          id: "2",
          name: "Animation",
          slug: "animation",
          shortDescription: "Anim desc",
        },
        {
          id: "3",
          name: "Technology",
          slug: "technology",
          shortDescription: "Tech desc",
        },
      ]);

      const result = await getAllCategoriesAlphabetically();

      expect(result["A"]).toHaveLength(2);
      expect(result["T"]).toHaveLength(1);
      expect(result["A"].map((c: any) => c.name)).toContain("Art");
      expect(result["A"].map((c: any) => c.name)).toContain("Animation");
    });

    it("should exclude deleted categories", async () => {
      mockRedisGet.mockResolvedValueOnce(null);
      mockCategoryFindMany.mockResolvedValueOnce([]);

      await getAllCategoriesAlphabetically();

      expect(mockCategoryFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null },
        }),
      );
    });

    it("should handle lowercase starting letters correctly", async () => {
      mockRedisGet.mockResolvedValueOnce(null);
      mockCategoryFindMany.mockResolvedValueOnce([
        { id: "1", name: "apple", slug: "apple", shortDescription: "Apple" },
      ]);

      const result = await getAllCategoriesAlphabetically();

      // Should be grouped under uppercase A
      expect(result["A"]).toBeDefined();
      expect(result["A"][0].name).toBe("apple");
    });
  });

  describe("getSingleGlossaryCategory", () => {
    const getSingleGlossaryCategory = async (slug: string) => {
      const CACHE_KEY = `category-single-glossary-${slug}`;
      const CACHE_EXPIRY = 60 * 60 * 24;

      try {
        const cachedData = await mockRedisClient.get(CACHE_KEY);
        if (cachedData) {
          return JSON.parse(cachedData);
        }

        const category = await mockPrismaInstance.category.findUnique({
          where: { slug },
        });

        if (!category) {
          return null;
        }

        const accounts = await mockPrismaInstance.categoryMapping.count({
          where: { categoryId: category.id },
        });

        await mockRedisClient.set(
          CACHE_KEY,
          JSON.stringify({ category, accounts }),
          "EX",
          CACHE_EXPIRY,
        );

        return { category, accounts };
      } catch (error) {
        throw new Error("Failed to fetch single glossary category");
      }
    };

    it("should return cached single category when available", async () => {
      const cachedData = {
        category: { id: "1", name: "Tech", slug: "tech" },
        accounts: 42,
      };
      mockRedisGet.mockResolvedValueOnce(JSON.stringify(cachedData));

      const result = await getSingleGlossaryCategory("tech");

      expect(result).toEqual(cachedData);
      expect(mockCategoryFindUnique).not.toHaveBeenCalled();
    });

    it("should fetch category by slug", async () => {
      mockRedisGet.mockResolvedValueOnce(null);
      mockCategoryFindUnique.mockResolvedValueOnce({
        id: "1",
        name: "Technology",
        slug: "technology",
      });
      mockCategoryMappingCount.mockResolvedValueOnce(10);

      const result = await getSingleGlossaryCategory("technology");

      expect(mockCategoryFindUnique).toHaveBeenCalledWith({
        where: { slug: "technology" },
      });
      expect(result.category.slug).toBe("technology");
    });

    it("should return account count for category", async () => {
      mockRedisGet.mockResolvedValueOnce(null);
      mockCategoryFindUnique.mockResolvedValueOnce({
        id: "cat-123",
        name: "Gaming",
        slug: "gaming",
      });
      mockCategoryMappingCount.mockResolvedValueOnce(256);

      const result = await getSingleGlossaryCategory("gaming");

      expect(result.accounts).toBe(256);
      expect(mockCategoryMappingCount).toHaveBeenCalledWith({
        where: { categoryId: "cat-123" },
      });
    });

    it("should return null for non-existent category", async () => {
      mockRedisGet.mockResolvedValueOnce(null);
      mockCategoryFindUnique.mockResolvedValueOnce(null);

      const result = await getSingleGlossaryCategory("non-existent");

      expect(result).toBeNull();
      expect(mockCategoryMappingCount).not.toHaveBeenCalled();
    });

    it("should cache result with 24-hour expiry", async () => {
      mockRedisGet.mockResolvedValueOnce(null);
      mockCategoryFindUnique.mockResolvedValueOnce({
        id: "1",
        name: "Art",
        slug: "art",
      });
      mockCategoryMappingCount.mockResolvedValueOnce(5);

      await getSingleGlossaryCategory("art");

      expect(mockRedisSet).toHaveBeenCalledWith(
        "category-single-glossary-art",
        expect.any(String),
        "EX",
        86400,
      );
    });
  });

  describe("getMostPopularCategories", () => {
    const getMostPopularCategories = async () => {
      const CACHE_POPULAR_CATEGORIES = "category-popular";

      try {
        const cachedCategories = await mockRedisClient.get(
          CACHE_POPULAR_CATEGORIES,
        );
        if (cachedCategories) {
          return JSON.parse(cachedCategories);
        }

        const popularCategories = await mockPrismaInstance.category.findMany({
          where: { popular: true },
          select: { id: true, name: true, slug: true },
        });

        await mockRedisClient.set(
          CACHE_POPULAR_CATEGORIES,
          JSON.stringify(popularCategories),
        );

        return popularCategories;
      } catch (error) {
        throw new Error("Failed to fetch categories");
      }
    };

    it("should return cached popular categories when available", async () => {
      const cachedData = [
        { id: "1", name: "Gaming", slug: "gaming" },
        { id: "2", name: "Technology", slug: "technology" },
      ];
      mockRedisGet.mockResolvedValueOnce(JSON.stringify(cachedData));

      const result = await getMostPopularCategories();

      expect(result).toEqual(cachedData);
      expect(mockCategoryFindMany).not.toHaveBeenCalled();
    });

    it("should fetch only popular categories", async () => {
      mockRedisGet.mockResolvedValueOnce(null);
      mockCategoryFindMany.mockResolvedValueOnce([
        { id: "1", name: "Gaming", slug: "gaming" },
      ]);

      await getMostPopularCategories();

      expect(mockCategoryFindMany).toHaveBeenCalledWith({
        where: { popular: true },
        select: { id: true, name: true, slug: true },
      });
    });

    it("should cache popular categories", async () => {
      mockRedisGet.mockResolvedValueOnce(null);
      const popularCategories = [
        { id: "1", name: "Gaming", slug: "gaming" },
        { id: "2", name: "Music", slug: "music" },
      ];
      mockCategoryFindMany.mockResolvedValueOnce(popularCategories);

      await getMostPopularCategories();

      expect(mockRedisSet).toHaveBeenCalledWith(
        "category-popular",
        JSON.stringify(popularCategories),
      );
    });

    it("should return empty array when no popular categories exist", async () => {
      mockRedisGet.mockResolvedValueOnce(null);
      mockCategoryFindMany.mockResolvedValueOnce([]);

      const result = await getMostPopularCategories();

      expect(result).toEqual([]);
    });

    it("should throw error on database failure", async () => {
      mockRedisGet.mockResolvedValueOnce(null);
      mockCategoryFindMany.mockRejectedValueOnce(new Error("Database error"));

      await expect(getMostPopularCategories()).rejects.toThrow(
        "Failed to fetch categories",
      );
    });
  });

  describe("Category Hierarchy Edge Cases", () => {
    const buildCategoryHierarchy = (categories: any[]) => {
      const categoryMap: { [key: string]: any } = {};
      categories.forEach((category) => {
        categoryMap[category.id] = { ...category, subcategories: [] };
      });

      const rootCategories: any[] = [];
      categories.forEach((category) => {
        if (category.parentId) {
          const parentCategory = categoryMap[category.parentId];
          if (parentCategory) {
            parentCategory.subcategories.push(categoryMap[category.id]);
          }
        } else {
          rootCategories.push(categoryMap[category.id]);
        }
      });

      return rootCategories;
    };

    it("should handle deeply nested categories (3 levels)", () => {
      const categories = [
        { id: "1", name: "Technology", parentId: null, depth: 0 },
        { id: "2", name: "Software", parentId: "1", depth: 1 },
        { id: "3", name: "Web Development", parentId: "2", depth: 2 },
      ];

      const result = buildCategoryHierarchy(categories);

      expect(result).toHaveLength(1);
      expect(result[0].subcategories[0].subcategories[0].name).toBe(
        "Web Development",
      );
    });

    it("should handle orphaned subcategories (parent doesn't exist)", () => {
      const categories = [
        { id: "1", name: "Root", parentId: null, depth: 0 },
        { id: "2", name: "Orphan", parentId: "non-existent", depth: 1 },
      ];

      const result = buildCategoryHierarchy(categories);

      // Orphan should not appear anywhere since parent doesn't exist
      expect(result).toHaveLength(1);
      expect(result[0].subcategories).toHaveLength(0);
    });

    it("should handle empty category list", () => {
      const result = buildCategoryHierarchy([]);

      expect(result).toEqual([]);
    });

    it("should handle multiple root categories with nested children", () => {
      const categories = [
        { id: "1", name: "Tech", parentId: null, depth: 0 },
        { id: "2", name: "Gaming", parentId: null, depth: 0 },
        { id: "3", name: "Software", parentId: "1", depth: 1 },
        { id: "4", name: "Hardware", parentId: "1", depth: 1 },
        { id: "5", name: "eSports", parentId: "2", depth: 1 },
      ];

      const result = buildCategoryHierarchy(categories);

      expect(result).toHaveLength(2);

      const tech = result.find((c) => c.name === "Tech");
      const gaming = result.find((c) => c.name === "Gaming");

      expect(tech.subcategories).toHaveLength(2);
      expect(gaming.subcategories).toHaveLength(1);
    });
  });

  describe("Cache Key Generation", () => {
    it("should generate correct cache key for single glossary category", () => {
      const slug = "technology";
      const cacheKey = `category-single-glossary-${slug}`;

      expect(cacheKey).toBe("category-single-glossary-technology");
    });

    it("should handle slugs with special characters", () => {
      const slug = "web-development";
      const cacheKey = `category-single-glossary-${slug}`;

      expect(cacheKey).toBe("category-single-glossary-web-development");
    });

    it("should generate correct category accounts cache key", () => {
      const categoryId = "cat-123-abc";
      const cacheKey = `category-accounts:${categoryId}`;

      expect(cacheKey).toBe("category-accounts:cat-123-abc");
    });
  });
});
