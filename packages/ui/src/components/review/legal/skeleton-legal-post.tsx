"use client";

import { Skeleton } from "@ratecreator/ui";

export const LegalPostSkeleton = () => {

  return (
    <div className="w-full  max-w-3xl mx-auto space-y-6 sm:space-y-8 p-2 sm:p-4 bg-background ">
      {/* Header with back button and edit info */}
      <div className="flex justify-center items-center ">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-32 dark:bg-neutral-800/50 bg-neutral-200/50" />
        </div>
      </div>

      {/* Title skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-8 sm:h-12 w-full sm:w-3/4 dark:bg-neutral-800/50 bg-neutral-200/50" />
      </div>

      {/* Author and date skeleton */}
      <div className="flex items-center space-x-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 dark:bg-neutral-800/50 bg-neutral-200/50" />
          <Skeleton className="h-4 w-32 dark:bg-neutral-800/50 bg-neutral-200/50" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full dark:bg-neutral-800/50 bg-neutral-200/50" />
          <Skeleton className="h-4 w-[95%] dark:bg-neutral-800/50 bg-neutral-200/50" />
          <Skeleton className="h-4 w-[90%] dark:bg-neutral-800/50 bg-neutral-200/50" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-full dark:bg-neutral-800/50 bg-neutral-200/50" />
          <Skeleton className="h-4 w-[92%] dark:bg-neutral-800/50 bg-neutral-200/50" />
          <Skeleton className="h-4 w-[88%] dark:bg-neutral-800/50 bg-neutral-200/50" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-full dark:bg-neutral-800/50 bg-neutral-200/50" />
          <Skeleton className="h-4 w-[94%] dark:bg-neutral-800/50 bg-neutral-200/50" />
          <Skeleton className="h-4 w-[89%] dark:bg-neutral-800/50 bg-neutral-200/50" />
        </div>
      </div>
    </div>
  );
};

