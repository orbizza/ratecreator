/**
 * Tests for Search Accounts API Route
 * Tests search functionality with various filters
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Use vi.hoisted for mocks
const { mockGetSearchAccounts, mockGetAuth } = vi.hoisted(() => {
  const mockGetSearchAccounts = vi.fn();
  const mockGetAuth = vi.fn();
  return { mockGetSearchAccounts, mockGetAuth };
});

// Mock modules
vi.mock("@ratecreator/db/algolia-client", () => ({
  getSearchAccounts: mockGetSearchAccounts,
}));

vi.mock("@clerk/nextjs/server", () => ({
  getAuth: mockGetAuth,
}));

vi.mock("@ratecreator/types/review", () => ({
  SearchAccountsParams: {},
}));

import { GET } from "../search/accounts/route";

describe("Search Accounts API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuth.mockReturnValue({ userId: "user-123" });
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
        page: 0,
        nbPages: 1,
      };
      mockGetSearchAccounts.mockResolvedValueOnce(mockResults);

      const request = createRequest("");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hits).toBeDefined();
      expect(mockGetSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          query: "",
          page: 0,
          limit: 20,
          sortBy: "followerCount",
          sortOrder: "asc",
        }),
      );
    });

    it("should search with query parameter", async () => {
      mockGetSearchAccounts.mockResolvedValueOnce({ hits: [], nbHits: 0 });

      const request = createRequest("?query=tech%20creator");
      await GET(request);

      expect(mockGetSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          query: "tech creator",
        }),
      );
    });

    it("should respect page parameter", async () => {
      mockGetSearchAccounts.mockResolvedValueOnce({ hits: [], nbHits: 0 });

      const request = createRequest("?page=2");
      await GET(request);

      expect(mockGetSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        }),
      );
    });

    it("should cap limit at 20", async () => {
      mockGetSearchAccounts.mockResolvedValueOnce({ hits: [], nbHits: 0 });

      const request = createRequest("?limit=100");
      await GET(request);

      expect(mockGetSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 20,
        }),
      );
    });
  });

  describe("Sorting", () => {
    it("should use custom sort by", async () => {
      mockGetSearchAccounts.mockResolvedValueOnce({ hits: [], nbHits: 0 });

      const request = createRequest("?sortBy=rating&sortOrder=desc");
      await GET(request);

      expect(mockGetSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: "rating",
          sortOrder: "desc",
        }),
      );
    });

    it("should default to asc sort order", async () => {
      mockGetSearchAccounts.mockResolvedValueOnce({ hits: [], nbHits: 0 });

      const request = createRequest("?sortBy=followerCount");
      await GET(request);

      expect(mockGetSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          sortOrder: "asc",
        }),
      );
    });
  });

  describe("Platform Filter", () => {
    it("should filter by single platform", async () => {
      mockGetSearchAccounts.mockResolvedValueOnce({ hits: [], nbHits: 0 });

      const request = createRequest("?filters[platform]=youtube");
      await GET(request);

      expect(mockGetSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            platform: ["youtube"],
          }),
        }),
      );
    });

    it("should filter by multiple platforms", async () => {
      mockGetSearchAccounts.mockResolvedValueOnce({ hits: [], nbHits: 0 });

      const request = createRequest(
        "?filters[platform][0]=youtube&filters[platform][1]=twitter",
      );
      await GET(request);

      expect(mockGetSearchAccounts).toHaveBeenCalledWith(
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
      mockGetSearchAccounts.mockResolvedValueOnce({ hits: [], nbHits: 0 });

      const request = createRequest("?filters[followers]=100K-500K");
      await GET(request);

      expect(mockGetSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            followers: expect.stringContaining("followerCount"),
          }),
        }),
      );
    });

    it("should filter by follower range (M)", async () => {
      mockGetSearchAccounts.mockResolvedValueOnce({ hits: [], nbHits: 0 });

      const request = createRequest("?filters[followers]=1M-10M");
      await GET(request);

      expect(mockGetSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            followers:
              "(followerCount >= 1000000 AND followerCount < 10000000)",
          }),
        }),
      );
    });

    it("should filter by minimum followers (M+)", async () => {
      mockGetSearchAccounts.mockResolvedValueOnce({ hits: [], nbHits: 0 });

      const request = createRequest("?filters[followers]=10M%2B");
      await GET(request);

      expect(mockGetSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            followers: "followerCount >= 10000000",
          }),
        }),
      );
    });

    it("should ignore 'all' follower filter", async () => {
      mockGetSearchAccounts.mockResolvedValueOnce({ hits: [], nbHits: 0 });

      const request = createRequest("?filters[followers]=all");
      await GET(request);

      const callArgs = mockGetSearchAccounts.mock.calls[0][0];
      expect(callArgs.filters.followers).toBeUndefined();
    });
  });

  describe("Rating Filter", () => {
    it("should filter by rating range", async () => {
      mockGetSearchAccounts.mockResolvedValueOnce({ hits: [], nbHits: 0 });

      const request = createRequest("?filters[rating]=4-5");
      await GET(request);

      expect(mockGetSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            rating: expect.stringContaining("rating"),
          }),
        }),
      );
    });

    it("should ignore 'all' rating filter", async () => {
      mockGetSearchAccounts.mockResolvedValueOnce({ hits: [], nbHits: 0 });

      const request = createRequest("?filters[rating]=all");
      await GET(request);

      const callArgs = mockGetSearchAccounts.mock.calls[0][0];
      expect(callArgs.filters.rating).toBeUndefined();
    });
  });

  describe("Video Count Filter", () => {
    it("should filter by video count range", async () => {
      mockGetSearchAccounts.mockResolvedValueOnce({ hits: [], nbHits: 0 });

      const request = createRequest("?filters[videoCount]=100-500");
      await GET(request);

      expect(mockGetSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            videoCount: "(videoCount >= 100 AND videoCount <= 500)",
          }),
        }),
      );
    });

    it("should filter by zero video count", async () => {
      mockGetSearchAccounts.mockResolvedValueOnce({ hits: [], nbHits: 0 });

      const request = createRequest("?filters[videoCount]=0");
      await GET(request);

      expect(mockGetSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            videoCount: "videoCount = 0",
          }),
        }),
      );
    });

    it("should filter by minimum video count", async () => {
      mockGetSearchAccounts.mockResolvedValueOnce({ hits: [], nbHits: 0 });

      const request = createRequest("?filters[videoCount]=1000%2B");
      await GET(request);

      expect(mockGetSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            videoCount: "videoCount >= 1000",
          }),
        }),
      );
    });
  });

  describe("Review Count Filter", () => {
    it("should filter by review count range", async () => {
      mockGetSearchAccounts.mockResolvedValueOnce({ hits: [], nbHits: 0 });

      const request = createRequest("?filters[reviewCount]=5-20");
      await GET(request);

      expect(mockGetSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            reviewCount: "(reviewCount >= 5 AND reviewCount <= 20)",
          }),
        }),
      );
    });
  });

  describe("Location Filters", () => {
    it("should filter by country", async () => {
      mockGetSearchAccounts.mockResolvedValueOnce({ hits: [], nbHits: 0 });

      const request = createRequest("?filters[country]=US");
      await GET(request);

      expect(mockGetSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            country: ["US"],
          }),
        }),
      );
    });

    it("should filter by language", async () => {
      mockGetSearchAccounts.mockResolvedValueOnce({ hits: [], nbHits: 0 });

      const request = createRequest("?filters[language]=en");
      await GET(request);

      expect(mockGetSearchAccounts).toHaveBeenCalledWith(
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
      mockGetSearchAccounts.mockResolvedValueOnce({ hits: [], nbHits: 0 });

      const request = createRequest("?filters[claimed]=true");
      await GET(request);

      expect(mockGetSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            claimed: true,
          }),
        }),
      );
    });

    it("should filter by madeForKids status", async () => {
      mockGetSearchAccounts.mockResolvedValueOnce({ hits: [], nbHits: 0 });

      const request = createRequest("?filters[madeForKids]=false");
      await GET(request);

      expect(mockGetSearchAccounts).toHaveBeenCalledWith(
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
      mockGetSearchAccounts.mockResolvedValueOnce({ hits: [], nbHits: 0 });

      const request = createRequest("?filters[categories]=tech");
      await GET(request);

      expect(mockGetSearchAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({
            categories: ["tech"],
          }),
        }),
      );
    });

    it("should filter by multiple categories", async () => {
      mockGetSearchAccounts.mockResolvedValueOnce({ hits: [], nbHits: 0 });

      const request = createRequest(
        "?filters[categories][0]=tech&filters[categories][1]=gaming",
      );
      await GET(request);

      expect(mockGetSearchAccounts).toHaveBeenCalledWith(
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
      mockGetAuth.mockReturnValueOnce({ userId: null });

      const request = createRequest("?page=1");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should allow unauthenticated users on page 0", async () => {
      mockGetAuth.mockReturnValueOnce({ userId: null });
      mockGetSearchAccounts.mockResolvedValueOnce({ hits: [], nbHits: 0 });

      const request = createRequest("?page=0");
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it("should allow authenticated users on any page", async () => {
      mockGetAuth.mockReturnValueOnce({ userId: "user-123" });
      mockGetSearchAccounts.mockResolvedValueOnce({ hits: [], nbHits: 0 });

      const request = createRequest("?page=5");
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe("Error Handling", () => {
    it("should return 500 on search error", async () => {
      mockGetSearchAccounts.mockRejectedValueOnce(new Error("Search failed"));

      const request = createRequest("");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to perform search");
    });
  });

  describe("Combined Filters", () => {
    it("should handle multiple filters together", async () => {
      mockGetSearchAccounts.mockResolvedValueOnce({ hits: [], nbHits: 0 });

      const request = createRequest(
        "?query=tech&filters[platform]=youtube&filters[country]=US&filters[rating]=4-5&page=0",
      );
      await GET(request);

      expect(mockGetSearchAccounts).toHaveBeenCalledWith(
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
