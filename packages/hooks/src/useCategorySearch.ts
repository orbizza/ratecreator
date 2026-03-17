"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface CategoryResult {
  objectID: string;
  name: string;
  slug: string;
  shortDescription?: string;
  parentId?: string;
  parentCategory?: string;
  depth?: number;
  popular?: boolean;
  [key: string]: any;
}

interface UseCategorySearchResult {
  results: CategoryResult[];
  isLoading: boolean;
  error: string | null;
}

const cache = new Map<string, CategoryResult[]>();

export function useCategorySearch(query: string): UseCategorySearchResult {
  const [results, setResults] = useState<CategoryResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const cacheKey = searchQuery;
    if (cache.has(cacheKey)) {
      setResults(cache.get(cacheKey)!);
      setIsLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const params = new URLSearchParams({ query: searchQuery });
      const response = await fetch(`/api/search/categories?${params}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Category search failed");
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
        setResults([]);
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    debounceTimerRef.current = setTimeout(() => {
      search(query);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, search]);

  return { results, isLoading, error };
}
