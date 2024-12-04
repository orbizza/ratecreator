// components/FilterSidebar.tsx

"use client";
import React, { useEffect, useState } from "react";
import { RouteOff, SlidersHorizontal } from "lucide-react";
import { useResetRecoilState, useRecoilState } from "recoil";

import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@ratecreator/ui";

import { RatingCheckbox } from "../filters/filters-rating-select";
import { PlatformCheckbox } from "../filters/filter-platform-select";
import { FollowersCheckbox } from "../filters/filter-follower-select";
import { VideoCountCheckbox } from "../filters/filter-video-select";
import { ReviewCountCheckbox } from "../filters/filter-reviews-count-select";
import { CountrySelect } from "../filters/filter-country-select";
import { LanguageSelect } from "../filters/filter-language-select";
import { MadeForKidsSelect } from "../filters/filter-kids-select";
import { ClaimedSelect } from "../filters/filter-claimed-select";

import {
  languageFiltersState,
  countryFiltersState,
  followersFiltersState,
  platformFiltersState,
  ratingFiltersState,
  reviewCountFiltersState,
  videoCountFiltersState,
  madeForKidsFilterState,
  claimedFilterState,
  sortByFilterState,
  isDescendingFilterState,
  pageNumberState,
} from "@ratecreator/store/review";

interface FilterSidebarProps {}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({}) => {
  const [isMounted, setIsMounted] = useState(false);

  // state reset functions
  const resetPlatformFilters = useResetRecoilState(platformFiltersState);
  const resetFollowersFilters = useResetRecoilState(followersFiltersState);
  const resetRatingFilters = useResetRecoilState(ratingFiltersState);
  const resetVideoCountFilters = useResetRecoilState(videoCountFiltersState);
  const resetReviewCountFilters = useResetRecoilState(reviewCountFiltersState);
  const resetCountryFilters = useResetRecoilState(countryFiltersState);
  const resetLanguageFilters = useResetRecoilState(languageFiltersState);
  const resetClaimedFilter = useResetRecoilState(claimedFilterState);
  const resetMadeForKidsFilter = useResetRecoilState(madeForKidsFilterState);
  const resetSortByFilter = useResetRecoilState(sortByFilterState);
  const resetIsDescendingFilter = useResetRecoilState(isDescendingFilterState);
  const resetPageNumber = useResetRecoilState(pageNumberState);

  // state selectors
  const [platformFilters] = useRecoilState(platformFiltersState);
  const [followersFilters] = useRecoilState(followersFiltersState);
  const [ratingFilters] = useRecoilState(ratingFiltersState);
  const [videoCountFilters] = useRecoilState(videoCountFiltersState);
  const [reviewCountFilters] = useRecoilState(reviewCountFiltersState);
  const [countryFilters] = useRecoilState(countryFiltersState);
  const [languageFilters] = useRecoilState(languageFiltersState);
  const [claimed] = useRecoilState(claimedFilterState);
  const [madeForKids] = useRecoilState(madeForKidsFilterState);
  const [sortBy] = useRecoilState(sortByFilterState);
  const [isDescending] = useRecoilState(isDescendingFilterState);

  const hasActiveFilters = () => {
    return (
      platformFilters.length > 0 ||
      followersFilters.length > 0 ||
      ratingFilters.length > 0 ||
      videoCountFilters.length > 0 ||
      reviewCountFilters.length > 0 ||
      countryFilters.length > 0 ||
      languageFilters.length > 0 ||
      claimed !== null ||
      madeForKids !== null ||
      sortBy !== "followed" ||
      !isDescending
    );
  };

  const handleClearFilters = () => {
    resetPlatformFilters();
    resetFollowersFilters();
    resetRatingFilters();
    resetVideoCountFilters();
    resetReviewCountFilters();
    resetCountryFilters();
    resetLanguageFilters();
    resetClaimedFilter();
    resetMadeForKidsFilter();
    resetSortByFilter();
    resetIsDescendingFilter();
    resetPageNumber();
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    resetPageNumber();
  }, [
    platformFilters,
    followersFilters,
    ratingFilters,
    videoCountFilters,
    reviewCountFilters,
    countryFilters,
    languageFilters,
    claimed,
    madeForKids,
    sortBy,
    isDescending,
    resetPageNumber,
  ]);

  if (!isMounted) {
    return null;
  }

  const FilterContent = () => (
    <div className='space-y-4'>
      <PlatformCheckbox />
      <FollowersCheckbox />
      <RatingCheckbox />
      <ReviewCountCheckbox />
      <VideoCountCheckbox />
      {/*  ToDo: Enable Claim Status after Algolia is updated  */}
      {/* <ClaimedSelect /> */}

      <MadeForKidsSelect />
      <CountrySelect />
      <LanguageSelect />

      <Button
        variant='default'
        size='sm'
        className='w-full mt-4 gap-2 '
        onClick={handleClearFilters}
        disabled={!hasActiveFilters()}
      >
        <RouteOff size={16} className='mr-2' />
        Clear Filters
      </Button>
    </div>
  );
  return (
    <>
      {/* Mobile Sheet Filter */}
      <div className='xl:hidden'>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant='default'
              size='sm'
              className='flex items-center gap-2'
            >
              <SlidersHorizontal size={16} />
              <span className='hidden md:inline-block'>Filters</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side='left'
            className='w-[300px] overflow-y-auto max-h-screen'
          >
            <SheetHeader className='flex '>
              <SheetTitle className='flex text-primary items-center gap-2'>
                <SlidersHorizontal size={20} />
                Filters
              </SheetTitle>
            </SheetHeader>
            <div className='mt-6'>
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className='hidden xl:flex mt-1 rounded-lg overflow-hidden shadow-md flex-col'>
        <div className='dark:bg-neutral-900 bg-neutral-50 p-4 flex-grow'>
          <Accordion
            type='single'
            collapsible
            className='w-full'
            defaultValue='item-1'
          >
            <AccordionItem value='item-1' className='border-0'>
              <AccordionTrigger className='hover:no-underline'>
                <div className='flex flex-row items-center mb-2 text-primary text-lg gap-x-2'>
                  <SlidersHorizontal size={20} />
                  <p className='text-xl'>Filters</p>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <FilterContent />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </>
  );
};
