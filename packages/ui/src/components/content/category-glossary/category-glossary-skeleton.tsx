"use client";

import { Skeleton } from "@ratecreator/ui";

export const CategoryGlossarySkeleton = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row">
      {/* Sidebar navigation for mobile - fixed at bottom - always visible */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-700 p-3 z-20 shadow-lg">
        <div className="overflow-x-auto">
          <div className="flex space-x-2 pb-1">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="min-w-[32px] h-8 rounded" />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 md:pr-8 pb-16 md:pb-0">
        <h1 className="text-3xl font-bold mb-2">Categories Glossary</h1>

        {/* Description skeleton */}
        <Skeleton className="h-16 w-full max-w-2xl mb-8" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-full sm:min-w-96" />
        </div>

        {/* Alphabet navigation skeleton - now above category sections */}
        <div className="py-4 border-b border-gray-200 dark:border-gray-700 mb-8">
          <div className="flex flex-wrap gap-1 justify-center">
            {[...Array(27)].map((_, i) => (
              <Skeleton key={i} className="w-8 h-8 rounded" />
            ))}
          </div>
        </div>

        {/* Category sections skeleton */}
        {[...Array(5)].map((_, sectionIndex) => (
          <div key={sectionIndex} className="mb-10">
            {/* Section header */}
            <Skeleton className="h-8 w-16 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2" />

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
      <div className="hidden md:block w-auto sticky top-32 self-start max-h-[calc(100vh-80px)] overflow-y-auto">
        <div className="p-0 rounded-lg">
          <Skeleton className="h-6 w-24 mb-1" />
          <div className="space-y-1">
            {[...Array(27)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
