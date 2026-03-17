"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface SearchResult {
  accountId: string;
  objectID: string;
  platform: string;
  handle: string;
  name: string;
  description: string;
  followerCount: number;
  imageUrl: string;
  categories: string[];
  rating: number;
  reviewCount: number;
  [key: string]: any;
}

interface UseAccountSearchResult {
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
}

const cache = new Map<string, SearchResult[]>();

export function useAccountSearch(
  query: string,
  limit: number = 10,
): UseAccountSearchResult {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPopular = useCallback(async () => {
    const cacheKey = `__popular__:${limit}`;
    if (cache.has(cacheKey)) {
      setResults(cache.get(cacheKey)!);
      setIsLoading(false);
      return;
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const params = new URLSearchParams({
        query: "",
        limit: String(limit),
        sortBy: "followed",
        sortOrder: "desc",
      });

      const response = await fetch(`/api/search/accounts?${params}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      const hits = data.hits || [];

      cache.set(cacheKey, hits);

      if (!controller.signal.aborted) {
        setResults(hits);
        setError(null);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message);
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [limit]);

  const search = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        // Fetch popular creators when query is empty
        await fetchPopular();
        return;
      }

      // Check cache
      const cacheKey = `${searchQuery}:${limit}`;
      if (cache.has(cacheKey)) {
        setResults(cache.get(cacheKey)!);
        setIsLoading(false);
        return;
      }

      // Abort previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const params = new URLSearchParams({
          query: searchQuery,
          limit: String(limit),
        });

        const response = await fetch(`/api/search/accounts?${params}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data = await response.json();
        const hits = data.hits || [];

        // Cache results
        cache.set(cacheKey, hits);

        // Only update if this request wasn't aborted
        if (!controller.signal.aborted) {
          setResults(hits);
          setError(null);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError(err.message);
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [limit, fetchPopular],
  );

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setIsLoading(true);

    if (!query.trim()) {
      // Fetch popular creators immediately (no debounce needed)
      search("");
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      search(query);
    }, 200);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, search]);

  return { results, isLoading, error };
}
