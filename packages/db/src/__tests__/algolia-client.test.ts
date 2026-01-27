/**
 * Tests for Algolia client
 * Tests singleton behavior and search operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocks
const { mockSearchClient, mockAlgoliaSearch } = vi.hoisted(() => {
  const mockSearchClient = {
    search: vi.fn(),
    initIndex: vi.fn(),
    searchSingleIndex: vi.fn(),
  };

  const mockAlgoliaSearch = vi.fn(() => mockSearchClient);

  return { mockSearchClient, mockAlgoliaSearch };
});

// Mock algoliasearch
vi.mock("algoliasearch", () => ({
  algoliasearch: mockAlgoliaSearch,
}));

// Mock types
vi.mock("@ratecreator/types/review", () => ({
  SearchAccount: {},
  SearchAccountsParams: {},
  SearchResults: {},
}));

describe("Algolia Client", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_ALGOLIA_APP_ID: "test-app-id",
      NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY: "test-search-key",
      ALGOLIA_APP_ID: "test-admin-app-id",
      ALGOLIA_WRITE_API_KEY: "test-write-key",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("getSearchClient", () => {
    it("should create search client with correct credentials", async () => {
      const { getSearchClient } = await import("../clients/algolia-client");
      const client = getSearchClient();

      expect(client).toBeDefined();
      expect(mockAlgoliaSearch).toHaveBeenCalledWith(
        "test-app-id",
        "test-search-key",
      );
    });

    it("should return singleton instance", async () => {
      const { getSearchClient } = await import("../clients/algolia-client");

      const client1 = getSearchClient();
      const client2 = getSearchClient();

      expect(client1).toBe(client2);
      expect(mockAlgoliaSearch).toHaveBeenCalledTimes(1);
    });
  });

  describe("getWriteClient", () => {
    it("should create write client with admin credentials", async () => {
      const { getWriteClient } = await import("../clients/algolia-client");
      const client = getWriteClient();

      expect(client).toBeDefined();
      expect(mockAlgoliaSearch).toHaveBeenCalledWith(
        "test-admin-app-id",
        "test-write-key",
      );
    });

    it("should return singleton instance", async () => {
      const { getWriteClient } = await import("../clients/algolia-client");

      const client1 = getWriteClient();
      const client2 = getWriteClient();

      expect(client1).toBe(client2);
    });
  });

  describe("getSearchAccounts", () => {
    beforeEach(() => {
      mockSearchClient.search.mockResolvedValue({
        results: [
          {
            hits: [{ objectID: "1", name: "Test Account" }],
            nbHits: 1,
            page: 0,
            nbPages: 1,
            facets: {
              platform: { YOUTUBE: 5 },
              categories: { tech: 3 },
            },
          },
        ],
      });
    });

    it("should search with default parameters", async () => {
      const { getSearchAccounts } = await import("../clients/algolia-client");

      const result = await getSearchAccounts({});

      expect(mockSearchClient.search).toHaveBeenCalledWith([
        expect.objectContaining({
          indexName: "accounts",
          params: expect.objectContaining({
            query: "",
            page: 0,
          }),
        }),
      ]);
    });

    it("should search with query parameter", async () => {
      const { getSearchAccounts } = await import("../clients/algolia-client");

      await getSearchAccounts({ query: "tech creator" });

      expect(mockSearchClient.search).toHaveBeenCalledWith([
        expect.objectContaining({
          params: expect.objectContaining({
            query: "tech creator",
          }),
        }),
      ]);
    });

    it("should search with page parameter", async () => {
      const { getSearchAccounts } = await import("../clients/algolia-client");

      await getSearchAccounts({ page: 2 });

      expect(mockSearchClient.search).toHaveBeenCalledWith([
        expect.objectContaining({
          params: expect.objectContaining({
            page: 2,
          }),
        }),
      ]);
    });

    it("should use sorted index when sortBy is specified", async () => {
      const { getSearchAccounts } = await import("../clients/algolia-client");

      await getSearchAccounts({ sortBy: "rating", sortOrder: "desc" });

      expect(mockSearchClient.search).toHaveBeenCalledWith([
        expect.objectContaining({
          indexName: "accounts_rating_desc",
        }),
      ]);
    });

    it("should use base index for default followed sort", async () => {
      const { getSearchAccounts } = await import("../clients/algolia-client");

      await getSearchAccounts({ sortBy: "followed", sortOrder: "desc" });

      expect(mockSearchClient.search).toHaveBeenCalledWith([
        expect.objectContaining({
          indexName: "accounts",
        }),
      ]);
    });

    it("should build category filters correctly", async () => {
      const { getSearchAccounts } = await import("../clients/algolia-client");

      await getSearchAccounts({
        filters: { categories: ["tech", "gaming"] },
      });

      expect(mockSearchClient.search).toHaveBeenCalledWith([
        expect.objectContaining({
          params: expect.objectContaining({
            filters: expect.stringContaining('categories:"tech"'),
          }),
        }),
      ]);
    });

    it("should build platform filters correctly", async () => {
      const { getSearchAccounts } = await import("../clients/algolia-client");

      await getSearchAccounts({
        filters: { platform: ["youtube", "twitter"] },
      });

      expect(mockSearchClient.search).toHaveBeenCalledWith([
        expect.objectContaining({
          params: expect.objectContaining({
            filters: expect.stringContaining("platform:YOUTUBE"),
          }),
        }),
      ]);
    });

    it("should build follower range filters with object format", async () => {
      const { getSearchAccounts } = await import("../clients/algolia-client");

      await getSearchAccounts({
        filters: { followers: { min: 1000, max: 10000 } },
      });

      expect(mockSearchClient.search).toHaveBeenCalledWith([
        expect.objectContaining({
          params: expect.objectContaining({
            filters: expect.stringContaining("followerCount >= 1000"),
          }),
        }),
      ]);
    });

    it("should build follower range filters with string format", async () => {
      const { getSearchAccounts } = await import("../clients/algolia-client");

      await getSearchAccounts({
        filters: { followers: "followerCount >= 1000" },
      });

      expect(mockSearchClient.search).toHaveBeenCalledWith([
        expect.objectContaining({
          params: expect.objectContaining({
            filters: "followerCount >= 1000",
          }),
        }),
      ]);
    });

    it("should build rating range filters", async () => {
      const { getSearchAccounts } = await import("../clients/algolia-client");

      await getSearchAccounts({
        filters: { rating: { min: 4, max: 5 } },
      });

      expect(mockSearchClient.search).toHaveBeenCalledWith([
        expect.objectContaining({
          params: expect.objectContaining({
            filters: expect.stringContaining("rating >= 4"),
          }),
        }),
      ]);
    });

    it("should build country filters correctly", async () => {
      const { getSearchAccounts } = await import("../clients/algolia-client");

      await getSearchAccounts({
        filters: { country: ["US", "UK"] },
      });

      expect(mockSearchClient.search).toHaveBeenCalledWith([
        expect.objectContaining({
          params: expect.objectContaining({
            filters: expect.stringContaining("country:US"),
          }),
        }),
      ]);
    });

    it("should build language filters correctly", async () => {
      const { getSearchAccounts } = await import("../clients/algolia-client");

      await getSearchAccounts({
        filters: { language: ["en", "es"] },
      });

      expect(mockSearchClient.search).toHaveBeenCalledWith([
        expect.objectContaining({
          params: expect.objectContaining({
            filters: expect.stringContaining("language_code:en"),
          }),
        }),
      ]);
    });

    it("should build claimed filter correctly", async () => {
      const { getSearchAccounts } = await import("../clients/algolia-client");

      await getSearchAccounts({
        filters: { claimed: true },
      });

      expect(mockSearchClient.search).toHaveBeenCalledWith([
        expect.objectContaining({
          params: expect.objectContaining({
            filters: "claimed:true",
          }),
        }),
      ]);
    });

    it("should build madeForKids filter correctly", async () => {
      const { getSearchAccounts } = await import("../clients/algolia-client");

      await getSearchAccounts({
        filters: { madeForKids: false },
      });

      expect(mockSearchClient.search).toHaveBeenCalledWith([
        expect.objectContaining({
          params: expect.objectContaining({
            filters: "madeForKids:false",
          }),
        }),
      ]);
    });

    it("should combine multiple filters with AND", async () => {
      const { getSearchAccounts } = await import("../clients/algolia-client");

      await getSearchAccounts({
        filters: {
          platform: ["youtube"],
          categories: ["tech"],
          claimed: true,
        },
      });

      const callArgs =
        mockSearchClient.search.mock.calls[0][0][0].params.filters;
      expect(callArgs).toContain(" AND ");
    });

    it("should request facets in search", async () => {
      const { getSearchAccounts } = await import("../clients/algolia-client");

      await getSearchAccounts({});

      expect(mockSearchClient.search).toHaveBeenCalledWith([
        expect.objectContaining({
          params: expect.objectContaining({
            facets: [
              "platform",
              "categories",
              "country",
              "language_code",
              "madeForKids",
            ],
          }),
        }),
      ]);
    });

    it("should return search results", async () => {
      const { getSearchAccounts } = await import("../clients/algolia-client");

      const result = await getSearchAccounts({});

      expect(result).toEqual(
        expect.objectContaining({
          hits: expect.any(Array),
          nbHits: 1,
        }),
      );
    });

    it("should throw error on search failure", async () => {
      mockSearchClient.search.mockRejectedValueOnce(new Error("Search failed"));

      const { getSearchAccounts } = await import("../clients/algolia-client");

      await expect(getSearchAccounts({})).rejects.toThrow("Search failed");
    });
  });
});

describe("Algolia Filter Building", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.NEXT_PUBLIC_ALGOLIA_APP_ID = "test-app-id";
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY = "test-search-key";

    mockSearchClient.search.mockResolvedValue({
      results: [{ hits: [], nbHits: 0, page: 0, nbPages: 0, facets: {} }],
    });
  });

  it("should handle videoCount range filter with object format", async () => {
    const { getSearchAccounts } = await import("../clients/algolia-client");

    await getSearchAccounts({
      filters: { videoCount: { min: 10, max: 100 } },
    });

    expect(mockSearchClient.search).toHaveBeenCalled();
  });

  it("should handle videoCount range filter with string format", async () => {
    const { getSearchAccounts } = await import("../clients/algolia-client");

    await getSearchAccounts({
      filters: { videoCount: "videoCount >= 10" },
    });

    expect(mockSearchClient.search).toHaveBeenCalledWith([
      expect.objectContaining({
        params: expect.objectContaining({
          filters: "videoCount >= 10",
        }),
      }),
    ]);
  });

  it("should handle reviewCount range filter", async () => {
    const { getSearchAccounts } = await import("../clients/algolia-client");

    await getSearchAccounts({
      filters: { reviewCount: { min: 5, max: 50 } },
    });

    expect(mockSearchClient.search).toHaveBeenCalled();
  });

  it("should handle empty filters object", async () => {
    const { getSearchAccounts } = await import("../clients/algolia-client");

    await getSearchAccounts({ filters: {} });

    expect(mockSearchClient.search).toHaveBeenCalledWith([
      expect.objectContaining({
        params: expect.objectContaining({
          filters: "",
        }),
      }),
    ]);
  });

  it("should handle single category filter", async () => {
    const { getSearchAccounts } = await import("../clients/algolia-client");

    await getSearchAccounts({
      filters: { categories: ["tech"] },
    });

    expect(mockSearchClient.search).toHaveBeenCalledWith([
      expect.objectContaining({
        params: expect.objectContaining({
          filters: '(categories:"tech")',
        }),
      }),
    ]);
  });
});
