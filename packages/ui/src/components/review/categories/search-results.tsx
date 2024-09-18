"use client";
"use client";

import React from "react";
import Link from "next/link";
import { SearchResult } from "@ratecreator/types/review";
import { ExternalLink } from "lucide-react";

interface SearchResultsProps {
  results: SearchResult[];
}

const SearchResults: React.FC<SearchResultsProps> = ({ results }) => {
  if (results.length === 0) return null;

  const rootCategories = results.filter((result) => result.depth === 0);
  const subCategories = results.filter(
    (result) => result.depth === 1 || result.depth === 2,
  );

  // Get unique root categories from subcategories
  const uniqueRootCategories = Array.from(
    new Set(subCategories.map((sub) => sub.parentCategory?.split(" > ")[0])),
  ).filter(Boolean) as string[];

  // Combine unique root categories with existing root categories
  const allRootCategories = Array.from(
    new Set([
      ...rootCategories.map((cat) => cat.name),
      ...uniqueRootCategories,
    ]),
  );

  return (
    <div className="mt-2 w-full max-w-xl bg-background rounded-lg shadow-lg overflow-hidden border border-border">
      <div className="p-4 border-b border-border">
        <p className="text-sm text-muted-foreground">
          Categories ({allRootCategories.length}) | SubCategories (
          {subCategories.length})
        </p>
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        {allRootCategories.length > 0 && (
          <div className="p-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">
              CATEGORIES ({allRootCategories.length})
            </h3>
            <ul className="space-y-2">
              {allRootCategories.map((categoryName, index) => {
                const category = rootCategories.find(
                  (cat) => cat.name === categoryName,
                ) || {
                  name: categoryName,
                  slug: categoryName.toLowerCase().replace(/\s+/g, "-"),
                };
                return (
                  <li key={index}>
                    <Link href={`/categories/${category.slug}`} passHref>
                      <button className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors duration-200">
                        <div className=" flex flex-row justify-between items-center font-medium text-foreground">
                          {category.name}
                          <ExternalLink />
                        </div>
                      </button>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {subCategories.length > 0 && (
          <div className="p-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">
              SUB-CATEGORIES ({subCategories.length})
            </h3>
            <ul className="space-y-2">
              {subCategories.map((result, index) => (
                <li key={index}>
                  <Link href={`/categories/${result.slug}`} passHref>
                    <button className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors duration-200">
                      <div className="flex flex-row justify-between ">
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
                        <ExternalLink className="text-foreground" />
                      </div>
                    </button>
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
