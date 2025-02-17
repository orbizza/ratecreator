"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSearchBox, useHits } from "react-instantsearch";
import debounce from "lodash/debounce";
import { useRouter } from "next/navigation";
import AlgoliaSearchWithAnimations from "./search-algolia-placeholder";
import SearchResults from "./search-results";
import { SearchResult } from "@ratecreator/types/review";
import { searchCache } from "@ratecreator/db/utils";

interface SearchContentProps {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  placeholders: string[];
}

// Define the structure of Algolia hits
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    debouncedRefine(newValue);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm) {
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
    setSearchTerm("");
    refine("");
    setIsSearchOpen(false);
  };

  const handleSearch = () => {
    setIsSearchOpen(true);
  };

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

  useEffect(() => {
    if (hits.length > 0 && searchTerm) {
      const results = mapHitsToSearchResults(hits);
      searchCache.setCachedResults(searchTerm, results);
    }
  }, [hits, searchTerm]);

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
