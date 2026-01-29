/**
 * Tests for Elasticsearch client
 * Tests client initialization, search operations, and CRUD operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocks
const { mockElasticClient, MockClient } = vi.hoisted(() => {
  const mockElasticClient = {
    search: vi.fn(),
    index: vi.fn(),
    bulk: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    indices: {
      exists: vi.fn(),
      create: vi.fn(),
    },
    cluster: {
      health: vi.fn(),
    },
  };

  const MockClient = vi.fn(() => mockElasticClient);

  return { mockElasticClient, MockClient };
});

// Mock elasticsearch client
vi.mock("@elastic/elasticsearch", () => ({
  Client: MockClient,
}));

describe("Elasticsearch Client", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env = {
      ...originalEnv,
      ELASTIC_CLOUD_ID: "test-cloud-id",
      ELASTIC_API_KEY: "test-api-key",
      ELASTIC_ACCOUNTS_INDEX: "accounts",
      ELASTIC_CATEGORIES_INDEX: "categories",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("getElasticsearchClient", () => {
    it("should create client with API key authentication", async () => {
      const { getElasticsearchClient } =
        await import("../clients/elasticsearch-client");
      const client = getElasticsearchClient();

      expect(client).toBeDefined();
      expect(MockClient).toHaveBeenCalledWith({
        cloud: { id: "test-cloud-id" },
        auth: { apiKey: "test-api-key" },
      });
    });

    it("should create client with basic auth when API key not available", async () => {
      vi.resetModules();
      delete process.env.ELASTIC_API_KEY;
      process.env.ELASTIC_USERNAME = "test-user";
      process.env.ELASTIC_PASSWORD = "test-password";

      const { getElasticsearchClient } =
        await import("../clients/elasticsearch-client");
      getElasticsearchClient();

      expect(MockClient).toHaveBeenCalledWith({
        cloud: { id: "test-cloud-id" },
        auth: { username: "test-user", password: "test-password" },
      });
    });

    it("should throw error when no credentials configured", async () => {
      vi.resetModules();
      delete process.env.ELASTIC_CLOUD_ID;

      const { getElasticsearchClient } =
        await import("../clients/elasticsearch-client");

      expect(() => getElasticsearchClient()).toThrow(
        "Elasticsearch credentials not configured",
      );
    });

    it("should return singleton instance", async () => {
      const { getElasticsearchClient } =
        await import("../clients/elasticsearch-client");

      const client1 = getElasticsearchClient();
      const client2 = getElasticsearchClient();

      expect(client1).toBe(client2);
      expect(MockClient).toHaveBeenCalledTimes(1);
    });
  });

  describe("searchAccounts", () => {
    beforeEach(() => {
      mockElasticClient.search.mockResolvedValue({
        hits: {
          total: { value: 10 },
          hits: [
            {
              _id: "1",
              _source: { name: "Test Account", platform: "YOUTUBE" },
            },
          ],
        },
        aggregations: {
          platform: { buckets: [{ key: "YOUTUBE", doc_count: 5 }] },
          categories: { buckets: [{ key: "tech", doc_count: 3 }] },
          country: { buckets: [] },
          language_code: { buckets: [] },
          madeForKids: { buckets: [{ key: false, doc_count: 8 }] },
        },
      });
    });

    it("should search with default parameters", async () => {
      const { searchAccounts } =
        await import("../clients/elasticsearch-client");

      const result = await searchAccounts({});

      expect(result).toEqual(
        expect.objectContaining({
          hits: expect.any(Array),
          nbHits: 10,
          page: 1,
          hitsPerPage: 20,
        }),
      );
    });

    it("should include objectID in hits", async () => {
      const { searchAccounts } =
        await import("../clients/elasticsearch-client");

      const result = await searchAccounts({});

      expect(result.hits[0]).toEqual(
        expect.objectContaining({
          objectID: "1",
        }),
      );
    });

    it("should build multi_match query for search text", async () => {
      const { searchAccounts } =
        await import("../clients/elasticsearch-client");

      await searchAccounts({ query: "tech creator" });

      expect(mockElasticClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            query: expect.objectContaining({
              bool: expect.objectContaining({
                must: expect.arrayContaining([
                  expect.objectContaining({
                    multi_match: expect.objectContaining({
                      query: "tech creator",
                    }),
                  }),
                ]),
              }),
            }),
          }),
        }),
      );
    });

    it("should calculate pagination correctly", async () => {
      const { searchAccounts } =
        await import("../clients/elasticsearch-client");

      await searchAccounts({ page: 3, limit: 10 });

      expect(mockElasticClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            from: 20, // (3-1) * 10
            size: 10,
          }),
        }),
      );
    });

    it("should limit max results to 100", async () => {
      const { searchAccounts } =
        await import("../clients/elasticsearch-client");

      await searchAccounts({ limit: 500 });

      expect(mockElasticClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            size: 100,
          }),
        }),
      );
    });

    it("should build platform filter", async () => {
      const { searchAccounts } =
        await import("../clients/elasticsearch-client");

      await searchAccounts({ filters: { platform: ["youtube", "twitter"] } });

      expect(mockElasticClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            query: expect.objectContaining({
              bool: expect.objectContaining({
                filter: expect.arrayContaining([
                  expect.objectContaining({
                    terms: { platform: ["YOUTUBE", "TWITTER"] },
                  }),
                ]),
              }),
            }),
          }),
        }),
      );
    });

    it("should build country filter", async () => {
      const { searchAccounts } =
        await import("../clients/elasticsearch-client");

      await searchAccounts({ filters: { country: ["US", "UK"] } });

      expect(mockElasticClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            query: expect.objectContaining({
              bool: expect.objectContaining({
                filter: expect.arrayContaining([
                  expect.objectContaining({
                    terms: { country: ["US", "UK"] },
                  }),
                ]),
              }),
            }),
          }),
        }),
      );
    });

    it("should build language filter", async () => {
      const { searchAccounts } =
        await import("../clients/elasticsearch-client");

      await searchAccounts({ filters: { language: ["en", "es"] } });

      expect(mockElasticClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            query: expect.objectContaining({
              bool: expect.objectContaining({
                filter: expect.arrayContaining([
                  expect.objectContaining({
                    terms: { language_code: ["en", "es"] },
                  }),
                ]),
              }),
            }),
          }),
        }),
      );
    });

    it("should build categories filter", async () => {
      const { searchAccounts } =
        await import("../clients/elasticsearch-client");

      await searchAccounts({ filters: { categories: ["tech", "gaming"] } });

      expect(mockElasticClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            query: expect.objectContaining({
              bool: expect.objectContaining({
                filter: expect.arrayContaining([
                  expect.objectContaining({
                    terms: { categories: ["tech", "gaming"] },
                  }),
                ]),
              }),
            }),
          }),
        }),
      );
    });

    it("should build madeForKids filter", async () => {
      const { searchAccounts } =
        await import("../clients/elasticsearch-client");

      await searchAccounts({ filters: { madeForKids: true } });

      expect(mockElasticClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            query: expect.objectContaining({
              bool: expect.objectContaining({
                filter: expect.arrayContaining([
                  expect.objectContaining({
                    term: { madeForKids: true },
                  }),
                ]),
              }),
            }),
          }),
        }),
      );
    });

    it("should build claimed filter", async () => {
      const { searchAccounts } =
        await import("../clients/elasticsearch-client");

      await searchAccounts({ filters: { claimed: true } });

      expect(mockElasticClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            query: expect.objectContaining({
              bool: expect.objectContaining({
                filter: expect.arrayContaining([
                  expect.objectContaining({
                    term: { claimed: true },
                  }),
                ]),
              }),
            }),
          }),
        }),
      );
    });

    it("should build follower range filter with object", async () => {
      const { searchAccounts } =
        await import("../clients/elasticsearch-client");

      await searchAccounts({
        filters: { followers: { min: 1000, max: 10000 } },
      });

      expect(mockElasticClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            query: expect.objectContaining({
              bool: expect.objectContaining({
                filter: expect.arrayContaining([
                  expect.objectContaining({
                    range: expect.objectContaining({
                      followerCount: expect.objectContaining({
                        gte: 1000,
                        lt: 10000,
                      }),
                    }),
                  }),
                ]),
              }),
            }),
          }),
        }),
      );
    });

    it("should build follower range filter with string format (1K-10K)", async () => {
      const { searchAccounts } =
        await import("../clients/elasticsearch-client");

      await searchAccounts({ filters: { followers: "1K-10K" } });

      expect(mockElasticClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            query: expect.objectContaining({
              bool: expect.objectContaining({
                filter: expect.arrayContaining([
                  expect.objectContaining({
                    range: expect.objectContaining({
                      followerCount: expect.objectContaining({
                        gte: 1000,
                        lt: 10000,
                      }),
                    }),
                  }),
                ]),
              }),
            }),
          }),
        }),
      );
    });

    it("should build follower range filter with plus format (1M+)", async () => {
      const { searchAccounts } =
        await import("../clients/elasticsearch-client");

      await searchAccounts({ filters: { followers: "1M+" } });

      expect(mockElasticClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            query: expect.objectContaining({
              bool: expect.objectContaining({
                filter: expect.arrayContaining([
                  expect.objectContaining({
                    range: expect.objectContaining({
                      followerCount: expect.objectContaining({
                        gte: 1000000,
                      }),
                    }),
                  }),
                ]),
              }),
            }),
          }),
        }),
      );
    });

    it("should build rating range filter", async () => {
      const { searchAccounts } =
        await import("../clients/elasticsearch-client");

      await searchAccounts({ filters: { rating: { min: 4, max: 5 } } });

      expect(mockElasticClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            query: expect.objectContaining({
              bool: expect.objectContaining({
                filter: expect.arrayContaining([
                  expect.objectContaining({
                    range: expect.objectContaining({
                      rating: expect.objectContaining({
                        gte: 4,
                        lte: 5,
                      }),
                    }),
                  }),
                ]),
              }),
            }),
          }),
        }),
      );
    });

    it("should include aggregations for facets", async () => {
      const { searchAccounts } =
        await import("../clients/elasticsearch-client");

      await searchAccounts({});

      expect(mockElasticClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            aggs: expect.objectContaining({
              platform: expect.any(Object),
              categories: expect.any(Object),
              country: expect.any(Object),
              language_code: expect.any(Object),
              madeForKids: expect.any(Object),
            }),
          }),
        }),
      );
    });

    it("should transform aggregations to facets", async () => {
      const { searchAccounts } =
        await import("../clients/elasticsearch-client");

      const result = await searchAccounts({});

      expect(result.facets).toEqual(
        expect.objectContaining({
          platform: { YOUTUBE: 5 },
          categories: { tech: 3 },
          madeForKids: { false: 8 },
        }),
      );
    });

    it("should sort by relevance when query is provided", async () => {
      const { searchAccounts } =
        await import("../clients/elasticsearch-client");

      await searchAccounts({ query: "test" });

      expect(mockElasticClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            sort: expect.arrayContaining([{ _score: "desc" }]),
          }),
        }),
      );
    });

    it("should sort by custom field", async () => {
      const { searchAccounts } =
        await import("../clients/elasticsearch-client");

      await searchAccounts({ sortBy: "rating", sortOrder: "desc" });

      expect(mockElasticClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            sort: expect.arrayContaining([{ rating: "desc" }]),
          }),
        }),
      );
    });

    it("should calculate processing time", async () => {
      const { searchAccounts } =
        await import("../clients/elasticsearch-client");

      const result = await searchAccounts({});

      expect(result.processingTimeMS).toBeGreaterThanOrEqual(0);
    });

    it("should throw error on search failure", async () => {
      mockElasticClient.search.mockRejectedValueOnce(
        new Error("Search failed"),
      );

      const { searchAccounts } =
        await import("../clients/elasticsearch-client");

      await expect(searchAccounts({})).rejects.toThrow("Search failed");
    });
  });

  describe("indexAccount", () => {
    beforeEach(() => {
      mockElasticClient.index.mockResolvedValue({ result: "created" });
    });

    it("should index single account", async () => {
      const { indexAccount } = await import("../clients/elasticsearch-client");

      await indexAccount({
        objectID: "account-1",
        name: "Test Account",
        platform: "YOUTUBE",
      });

      expect(mockElasticClient.index).toHaveBeenCalledWith({
        index: "accounts",
        id: "account-1",
        body: expect.objectContaining({
          name: "Test Account",
          platform: "YOUTUBE",
        }),
        refresh: true,
      });
    });

    it("should use accountId if objectID not provided", async () => {
      const { indexAccount } = await import("../clients/elasticsearch-client");

      await indexAccount({
        accountId: "account-2",
        name: "Test Account 2",
      });

      expect(mockElasticClient.index).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "account-2",
        }),
      );
    });
  });

  describe("bulkIndexAccounts", () => {
    beforeEach(() => {
      mockElasticClient.bulk.mockResolvedValue({ errors: false, items: [] });
    });

    it("should bulk index multiple accounts", async () => {
      const { bulkIndexAccounts } =
        await import("../clients/elasticsearch-client");

      await bulkIndexAccounts([
        { objectID: "1", name: "Account 1" },
        { objectID: "2", name: "Account 2" },
      ]);

      expect(mockElasticClient.bulk).toHaveBeenCalledWith({
        body: [
          { index: { _index: "accounts", _id: "1" } },
          { objectID: "1", name: "Account 1" },
          { index: { _index: "accounts", _id: "2" } },
          { objectID: "2", name: "Account 2" },
        ],
        refresh: true,
      });
    });

    it("should throw error on bulk indexing failure", async () => {
      mockElasticClient.bulk.mockResolvedValueOnce({
        errors: true,
        items: [{ index: { error: { reason: "Mapping error" } } }],
      });

      const { bulkIndexAccounts } =
        await import("../clients/elasticsearch-client");

      await expect(
        bulkIndexAccounts([{ objectID: "1", name: "Account 1" }]),
      ).rejects.toThrow("Bulk indexing failed with 1 errors");
    });
  });

  describe("updateAccount", () => {
    beforeEach(() => {
      mockElasticClient.update.mockResolvedValue({ result: "updated" });
    });

    it("should update account partially", async () => {
      const { updateAccount } = await import("../clients/elasticsearch-client");

      await updateAccount("account-1", { rating: 4.5, reviewCount: 10 });

      expect(mockElasticClient.update).toHaveBeenCalledWith({
        index: "accounts",
        id: "account-1",
        body: {
          doc: expect.objectContaining({
            rating: 4.5,
            reviewCount: 10,
            lastIndexedAt: expect.any(String),
          }),
        },
        refresh: true,
      });
    });
  });

  describe("deleteAccount", () => {
    beforeEach(() => {
      mockElasticClient.delete.mockResolvedValue({ result: "deleted" });
    });

    it("should delete account", async () => {
      const { deleteAccount } = await import("../clients/elasticsearch-client");

      await deleteAccount("account-1");

      expect(mockElasticClient.delete).toHaveBeenCalledWith({
        index: "accounts",
        id: "account-1",
        refresh: true,
      });
    });
  });

  describe("createIndices", () => {
    it("should create accounts index if not exists", async () => {
      mockElasticClient.indices.exists.mockResolvedValue(false);
      mockElasticClient.indices.create.mockResolvedValue({
        acknowledged: true,
      });

      const { createIndices } = await import("../clients/elasticsearch-client");

      await createIndices();

      expect(mockElasticClient.indices.create).toHaveBeenCalledWith(
        expect.objectContaining({
          index: "accounts",
        }),
      );
    });

    it("should create categories index if not exists", async () => {
      mockElasticClient.indices.exists.mockResolvedValue(false);
      mockElasticClient.indices.create.mockResolvedValue({
        acknowledged: true,
      });

      const { createIndices } = await import("../clients/elasticsearch-client");

      await createIndices();

      expect(mockElasticClient.indices.create).toHaveBeenCalledWith(
        expect.objectContaining({
          index: "categories",
        }),
      );
    });

    it("should skip creation if indices already exist", async () => {
      mockElasticClient.indices.exists.mockResolvedValue(true);

      const { createIndices } = await import("../clients/elasticsearch-client");

      await createIndices();

      expect(mockElasticClient.indices.create).not.toHaveBeenCalled();
    });
  });

  describe("checkHealth", () => {
    it("should return healthy status when cluster is green", async () => {
      mockElasticClient.cluster.health.mockResolvedValue({ status: "green" });

      const { checkHealth } = await import("../clients/elasticsearch-client");

      const result = await checkHealth();

      expect(result).toEqual({
        status: "green",
        available: true,
      });
    });

    it("should return healthy status when cluster is yellow", async () => {
      mockElasticClient.cluster.health.mockResolvedValue({ status: "yellow" });

      const { checkHealth } = await import("../clients/elasticsearch-client");

      const result = await checkHealth();

      expect(result).toEqual({
        status: "yellow",
        available: true,
      });
    });

    it("should return unavailable when cluster is red", async () => {
      mockElasticClient.cluster.health.mockResolvedValue({ status: "red" });

      const { checkHealth } = await import("../clients/elasticsearch-client");

      const result = await checkHealth();

      expect(result).toEqual({
        status: "red",
        available: false,
      });
    });

    it("should return unavailable on error", async () => {
      mockElasticClient.cluster.health.mockRejectedValueOnce(
        new Error("Connection failed"),
      );

      const { checkHealth } = await import("../clients/elasticsearch-client");

      const result = await checkHealth();

      expect(result).toEqual({
        status: "unavailable",
        available: false,
      });
    });
  });
});

describe("Elasticsearch Range Parsing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.ELASTIC_CLOUD_ID = "test-cloud-id";
    process.env.ELASTIC_API_KEY = "test-api-key";

    mockElasticClient.search.mockResolvedValue({
      hits: { total: { value: 0 }, hits: [] },
      aggregations: {},
    });
  });

  it("should parse range with K suffix correctly", async () => {
    const { searchAccounts } = await import("../clients/elasticsearch-client");

    await searchAccounts({ filters: { followers: "100K-500K" } });

    expect(mockElasticClient.search).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              filter: expect.arrayContaining([
                expect.objectContaining({
                  range: expect.objectContaining({
                    followerCount: expect.objectContaining({
                      gte: 100000,
                      lt: 500000,
                    }),
                  }),
                }),
              ]),
            }),
          }),
        }),
      }),
    );
  });

  it("should parse range with M suffix correctly", async () => {
    const { searchAccounts } = await import("../clients/elasticsearch-client");

    await searchAccounts({ filters: { followers: "1M-5M" } });

    expect(mockElasticClient.search).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              filter: expect.arrayContaining([
                expect.objectContaining({
                  range: expect.objectContaining({
                    followerCount: expect.objectContaining({
                      gte: 1000000,
                      lt: 5000000,
                    }),
                  }),
                }),
              ]),
            }),
          }),
        }),
      }),
    );
  });

  it("should parse range with B suffix correctly", async () => {
    const { searchAccounts } = await import("../clients/elasticsearch-client");

    await searchAccounts({ filters: { followers: "1B+" } });

    expect(mockElasticClient.search).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              filter: expect.arrayContaining([
                expect.objectContaining({
                  range: expect.objectContaining({
                    followerCount: expect.objectContaining({
                      gte: 1000000000,
                    }),
                  }),
                }),
              ]),
            }),
          }),
        }),
      }),
    );
  });

  it("should parse numeric range without suffix", async () => {
    const { searchAccounts } = await import("../clients/elasticsearch-client");

    await searchAccounts({ filters: { followers: "1000-5000" } });

    expect(mockElasticClient.search).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              filter: expect.arrayContaining([
                expect.objectContaining({
                  range: expect.objectContaining({
                    followerCount: expect.objectContaining({
                      gte: 1000,
                      lt: 5000,
                    }),
                  }),
                }),
              ]),
            }),
          }),
        }),
      }),
    );
  });
});
