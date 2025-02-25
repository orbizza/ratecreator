"use client";

import { Skeleton } from "@ratecreator/ui";
import { defaultBg } from "../creator-profile/youtube/header-youtube";

export const ChannelHeaderSkeleton = () => {
  return (
    <div className="relative w-full max-w-screen-xl mx-auto px-4 sm:px-6">
      {/* Banner Skeleton */}
      <div className="relative w-full h-[200px] sm:h-[250px] md:h-[300px] lg:h-[400px] bg-muted rounded-lg shadow-lg">
        <div className={defaultBg + " w-full h-full rounded-lg"} />
        <div className="absolute -bottom-16 sm:-bottom-24 md:-bottom-32 left-4 sm:left-6">
          <Skeleton className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-lg" />
        </div>
      </div>

      {/* Header Content Skeleton */}
      <div className="w-full border-none rounded-none bg-background pt-20 sm:pt-4 sm:pl-40 md:pl-48 space-y-4 sm:space-y-6">
        <div className="flex flex-col space-y-4 md:space-y-6 md:flex-row justify-between lg:items-start">
          <div className="items-center">
            <Skeleton className="h-6 sm:h-8 w-48 sm:w-64 mb-2 ml-0 sm:ml-4" />
            <Skeleton className="h-4 w-36 sm:w-48 mb-4 ml-0 sm:ml-4" />
            <div className="flex items-center gap-2 ml-0 sm:ml-4 mb-4">
              <Skeleton className="h-4 w-24 sm:w-32" />
              <Skeleton className="h-4 w-20 sm:w-24" />
            </div>
          </div>
          <div className="flex sm:hidden md:flex gap-4">
            <Skeleton className="h-10 w-28 sm:w-32" />
            <Skeleton className="h-10 w-28 sm:w-32" />
          </div>
        </div>
        <div className="h-10 border-t">
          <div className="flex justify-center lg:justify-start gap-2 sm:gap-4 py-2 overflow-x-auto">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 sm:w-24 flex-shrink-0" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const UserRatingCardSkeleton = () => {
  return (
    <div className="mt-8 sm:mt-12 md:mt-16 px-4 sm:px-6">
      <Skeleton className="h-[160px] sm:h-[180px] md:h-[200px] w-full max-w-3xl mx-auto rounded-xl" />
    </div>
  );
};

export const ChannelDetailsSectionSkeleton = () => {
  return (
    <div className="mt-6 sm:mt-8 md:mt-10 space-y-6 sm:space-y-8 px-4 sm:px-6">
      {/* Stats Section */}
      <div>
        <Skeleton className="h-6 sm:h-8 w-36 sm:w-48 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 sm:h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>

      {/* Description Section */}
      <div>
        <Skeleton className="h-6 sm:h-8 w-36 sm:w-48 mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-3 sm:h-4 w-full" />
          ))}
        </div>
      </div>

      {/* Keywords Section */}
      <div>
        <Skeleton className="h-6 sm:h-8 w-36 sm:w-48 mb-4" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-6 sm:h-8 w-20 sm:w-24 rounded-full"
            />
          ))}
        </div>
      </div>

      {/* Categories Section */}
      <div>
        <Skeleton className="h-6 sm:h-8 w-36 sm:w-48 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 sm:h-32 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
};

export const ReviewCardSkeleton = () => {
  return (
    <>
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6">
        <div className="p-4 sm:p-6 border rounded-xl space-y-3 sm:space-y-4 bg-background shadow-sm">
          <div className="flex items-start gap-3 sm:gap-4">
            <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 sm:h-5 w-32 sm:w-40 mb-2" />
              <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
            </div>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 sm:h-5 w-4 sm:w-5" />
            ))}
          </div>
          <Skeleton className="h-5 sm:h-6 w-28 sm:w-32" />
          <div className="space-y-2">
            <Skeleton className="h-3 sm:h-4 w-full" />
            <Skeleton className="h-3 sm:h-4 w-3/4" />
          </div>
          <div className="flex items-center justify-between pt-3 sm:pt-4">
            <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
            <div className="flex gap-3 sm:gap-4">
              <Skeleton className="h-7 sm:h-8 w-7 sm:w-8" />
              <Skeleton className="h-7 sm:h-8 w-7 sm:w-8" />
            </div>
          </div>
        </div>
      </div>
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 mt-4">
        <div className="p-4 sm:p-6 border rounded-xl space-y-3 sm:space-y-4 bg-background shadow-sm">
          <div className="flex items-start gap-3 sm:gap-4">
            <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 sm:h-5 w-32 sm:w-40 mb-2" />
              <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
            </div>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 sm:h-5 w-4 sm:w-5" />
            ))}
          </div>
          <Skeleton className="h-5 sm:h-6 w-28 sm:w-32" />
          <div className="space-y-2">
            <Skeleton className="h-3 sm:h-4 w-full" />
            <Skeleton className="h-3 sm:h-4 w-3/4" />
          </div>
          <div className="flex items-center justify-between pt-3 sm:pt-4">
            <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
            <div className="flex gap-3 sm:gap-4">
              <Skeleton className="h-7 sm:h-8 w-7 sm:w-8" />
              <Skeleton className="h-7 sm:h-8 w-7 sm:w-8" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
