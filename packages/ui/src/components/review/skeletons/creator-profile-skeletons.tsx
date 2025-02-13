"use client";

import { Skeleton } from "@ratecreator/ui";
import { defaultBg } from "../creator-profile/youtube/header-youtube";

export const ChannelHeaderSkeleton = () => {
  return (
    <div className='relative max-w-screen-xl mx-auto'>
      {/* Banner Skeleton */}
      <div className='relative w-full h-[250px] md:h-[300px] lg:h-[400px] bg-muted rounded-lg shadow-lg'>
        <div className={defaultBg + " w-full h-full rounded-lg"} />
        <div className='absolute -bottom-32 left-6'>
          <Skeleton className='w-36 h-36 rounded-lg' />
        </div>
      </div>

      {/* Header Content Skeleton */}
      <div className='w-full border-none rounded-none bg-background pt-4 pl-48 space-y-6'>
        <div className='flex flex-col space-y-4 md:space-y-6 md:flex-row justify-between lg:items-start'>
          <div className='items-center'>
            <Skeleton className='h-8 w-64 mb-2 ml-4' />
            <Skeleton className='h-4 w-48 mb-4 ml-4' />
            <div className='flex items-center gap-2 ml-4 mb-4'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-4 w-24' />
            </div>
          </div>
          <div className='hidden md:flex gap-4'>
            <Skeleton className='h-10 w-32' />
            <Skeleton className='h-10 w-32' />
          </div>
        </div>
        <div className='h-10 border-t'>
          <div className='flex justify-center lg:justify-start gap-4 py-2'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className='h-8 w-24' />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const UserRatingCardSkeleton = () => {
  return (
    <div className='mt-16'>
      <Skeleton className='h-[200px] w-full max-w-3xl mx-auto rounded-xl' />
    </div>
  );
};

export const ChannelDetailsSectionSkeleton = () => {
  return (
    <div className='mt-10 space-y-8'>
      {/* Stats Section */}
      <div>
        <Skeleton className='h-8 w-48 mb-4' />
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className='h-24 w-full rounded-lg' />
          ))}
        </div>
      </div>

      {/* Description Section */}
      <div>
        <Skeleton className='h-8 w-48 mb-4' />
        <div className='space-y-2'>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className='h-4 w-full' />
          ))}
        </div>
      </div>

      {/* Keywords Section */}
      <div>
        <Skeleton className='h-8 w-48 mb-4' />
        <div className='flex flex-wrap gap-2'>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className='h-8 w-24 rounded-full' />
          ))}
        </div>
      </div>

      {/* Categories Section */}
      <div>
        <Skeleton className='h-8 w-48 mb-4' />
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className='h-32 w-full rounded-lg' />
          ))}
        </div>
      </div>
    </div>
  );
};

export const ReviewCardSkeleton = () => {
  return (
    <div className='w-full max-w-4xl mx-auto'>
      <div className='p-6 border rounded-xl space-y-6 bg-background shadow-sm'>
        {/* Header with avatar and user info */}
        <div className='flex items-start gap-4'>
          <Skeleton className='h-12 w-12 rounded-full shrink-0' />
          <div className='flex-1 space-y-2'>
            <Skeleton className='h-5 w-40 sm:w-48' />
            <div className='flex items-center gap-3'>
              <Skeleton className='h-4 w-20' />
              <div className='w-1.5 h-1.5 rounded-full bg-muted' />
              <Skeleton className='h-4 w-12' />
            </div>
          </div>
        </div>

        {/* Star rating */}
        <div className='flex gap-1.5'>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className='h-6 w-6' />
          ))}
        </div>

        {/* Review title */}
        <Skeleton className='h-6 w-48 sm:w-64' />

        {/* Review content */}
        <div className='space-y-3'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-4/5' />
        </div>

        {/* Date and actions */}
        <div className='flex items-center justify-between pt-4 border-t'>
          <Skeleton className='h-4 w-32 sm:w-40' />
          <div className='flex items-center gap-6'>
            <Skeleton className='h-4 w-20' />
            <Skeleton className='h-4 w-20' />
          </div>
        </div>
      </div>
    </div>
  );
};
