import { Skeleton } from "@ratecreator/ui";

export const GlossarySkeleton = () => {
  return (
    <div className='max-w-6xl mx-auto px-4 py-8'>
      <div className='text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-bold justify-center text-center mb-10'>
        Creator Economy Glossary
      </div>

      {/* Search bar skeleton */}
      <div className='items-center justify-between gap-4 mb-8 relative w-full max-w-2xl mx-auto'>
        <Skeleton className='h-10 w-full ' />
      </div>

      {/* Category sections skeleton */}
      {[...Array(3)].map((_, sectionIndex) => (
        <div key={sectionIndex} className='mb-10'>
          <Skeleton className='h-8 w-24 mb-4' />
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {[...Array(6)].map((_, itemIndex) => (
              <div
                key={itemIndex}
                className='border border-gray-200 dark:border-gray-700 rounded-lg p-4'
              >
                <Skeleton className='h-6 w-3/4 mb-2' />
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-2/3 mt-1' />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
