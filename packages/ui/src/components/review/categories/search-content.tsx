"use client";

import React, { useCallback, useState } from "react";
import { useSearchBox, useHits } from "react-instantsearch";
import debounce from "lodash/debounce";
import AlgoliaSearchWithAnimations from "./search-algolia-placeholder";
import SearchResults from "./search-results";
import { SearchResult } from "@ratecreator/types/review";

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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { refine } = useSearchBox();
  const { hits } = useHits<AlgoliaHit>();

  const debouncedRefine = useCallback(
    debounce((value: string) => {
      refine(value);
      setIsSearchOpen(value.length > 0);
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
        (hits.length > 0 ? (
          <SearchResults results={mapHitsToSearchResults(hits)} />
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
