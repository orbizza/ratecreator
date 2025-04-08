import { Skeleton } from "@ratecreator/ui";

export const GlossaryPostSkeleton = () => {
  return (
    <div className='w-full  max-w-3xl mx-auto space-y-6 sm:space-y-8 p-2 sm:p-4 bg-background '>
      {/* Header with back button and edit info */}
      <div className='flex justify-between items-center '>
        <Skeleton className='h-8 w-20 dark:bg-neutral-800/50 bg-neutral-200/50' />
      </div>
      {/* Title skeleton */}
      <div className='space-y-4'>
        <Skeleton className='h-8 sm:h-12 w-full sm:w-3/4 dark:bg-neutral-800/50 bg-neutral-200/50' />
        <Skeleton className='h-6 w-full max-w-2xl dark:bg-neutral-800/50 bg-neutral-200/50' />
      </div>

      {/* Excerpt skeleton */}
      <div className='flex items-center space-x-4'>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-24 dark:bg-neutral-800/50 bg-neutral-200/50' />
          <Skeleton className='h-4 w-32 dark:bg-neutral-800/50 bg-neutral-200/50' />
        </div>
      </div>

      {/* Content skeleton */}
      <div className='space-y-6'>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-full dark:bg-neutral-800/50 bg-neutral-200/50' />
          <Skeleton className='h-4 w-[95%] dark:bg-neutral-800/50 bg-neutral-200/50' />
          <Skeleton className='h-4 w-[90%] dark:bg-neutral-800/50 bg-neutral-200/50' />
        </div>

        <div className='space-y-2'>
          <Skeleton className='h-4 w-full dark:bg-neutral-800/50 bg-neutral-200/50' />
          <Skeleton className='h-4 w-[92%] dark:bg-neutral-800/50 bg-neutral-200/50' />
          <Skeleton className='h-4 w-[88%] dark:bg-neutral-800/50 bg-neutral-200/50' />
        </div>

        <div className='space-y-2'>
          <Skeleton className='h-4 w-full dark:bg-neutral-800/50 bg-neutral-200/50' />
          <Skeleton className='h-4 w-[94%] dark:bg-neutral-800/50 bg-neutral-200/50' />
          <Skeleton className='h-4 w-[89%] dark:bg-neutral-800/50 bg-neutral-200/50' />
        </div>
      </div>

      {/* Social sharing section */}
      <div className='flex justify-between items-center pt-8'>
        <div className='flex gap-3'>
          <Skeleton className='h-10 w-10 rounded-full dark:bg-neutral-800/50 bg-neutral-200/50' />
          <Skeleton className='h-10 w-10 rounded-full dark:bg-neutral-800/50 bg-neutral-200/50' />
          <Skeleton className='h-10 w-10 rounded-full dark:bg-neutral-800/50 bg-neutral-200/50' />
        </div>
        <Skeleton className='h-10 w-32 rounded-md dark:bg-neutral-800/50 bg-neutral-200/50' />
      </div>
    </div>
  );
};
