"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSearchBox, useHits } from "react-instantsearch";
import debounce from "lodash/debounce";
import { useRouter } from "next/navigation";
import AlgoliaSearchWithAnimations from "./search-algolia-placeholder";
import SearchResults from "./search-results";
import { SearchResult } from "@ratecreator/types/review";
import { searchCache } from "@ratecreator/db/utils";

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
 * Structure of Algolia search hits
 */
interface AlgoliaHit {
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
 * A search component that integrates with Algolia for category search functionality.
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
  const { refine } = useSearchBox();
  const { hits } = useHits<AlgoliaHit>();
  const [cachedResults, setCachedResults] = useState<SearchResult[] | null>(
    null,
  );

  /**
   * Debounced search refinement function
   * Checks cache first, then falls back to Algolia search
   */
  const debouncedRefine = useCallback(
    debounce(async (value: string) => {
      const cached = await searchCache.getCachedResults(value);
      if (cached) {
        setCachedResults(cached);
        setIsSearchOpen(true);
      } else {
        setCachedResults(null);
        refine(value);
        setIsSearchOpen(value.length > 0);
      }
    }, 300),
    [refine],
  );

  /**
   * Handle search input changes
   * Updates search term and triggers debounced search
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    debouncedRefine(newValue);
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
    refine("");
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
   * Map Algolia hits to SearchResult format
   * @param {AlgoliaHit[]} hits - Array of Algolia search hits
   * @returns {SearchResult[]} Formatted search results
   */
  const mapHitsToSearchResults = (hits: AlgoliaHit[]): SearchResult[] => {
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
   * Cache search results when new hits are received
   */
  useEffect(() => {
    if (hits.length > 0 && searchTerm) {
      const results = mapHitsToSearchResults(hits);
      searchCache.setCachedResults(searchTerm, results);
    }
  }, [hits, searchTerm]);

  // Use cached results if available, otherwise use current hits
  const displayResults = cachedResults || mapHitsToSearchResults(hits);

  return (
    <>
      <AlgoliaSearchWithAnimations
        placeholders={placeholders}
        onSubmit={handleSubmit}
        onChange={handleChange}
        onSearch={handleSearch}
        value={searchTerm}
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
