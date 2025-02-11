"use client";

import { Skeleton } from "@ratecreator/ui";

export const CreatorHeaderSkeleton = () => {
  return (
    <div className='flex items-center justify-between w-full py-4'>
      <div className='flex items-center gap-4'>
        {/* Avatar skeleton */}
        <Skeleton className='w-10 h-10 md:w-12 md:h-12 rounded-lg' />

        {/* Name and handle skeleton */}
        <div className='flex flex-col gap-2'>
          <Skeleton className='h-5 w-32 md:w-40 rounded' />
          <Skeleton className='h-4 w-24 md:w-32 rounded' />
        </div>
      </div>

      {/* Platform skeleton */}
      <div className='flex items-center gap-2'>
        <Skeleton className='w-6 h-6 md:w-7 md:h-7 rounded' />
        <Skeleton className='h-5 w-16 md:w-20 rounded' />
      </div>
    </div>
  );
};
