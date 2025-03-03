"use client";

import { Skeleton } from "@ratecreator/ui";

export const CategoryGlossarySkeleton = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row">
      <div className="flex-1 md:pr-8">
        <h1 className="text-3xl font-bold mb-6">Categories Glossary</h1>

        {/* Description skeleton */}
        <Skeleton className="h-8 w-full max-w-2xl mb-8" />

        {/* Alphabet navigation skeleton */}
        <div className="py-4 border-b border-gray-200 dark:border-gray-700 mb-8">
          <div className="flex flex-wrap gap-2">
            {[...Array(26)].map((_, i) => (
              <Skeleton key={i} className="w-8 h-8 rounded" />
            ))}
          </div>
        </div>

        {/* Category sections skeleton */}
        {[...Array(5)].map((_, sectionIndex) => (
          <div key={sectionIndex} className="mb-10">
            {/* Section header */}
            <Skeleton className="h-8 w-16 mb-4" />

            {/* Category cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, cardIndex) => (
                <div
                  key={cardIndex}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <Skeleton className="h-6 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop sidebar skeleton */}
      <div className="hidden md:block w-auto sticky top-20 self-start">
        <Skeleton className="h-6 w-24 mb-3" />
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-12" />
          ))}
        </div>
      </div>
    </div>
  );
};
