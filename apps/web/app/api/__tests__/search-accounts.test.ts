/**
 * Tests for Search Accounts API Route
 * Tests search functionality with various filters
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Use vi.hoisted for mocks
const { mockSearchAccounts, mockAuth } = vi.hoisted(() => {
  const mockSearchAccounts = vi.fn();
  const mockAuth = vi.fn();
  return { mockSearchAccounts, mockAuth };
});

// Mock modules
vi.mock("@ratecreator/db/elasticsearch-client", () => ({
  searchAccounts: mockSearchAccounts,
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("@ratecreator/types/review", () => ({
  SearchAccountsParams: {},
}));

import { GET } from "../search/accounts/route";

describe("Search Accounts API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: "user-123" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createRequest = (query: string) => {
    const url = new URL(`http://localhost:3000/api/search/accounts${query}`);
    return new NextRequest(url);
  };

  describe("Basic Search", () => {
    it("should search with default parameters", async () => {
      const mockResults = {
        hits: [{ objectID: "1", name: "Test Account" }],
        nbHits: 1,
        page: 1,
        nbPages: 1,
      };
      mockSearchAccounts.mockResolvedValueOnce(mockResults);

      const request = createRequest("");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hits).toBeDefined();
      expect(response.headers.get("Cache-Control")).toBe(
        "public, s-maxage=60, stale-while-revalidate=120",
      );
      expect(mockSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          query: "",
          page: 1,
          limit: 20,
          sortBy: "followerCount",
          sortOrder: "desc",
        }),
      );
    });

    it("should search with query parameter", async () => {
      mockSearchAccounts.mockResolvedValueOnce({
        hits: [],
        nbHits: 0,
        page: 1,
      });

      const request = createRequest("?query=tech%20creator");
      await GET(request);

      expect(mockSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          query: "tech creator",
        }),
      );
    });

    it("should respect page parameter", async () => {
      mockSearchAccounts.mockResolvedValueOnce({
        hits: [],
        nbHits: 0,
        page: 3,
      });

      const request = createRequest("?page=2");
      await GET(request);

      // Frontend page 2 becomes ES page 3 (1-based)
      expect(mockSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 3,
        }),
      );
    });

    it("should cap limit at 20", async () => {
      mockSearchAccounts.mockResolvedValueOnce({
        hits: [],
        nbHits: 0,
        page: 1,
      });

      const request = createRequest("?limit=100");
      await GET(request);

      expect(mockSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 20,
        }),
      );
    });
  });

  describe("Sorting", () => {
    it("should use custom sort by", async () => {
      mockSearchAccounts.mockResolvedValueOnce({
        hits: [],
        nbHits: 0,
        page: 1,
      });

      const request = createRequest("?sortBy=rating&sortOrder=desc");
      await GET(request);

      expect(mockSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: "rating",
          sortOrder: "desc",
        }),
      );
    });

    it("should default to desc sort order", async () => {
      mockSearchAccounts.mockResolvedValueOnce({
        hits: [],
        nbHits: 0,
        page: 1,
      });

      const request = createRequest("?sortBy=followerCount");
      await GET(request);

      expect(mockSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          sortOrder: "desc",
        }),
      );
    });
  });

  describe("Platform Filter", () => {
    it("should filter by single platform", async () => {
      mockSearchAccounts.mockResolvedValueOnce({
        hits: [],
        nbHits: 0,
        page: 1,
      });

      const request = createRequest("?filters[platform]=youtube");
      await GET(request);

      expect(mockSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            platform: ["youtube"],
          }),
        }),
      );
    });

    it("should filter by multiple platforms", async () => {
      mockSearchAccounts.mockResolvedValueOnce({
        hits: [],
        nbHits: 0,
        page: 1,
      });

      const request = createRequest(
        "?filters[platform][0]=youtube&filters[platform][1]=twitter",
      );
      await GET(request);

      expect(mockSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            platform: ["youtube", "twitter"],
          }),
        }),
      );
    });
  });

  describe("Followers Filter", () => {
    it("should filter by follower range (K)", async () => {
      mockSearchAccounts.mockResolvedValueOnce({
        hits: [],
        nbHits: 0,
        page: 1,
      });

      const request = createRequest("?filters[followers]=100K-500K");
      await GET(request);

      expect(mockSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            followers: "100K-500K",
          }),
        }),
      );
    });

    it("should filter by follower range (M)", async () => {
      mockSearchAccounts.mockResolvedValueOnce({
        hits: [],
        nbHits: 0,
        page: 1,
      });

      const request = createRequest("?filters[followers]=1M-10M");
      await GET(request);

      expect(mockSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            followers: "1M-10M",
          }),
        }),
      );
    });

    it("should filter by minimum followers (M+)", async () => {
      mockSearchAccounts.mockResolvedValueOnce({
        hits: [],
        nbHits: 0,
        page: 1,
      });

      const request = createRequest("?filters[followers]=10M%2B");
      await GET(request);

      expect(mockSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            followers: "10M+",
          }),
        }),
      );
    });

    it("should ignore 'all' follower filter", async () => {
      mockSearchAccounts.mockResolvedValueOnce({
        hits: [],
        nbHits: 0,
        page: 1,
      });

      const request = createRequest("?filters[followers]=all");
      await GET(request);

      const callArgs = mockSearchAccounts.mock.calls[0][0];
      expect(callArgs.filters.followers).toBeUndefined();
    });
  });

  describe("Rating Filter", () => {
    it("should filter by rating range", async () => {
      mockSearchAccounts.mockResolvedValueOnce({
        hits: [],
        nbHits: 0,
        page: 1,
      });

      const request = createRequest("?filters[rating]=4-5");
      await GET(request);

      expect(mockSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            rating: "4-5",
          }),
        }),
      );
    });

    it("should ignore 'all' rating filter", async () => {
      mockSearchAccounts.mockResolvedValueOnce({
        hits: [],
        nbHits: 0,
        page: 1,
      });

      const request = createRequest("?filters[rating]=all");
      await GET(request);

      const callArgs = mockSearchAccounts.mock.calls[0][0];
      expect(callArgs.filters.rating).toBeUndefined();
    });
  });

  describe("Video Count Filter", () => {
    it("should filter by video count range", async () => {
      mockSearchAccounts.mockResolvedValueOnce({
        hits: [],
        nbHits: 0,
        page: 1,
      });

      const request = createRequest("?filters[videoCount]=100-500");
      await GET(request);

      expect(mockSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            videoCount: "100-500",
          }),
        }),
      );
    });

    it("should filter by zero video count", async () => {
      mockSearchAccounts.mockResolvedValueOnce({
        hits: [],
        nbHits: 0,
        page: 1,
      });

      const request = createRequest("?filters[videoCount]=0");
      await GET(request);

      expect(mockSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            videoCount: "0",
          }),
        }),
      );
    });

    it("should filter by minimum video count", async () => {
      mockSearchAccounts.mockResolvedValueOnce({
        hits: [],
        nbHits: 0,
        page: 1,
      });

      const request = createRequest("?filters[videoCount]=1000%2B");
      await GET(request);

      expect(mockSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            videoCount: "1000+",
          }),
        }),
      );
    });
  });

  describe("Review Count Filter", () => {
    it("should filter by review count range", async () => {
      mockSearchAccounts.mockResolvedValueOnce({
        hits: [],
        nbHits: 0,
        page: 1,
      });

      const request = createRequest("?filters[reviewCount]=5-20");
      await GET(request);

      expect(mockSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            reviewCount: "5-20",
          }),
        }),
      );
    });
  });

  describe("Location Filters", () => {
    it("should filter by country", async () => {
      mockSearchAccounts.mockResolvedValueOnce({
        hits: [],
        nbHits: 0,
        page: 1,
      });

      const request = createRequest("?filters[country]=US");
      await GET(request);

      expect(mockSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            country: ["US"],
          }),
        }),
      );
    });

    it("should filter by language", async () => {
      mockSearchAccounts.mockResolvedValueOnce({
        hits: [],
        nbHits: 0,
        page: 1,
      });

      const request = createRequest("?filters[language]=en");
      await GET(request);

      expect(mockSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            language: ["en"],
          }),
        }),
      );
    });
  });

  describe("Boolean Filters", () => {
    it("should filter by claimed status", async () => {
      mockSearchAccounts.mockResolvedValueOnce({
        hits: [],
        nbHits: 0,
        page: 1,
      });

      const request = createRequest("?filters[claimed]=true");
      await GET(request);

      expect(mockSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            claimed: true,
          }),
        }),
      );
    });

    it("should filter by madeForKids status", async () => {
      mockSearchAccounts.mockResolvedValueOnce({
        hits: [],
        nbHits: 0,
        page: 1,
      });

      const request = createRequest("?filters[madeForKids]=false");
      await GET(request);

      expect(mockSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            madeForKids: false,
          }),
        }),
      );
    });
  });

  describe("Category Filter", () => {
    it("should filter by single category", async () => {
      mockSearchAccounts.mockResolvedValueOnce({
        hits: [],
        nbHits: 0,
        page: 1,
      });

      const request = createRequest("?filters[categories]=tech");
      await GET(request);

      expect(mockSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            categories: ["tech"],
          }),
        }),
      );
    });

    it("should filter by multiple categories", async () => {
      mockSearchAccounts.mockResolvedValueOnce({
        hits: [],
        nbHits: 0,
        page: 1,
      });

      const request = createRequest(
        "?filters[categories][0]=tech&filters[categories][1]=gaming",
      );
      await GET(request);

      expect(mockSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            categories: ["tech", "gaming"],
          }),
        }),
      );
    });
  });

  describe("Authentication for Pagination", () => {
    it("should return 401 for unauthenticated users on page > 0", async () => {
      mockAuth.mockResolvedValueOnce({ userId: null });

      const request = createRequest("?page=1");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should allow unauthenticated users on page 0", async () => {
      mockAuth.mockResolvedValueOnce({ userId: null });
      mockSearchAccounts.mockResolvedValueOnce({
        hits: [],
        nbHits: 0,
        page: 1,
      });

      const request = createRequest("?page=0");
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it("should allow authenticated users on any page", async () => {
      mockAuth.mockResolvedValueOnce({ userId: "user-123" });
      mockSearchAccounts.mockResolvedValueOnce({
        hits: [],
        nbHits: 0,
        page: 6,
      });

      const request = createRequest("?page=5");
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe("Error Handling", () => {
    it("should return 500 on search error", async () => {
      mockSearchAccounts.mockRejectedValueOnce(new Error("Search failed"));

      const request = createRequest("");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to perform search");
    });
  });

  describe("Combined Filters", () => {
    it("should handle multiple filters together", async () => {
      mockSearchAccounts.mockResolvedValueOnce({
        hits: [],
        nbHits: 0,
        page: 1,
      });

      const request = createRequest(
        "?query=tech&filters[platform]=youtube&filters[country]=US&filters[rating]=4-5&page=0",
      );
      await GET(request);

      expect(mockSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          query: "tech",
          filters: expect.objectContaining({
            platform: ["youtube"],
            country: ["US"],
          }),
        }),
      );
    });
  });
});
