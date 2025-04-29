"use client";

import React from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { SearchResult } from "@ratecreator/types/review";

/**
 * Props for the SearchResults component
 */
interface SearchResultsProps {
  /** Array of search result objects to display */
  results: SearchResult[];
}

/**
 * SearchResults Component
 *
 * A component that displays search results for categories and subcategories.
 * Features include:
 * - Separate sections for root categories and subcategories
 * - Category descriptions and popularity indicators
 * - Parent category information for subcategories
 * - Scrollable results container
 * - External link indicators
 *
 * @component
 * @param {SearchResultsProps} props - Component props
 * @returns {JSX.Element} A search results display component
 */
const SearchResults: React.FC<SearchResultsProps> = ({ results }) => {
  // Filter results by depth
  const rootCategories = results.filter((result) => result.depth === 0);
  const subCategories = results.filter(
    (result) => result.depth === 1 || result.depth === 2,
  );

  return (
    <div className="mt-2 w-full max-w-xl bg-background rounded-lg shadow-lg overflow-hidden border border-border">
      {/* Results summary header */}
      <div className="p-4 border-b border-border">
        <p className="text-sm text-muted-foreground">
          Categories ({rootCategories.length}) | SubCategories (
          {subCategories.length})
        </p>
      </div>

      {/* Scrollable results container */}
      <div className="max-h-[400px] overflow-y-auto">
        {/* Root categories section */}
        {rootCategories.length > 0 && (
          <div className="p-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">
              CATEGORIES ({rootCategories.length})
            </h3>
            <ul className="space-y-2">
              {rootCategories.map((category) => (
                <li key={category.id}>
                  <Link href={`/categories/${category.slug}`} passHref>
                    <div className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors duration-200">
                      <div className="flex flex-row justify-between items-center font-medium text-foreground">
                        <span>{category.name}</span>
                        <ExternalLink className="h-4 w-4" />
                      </div>
                      {category.shortDescription && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {category.shortDescription}
                        </p>
                      )}
                      {category.popular && (
                        <span className="text-xs text-primary mt-1">
                          Most Popular Category
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Subcategories section */}
        {subCategories.length > 0 && (
          <div className="p-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">
              SUB-CATEGORIES ({subCategories.length})
            </h3>
            <ul className="space-y-2">
              {subCategories.map((result) => (
                <li key={result.id}>
                  <Link href={`/categories/${result.slug}`} passHref>
                    <div className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors duration-200">
                      <div className="flex flex-row justify-between items-center">
                        <div>
                          <span className="font-medium text-foreground">
                            {result.name}
                          </span>
                          {result.parentCategory && (
                            <span className="ml-2 text-sm text-muted-foreground">
                              in {result.parentCategory}
                            </span>
                          )}
                        </div>
                        <ExternalLink className="h-4 w-4 text-foreground" />
                      </div>
                      {result.shortDescription && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {result.shortDescription}
                        </p>
                      )}
                      {result.popular && (
                        <span className="text-xs text-blue-500 mt-1">
                          Popular
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
