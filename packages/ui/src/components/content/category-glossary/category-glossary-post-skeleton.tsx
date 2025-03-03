"use client";

import {
  Skeleton,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Separator,
} from "@ratecreator/ui";
import { Hash, Layers2, ReceiptText, UserSearch, Info } from "lucide-react";

export const CategoryGlossaryPostSkeleton = () => {
  return (
    <div className='flex flex-col gap-4 max-w-5xl mx-auto px-4 sm:px-6'>
      {/* Breadcrumb skeleton */}
      <div className='flex items-center gap-1.5 text-sm text-muted-foreground mb-2'>
        <Skeleton className='h-4 w-24' />
        <span>/</span>
        <Skeleton className='h-4 w-32' />
      </div>

      {/* Title skeleton */}
      <div className='flex flex-row gap-x-2 items-center text-primary'>
        <Layers2 size={28} />
        <Skeleton className='h-9 w-64' />
      </div>

      {/* Category Details accordion skeleton */}
      <Accordion type='single' collapsible defaultValue='channel-description'>
        <AccordionItem value='channel-description' className='border-0'>
          <AccordionTrigger className='text-2xl font-bold hover:no-underline'>
            <div className='flex flex-row gap-x-2 items-center text-primary'>
              <ReceiptText size={28} />
              <span className=''>Category Details</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className='prose dark:prose-invert max-w-none'>
              <h2 className='text-lg font-semibold'>Short Description</h2>
              <div className='mt-2 space-y-2'>
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-3/4' />
              </div>
            </div>
            <div className='prose dark:prose-invert max-w-none mt-4'>
              <h2 className='text-lg font-semibold'>Long Description</h2>
              <div className='mt-2 space-y-2'>
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-2/3' />
              </div>
            </div>
            <div className='flex flex-row gap-x-2 items-center text-primary mt-4'>
              <UserSearch size={20} />
              <h2 className='text-lg font-semibold'>Category Accounts</h2>
              <Info size={12} className='text-muted-foreground' />
            </div>
            <div className='flex flex-col items-start gap-2 mt-2'>
              <Skeleton className='h-4 w-48' />
              <Skeleton className='h-4 w-40' />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Separator />

      {/* Category Keywords accordion skeleton */}
      <Accordion type='single' collapsible defaultValue='category-keywords'>
        <AccordionItem value='category-keywords' className='border-0'>
          <AccordionTrigger className='text-2xl font-bold hover:no-underline'>
            <div className='flex flex-row gap-x-2 items-center text-primary'>
              <Hash size={28} />
              <span className=''>Category Keywords</span>
              <Info size={14} className='text-muted-foreground' />
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className='flex flex-wrap gap-2'>
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className='h-8 w-24 rounded-full' />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
