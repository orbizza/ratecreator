"use client";

import React, { useCallback, useEffect, useState } from "react";
import debounce from "lodash/debounce";
import { useRouter } from "next/navigation";
import AlgoliaSearchWithAnimations from "./search-algolia-placeholder";
import SearchResults from "./search-results";
import { SearchResult } from "@ratecreator/types/review";
import { searchCache } from "@ratecreator/db/utils";
import { useCategorySearch } from "@ratecreator/hooks";

/**
 * Props for the SearchContent component
 */
interface SearchContentProps {
  /** Current search term */
  searchTerm: string;
  /** Function to update the search term */
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  /** Array of placeholder texts for the search input */
  placeholders: string[];
}

/**
 * Structure of category search hits (from Elasticsearch)
 */
interface CategoryHit {
  objectID: string;
  name: string;
  slug: string;
  depth: number;
  parentCategory?: string;
  parentId?: string | null;
  popular: boolean;
  createdAt: string;
  updatedAt: string;
  shortDescription?: string | null;
  longDescription?: string | null;
  keywords: string[];
  deletedAt?: string | null;
}

/**
 * SearchContent Component
 *
 * A search component that integrates with Elasticsearch for category search functionality.
 * Features include:
 * - Debounced search input
 * - Search result caching
 * - Real-time search results display
 * - Navigation to search results page
 *
 * @component
 * @param {SearchContentProps} props - Component props
 * @returns {JSX.Element} A search component with results display
 */
const SearchContent: React.FC<SearchContentProps> = ({
  searchTerm,
  setSearchTerm,
  placeholders,
}) => {
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const {
    results: esResults,
    isLoading,
    error,
  } = useCategorySearch(searchTerm);
  const [cachedResults, setCachedResults] = useState<SearchResult[] | null>(
    null,
  );

  /**
   * Handle search input changes with debounced cache check
   */
  const debouncedCacheCheck = useCallback(
    debounce(async (value: string) => {
      const cached = await searchCache.getCachedResults(value);
      if (cached) {
        setCachedResults(cached);
        setIsSearchOpen(true);
      } else {
        setCachedResults(null);
        setIsSearchOpen(value.length > 0);
      }
    }, 300),
    [],
  );

  /**
   * Handle search input changes
   * Updates search term and triggers debounced cache check
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    debouncedCacheCheck(newValue);
  };

  /**
   * Handle search form submission
   * Navigates to search results page and resets search state
   */
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm) {
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
    setSearchTerm("");
    setIsSearchOpen(false);
  };

  /**
   * Handle search box focus
   * Opens search results panel
   */
  const handleSearch = () => {
    setIsSearchOpen(true);
  };

  /**
   * Map ES hits to SearchResult format
   * @param {CategoryHit[]} hits - Array of Elasticsearch search hits
   * @returns {SearchResult[]} Formatted search results
   */
  const mapHitsToSearchResults = (hits: CategoryHit[]): SearchResult[] => {
    return hits.map((hit) => ({
      id: hit.objectID,
      name: hit.name,
      slug: hit.slug,
      depth: hit.depth,
      parentCategory: hit.parentCategory,
      parentId: hit.parentId,
      popular: hit.popular,
      createdAt: new Date(hit.createdAt),
      updatedAt: new Date(hit.updatedAt),
      shortDescription: hit.shortDescription,
      longDescription: hit.longDescription,
      keywords: hit.keywords as String[], // Type assertion to match the Category interface
      deletedAt: hit.deletedAt ? new Date(hit.deletedAt) : null,

      parent: null,
      subcategories: undefined,
      accounts: undefined,
    }));
  };

  /**
   * Cache search results when new hits are received from Elasticsearch
   */
  useEffect(() => {
    if (esResults.length > 0 && searchTerm) {
      const results = mapHitsToSearchResults(esResults as CategoryHit[]);
      searchCache.setCachedResults(searchTerm, results);
    }
  }, [esResults, searchTerm]);

  // Use cached results if available, otherwise use current ES results
  const displayResults =
    cachedResults || mapHitsToSearchResults(esResults as CategoryHit[]);

  return (
    <>
      <AlgoliaSearchWithAnimations
        placeholders={placeholders}
        onSubmit={handleSubmit}
        onChange={handleChange}
        onSearch={handleSearch}
        value={searchTerm}
        isLoading={isLoading}
      />
      {isSearchOpen &&
        (displayResults.length > 0 ? (
          <SearchResults results={displayResults} />
        ) : (
          <div className="mt-2 w-full max-w-xl bg-background rounded-lg shadow-lg overflow-hidden border border-border p-4">
            <p className="text-center text-muted-foreground">
              No category or sub-category found
            </p>
          </div>
        ))}
    </>
  );
};

export default SearchContent;
