"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PlaceholdersAndVanishInputCategory } from "@ratecreator/ui";
import { Category, SearchResult } from "@ratecreator/types/review";
import SearchResults from "./search-results";
import debounce from "lodash/debounce";

interface SearchBarProps {
  categories: Category[];
  isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ categories, isLoading }) => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const placeholders = [
    "Enter any category name",
    "Search for categories",
    "Search for sub-categories",
    "Find categories, subcategories or sub-subcategories",
  ];

  const debouncedSearch = useCallback(
    debounce((term: string) => {
      if (term.length > 0) {
        const results = searchCategories(categories, term);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }, 300),
    [categories]
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  const searchCategories = (
    categories: Category[],
    term: string
  ): SearchResult[] => {
    const results: SearchResult[] = [];
    const searchLower = term.toLowerCase();

    categories.forEach((category) => {
      if (matchesSearch(category, searchLower)) {
        results.push({ ...category, depth: 0 });
      }

      if (category.subcategories) {
        category.subcategories.forEach((subcat) => {
          if (matchesSearch(subcat, searchLower)) {
            results.push({
              ...subcat,
              parentCategory: category.name,
              depth: 1,
            });
          }

          if (subcat.subcategories) {
            subcat.subcategories.forEach((subsubcat) => {
              if (matchesSearch(subsubcat, searchLower)) {
                results.push({
                  ...subsubcat,
                  parentCategory: `${category.name} > ${subcat.name}`,
                  depth: 2,
                });
              }
            });
          }
        });
      }
    });

    return results;
  };

  const matchesSearch = (category: Category, term: string): boolean => {
    return Boolean(
      category.name.toLowerCase().includes(term) ||
        (category.keywords &&
          category.keywords.some((keyword) =>
            keyword.toLowerCase().includes(term)
          )) ||
        (category.shortDescription &&
          category.shortDescription.toLowerCase().includes(term)) ||
        (category.longDescription &&
          category.longDescription.toLowerCase().includes(term))
    );
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Reset search filter
    setSearchTerm("");
    setSearchResults([]);
  };

  if (isLoading) {
    return <div>Loading categories...</div>;
  }

  return (
    <div className='mb-4 w-full items-center justify-center flex flex-col'>
      <PlaceholdersAndVanishInputCategory
        placeholders={placeholders}
        onSubmit={onSubmit}
        onChange={onChange}
        // passedValue={searchTerm}
      />
      {searchResults.length > 0 ? (
        <SearchResults results={searchResults} />
      ) : (
        searchTerm.length > 0 && (
          <div className='mt-2 text-gray-500 dark:text-gray-400'>
            No results found. Please try a different search term.
          </div>
        )
      )}
    </div>
  );
};

export default SearchBar;
