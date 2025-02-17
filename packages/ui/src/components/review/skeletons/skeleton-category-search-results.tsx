"use client";

import React from "react";
import {
  ArrowRightLeft,
  ChevronRight,
  SlidersHorizontal,
  SquareStack,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Skeleton,
} from "@ratecreator/ui";

export const FilterSkeleton: React.FC = () => {
  return (
    <div className='p-4 space-y-4 dark:bg-neutral-900 bg-neutral-50 rounded-md'>
      <div className='flex flex-row items-center text-primary text-lg gap-x-2'>
        <SlidersHorizontal size={20} />
        <p className='text-xl'>Filters</p>
      </div>

      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className='space-y-2'>
          <div className='h-4 dark:bg-neutral-800 bg-neutral-200 rounded w-1/3'></div>
          <div className='h-8 dark:bg-neutral-800 bg-neutral-200 rounded w-full'></div>
        </div>
      ))}
      <div className='h-10 bg-red-800 rounded w-full mt-4'></div>
    </div>
  );
};

interface CategoryLoadingCardProps {
  text: string;
  type: "sub" | "related";
}

export const CategoryLoadingCard: React.FC<CategoryLoadingCardProps> = ({
  text,
  type,
}) => {
  const Icon = type === "sub" ? SquareStack : ArrowRightLeft;

  return (
    <Accordion
      type='single'
      collapsible
      className='w-full'
      defaultValue='item-1'
    >
      <AccordionItem value='item-1'>
        <AccordionTrigger className='hover:no-underline'>
          <div className='flex flex-row items-center mb-2 text-primary text-lg gap-x-2'>
            <Icon size={20} />
            <p>{text}</p>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className='flex flex-col space-y-3'>
            <Skeleton className='h-[125px] w-[250px] rounded-xl' />
            <div className='space-y-2'>
              <Skeleton className='h-4 w-[250px]' />
              <Skeleton className='h-4 w-[200px]' />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export const CreatorLoadingCard: React.FC = () => {
  const skeletonCount = 10;

  return (
    <div className='w-full grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 justify-center'>
      {[...Array(skeletonCount)].map((_, index) => (
        <div
          key={index}
          className='flex flex-col space-y-2 max-w-80 h-96 dark:border-neutral-700 border-2 rounded-lg p-2 '
        >
          <div className='flex items-center space-x-2  h-1/4 w-full'>
            <Skeleton className='size-12 rounded-full' />
            <div className='space-y-2 '>
              <Skeleton className='h-4 w-[240px] md:w-[220px]' />
              <Skeleton className='h-4 w-3/4' />
            </div>
          </div>
          <Skeleton className='h-2/4 w-full' />
          <div className='space-y-2 h-1/4'>
            <Skeleton className='h-4 w-3/4' />
            <Skeleton className='h-4 w-3/4' />
          </div>
        </div>
      ))}
    </div>
  );
};

export const CategoryListLoadingCard: React.FC = () => {
  const skeletonCount = 7;

  return (
    <div className='w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4  gap-8'>
      {[...Array(skeletonCount)].map((_, index) => (
        <>
          <div key={index} className='flex flex-col space-y-3'>
            <Skeleton className='h-[125px] w-full rounded-xl' />
            <div className='space-y-2'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-3/4' />
            </div>
          </div>
          <div key={index} className='flex flex-col space-y-3'>
            <Skeleton className='h-[125px] w-full rounded-xl' />
            <div className='space-y-2'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-3/4' />
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-3/4' />
            </div>
          </div>
        </>
      ))}
    </div>
  );
};

export const MostPopularCategoryLoadingCard: React.FC = () => {
  const skeletonCount = 6;

  return (
    <div className='space-y-5 my-[1rem]'>
      <h1 className='text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4'>
        Most Popular Categories
      </h1>
      {[...Array(skeletonCount)].map((_, index) => (
        <div key={index} className='flex flex-col space-y-3'>
          <div className='space-y-2'>
            <Skeleton className='h-8 w-full' />
            <Skeleton className='h-8 w-3/4' />
          </div>
        </div>
      ))}
    </div>
  );
};

export const MostPopularCreatorLoadingCard: React.FC = () => {
  const skeletonCount = 12;

  return (
    <>
      <div className='flex justify-end items-center mb-4'>
        <Button variant={"link"}>
          See all <Skeleton className='h-4 w-[150px] ml-2' />
          <ChevronRight className='ml-1' size={16} />
        </Button>
      </div>
      <div className='w-full grid grid-cols-1 md:grid-cols-2  lg:grid-cols-3  gap-4'>
        {[...Array(skeletonCount)].map((_, index) => (
          <div key={index} className='flex flex-col space-y-3'>
            <Skeleton className='h-[125px] w-full rounded-xl' />
            <div className='space-y-2'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-3/4' />
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
