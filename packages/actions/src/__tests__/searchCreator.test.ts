/**
 * Tests for Search Creator Actions
 * Tests the axios-based search API wrapper
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocks
const { mockAxiosGet } = vi.hoisted(() => {
  const mockAxiosGet = vi.fn();
  return { mockAxiosGet };
});

// Mock modules
vi.mock("axios", () => ({
  default: {
    get: mockAxiosGet,
  },
}));

vi.mock("@ratecreator/types/review", () => ({
  SearchResults: {},
  SearchAccountsParams: {},
}));

import { searchCreators } from "../review/search/searchCreator";

describe("Search Creator Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("searchCreators", () => {
    it("should search with basic query parameters", async () => {
      const mockResults = [
        { objectID: "1", name: "Creator 1", platform: "youtube" },
        { objectID: "2", name: "Creator 2", platform: "twitter" },
      ];
      mockAxiosGet.mockResolvedValueOnce({ data: mockResults });

      const params = { query: "gaming" };
      const result = await searchCreators(params);

      expect(result).toEqual(mockResults);
      expect(mockAxiosGet).toHaveBeenCalledWith("/api/search/accounts", {
        headers: { "Content-Type": "application/json" },
        params: { query: "gaming" },
      });
    });

    it("should pass all search parameters", async () => {
      mockAxiosGet.mockResolvedValueOnce({ data: [] });

      const params = {
        query: "tech",
        page: 2,
        limit: 20,
        sortBy: "followerCount",
        sortOrder: "desc",
        filters: {
          platform: ["youtube"],
          country: ["US"],
        },
      };

      await searchCreators(params);

      expect(mockAxiosGet).toHaveBeenCalledWith("/api/search/accounts", {
        headers: { "Content-Type": "application/json" },
        params,
      });
    });

    it("should return empty array when no results", async () => {
      mockAxiosGet.mockResolvedValueOnce({ data: [] });

      const result = await searchCreators({ query: "nonexistent" });

      expect(result).toEqual([]);
    });

    it("should handle search with pagination", async () => {
      const mockResults = [{ objectID: "10", name: "Creator 10" }];
      mockAxiosGet.mockResolvedValueOnce({ data: mockResults });

      const params = { query: "", page: 5, limit: 10 };
      const result = await searchCreators(params);

      expect(result).toEqual(mockResults);
      expect(mockAxiosGet).toHaveBeenCalledWith("/api/search/accounts", {
        headers: { "Content-Type": "application/json" },
        params: { query: "", page: 5, limit: 10 },
      });
    });

    it("should handle search with multiple filters", async () => {
      mockAxiosGet.mockResolvedValueOnce({ data: [] });

      const params = {
        query: "",
        filters: {
          platform: ["youtube", "twitter"],
          followers: "100K-500K",
          rating: "4-5",
          categories: ["tech", "gaming"],
          claimed: true,
        },
      };

      await searchCreators(params);

      expect(mockAxiosGet).toHaveBeenCalledWith("/api/search/accounts", {
        headers: { "Content-Type": "application/json" },
        params,
      });
    });

    it("should throw error on network failure", async () => {
      mockAxiosGet.mockRejectedValueOnce(new Error("Network Error"));

      await expect(searchCreators({ query: "test" })).rejects.toThrow(
        "Network Error",
      );
    });

    it("should throw error on API error response", async () => {
      mockAxiosGet.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { error: "Internal Server Error" },
        },
      });

      await expect(searchCreators({ query: "test" })).rejects.toBeDefined();
    });

    it("should handle empty query", async () => {
      mockAxiosGet.mockResolvedValueOnce({ data: [{ objectID: "1" }] });

      const result = await searchCreators({ query: "" });

      expect(result).toHaveLength(1);
      expect(mockAxiosGet).toHaveBeenCalledWith("/api/search/accounts", {
        headers: { "Content-Type": "application/json" },
        params: { query: "" },
      });
    });

    it("should handle sorting parameters", async () => {
      mockAxiosGet.mockResolvedValueOnce({ data: [] });

      const params = {
        query: "",
        sortBy: "rating",
        sortOrder: "asc" as const,
      };

      await searchCreators(params);

      expect(mockAxiosGet).toHaveBeenCalledWith("/api/search/accounts", {
        headers: { "Content-Type": "application/json" },
        params: expect.objectContaining({
          sortBy: "rating",
          sortOrder: "asc",
        }),
      });
    });

    it("should pass through complex filter objects", async () => {
      mockAxiosGet.mockResolvedValueOnce({ data: [] });

      const params = {
        query: "music",
        filters: {
          platform: ["youtube", "tiktok", "instagram"],
          followers: "1M-10M",
          rating: "3-5",
          videoCount: "100-500",
          reviewCount: "10-50",
          country: ["US", "UK"],
          language: ["en"],
          madeForKids: false,
        },
      };

      await searchCreators(params);

      expect(mockAxiosGet).toHaveBeenCalledWith("/api/search/accounts", {
        headers: { "Content-Type": "application/json" },
        params,
      });
    });
  });
});
