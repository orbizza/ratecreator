// components/FilterSidebar.tsx

"use client";
import React, { useEffect, useState } from "react";
import {
  AppWindow,
  Baby,
  BadgeCheck,
  Globe,
  Info,
  Languages,
  MessagesSquare,
  RouteOff,
  SlidersHorizontal,
  Sparkles,
  Users,
  Video,
} from "lucide-react";

import { useResetRecoilState, useRecoilState } from "recoil";

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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

import { RatingCheckbox } from "./filters-rating-select";
import { PlatformCheckbox } from "./filter-platform-select";
import { FollowersCheckbox } from "./filter-follower-select";
import { VideoCountCheckbox } from "./filter-video-select";
import { ReviewCountCheckbox } from "./filter-reviews-count-select";
import { CountrySelect } from "./filter-country-select";
import { LanguageSelect } from "./filter-language-select";
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

const ClaimedSelect = () => {
  const [claimed, setClaimed] = useRecoilState(claimedFilterState);

  const handleClaimedChange = (value: string) => {
    setClaimed(
      value === "claimed-true" ? true : value === "claimed-false" ? false : null
    );
  };

  return (
    <Select
      value={claimed === null ? "" : claimed ? "claimed-true" : "claimed-false"}
      onValueChange={handleClaimedChange}
    >
      <SelectTrigger>
        <SelectValue placeholder='All Statuses' />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='claimed-true'>Yes</SelectItem>
        <SelectItem value='claimed-false'>No</SelectItem>
      </SelectContent>
    </Select>
  );
};

const MadeForKidsSelect = () => {
  const [madeForKids, setMadeForKids] = useRecoilState(madeForKidsFilterState);

  const handleMadeForKidsChange = (value: string) => {
    setMadeForKids(
      value === "kids-true" ? true : value === "kids-false" ? false : null
    );
  };

  return (
    <Select
      value={
        madeForKids === null ? "" : madeForKids ? "kids-true" : "kids-false"
      }
      onValueChange={handleMadeForKidsChange}
    >
      <SelectTrigger>
        <SelectValue placeholder='All contents' />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='kids-true'>Yes</SelectItem>
        <SelectItem value='kids-false'>No</SelectItem>
      </SelectContent>
    </Select>
  );
};

export const FilterSidebar: React.FC<FilterSidebarProps> = ({}) => {
  const [isMounted, setIsMounted] = useState(false);
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

  if (!isMounted) {
    return null;
  }

  const FilterContent = () => (
    <div className='space-y-4'>
      <Accordion type='single' collapsible className='space-y-2'>
        <AccordionItem value='platform' className='border-0'>
          <AccordionTrigger className='hover:no-underline p-1'>
            <div className='flex flex-row gap-x-2 items-center'>
              <AppWindow size={16} />
              <span className='text-[16px]'>Platforms</span>
              <Info size={14} className='text-muted-foreground' />
            </div>
          </AccordionTrigger>
          <AccordionContent className='mt-2 p-2 overflow-hidden shadow-md rounded-md bg-neutral-100 text-foreground dark:bg-neutral-950 dark:text-foreground'>
            <PlatformCheckbox />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value='followers-count' className='border-0 '>
          <AccordionTrigger className='hover:no-underline p-1'>
            <div className='flex flex-row gap-x-2 items-center'>
              <Users size={16} />
              <span className='text-[16px]'>Followers</span>
              <Info size={14} className='text-muted-foreground' />
            </div>
          </AccordionTrigger>
          <AccordionContent className='mt-2 p-2 overflow-hidden shadow-md rounded-md bg-neutral-100 text-foreground dark:bg-neutral-950 dark:text-foreground'>
            <FollowersCheckbox />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value='rating' className='border-0'>
          <AccordionTrigger className='hover:no-underline p-1'>
            <div className='flex flex-row gap-x-2 items-center'>
              <Sparkles size={16} />
              <span className='text-[16px]'>Ratings</span>
              <Info size={14} className='text-muted-foreground' />
            </div>
          </AccordionTrigger>
          <AccordionContent className='mt-2 p-2 overflow-hidden shadow-md rounded-md bg-neutral-100 text-foreground dark:bg-neutral-950 dark:text-foreground'>
            <RatingCheckbox />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value='review-count' className='border-0'>
          <AccordionTrigger className='hover:no-underline p-1'>
            <div className='flex flex-row gap-x-2 items-center'>
              <MessagesSquare size={16} />
              <span className='text-[16px]'>Review Count</span>
              <Info size={14} className='text-muted-foreground' />
            </div>
          </AccordionTrigger>
          <AccordionContent className='mt-2 p-2 overflow-hidden shadow-md rounded-md bg-neutral-100 text-foreground dark:bg-neutral-950 '>
            <ReviewCountCheckbox />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value='video-count' className='border-0'>
          <AccordionTrigger className='hover:no-underline p-1'>
            <div className='flex flex-row gap-x-2 items-center'>
              <Video size={16} />
              <span className='text-[16px]'>Video Count</span>
              <Info size={14} className='text-muted-foreground' />
            </div>
          </AccordionTrigger>
          <AccordionContent className='mt-2 p-2 overflow-hidden shadow-md rounded-md bg-neutral-100 text-foreground dark:bg-neutral-950'>
            <VideoCountCheckbox />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      {/*  ToDo: Claim Status after Algolia is updated  */}
      {/* <div className='flex flex-col mb-2 gap-y-1'>
        <div className='flex flex-row gap-x-2 items-center'>
          <BadgeCheck size={16} />
          <span className='text-[16px]'>Claimed</span>
          <Info size={14} className='text-muted-foreground' />
        </div>

        <ClaimedSelect />
      </div> */}

      {/* Made for Kids */}
      <div className='flex flex-col mb-2 gap-y-1'>
        <div className='flex flex-row gap-x-2 items-center'>
          <Baby size={16} />
          <span className='text-[16px]'>Made for kids</span>
          <Info size={14} className='text-muted-foreground' />
        </div>

        <MadeForKidsSelect />
      </div>
      <div className='flex flex-col gap-y-1'>
        <div className='flex flex-row gap-x-2 items-center'>
          <Globe size={16} />
          <span className='text-[16px]'>Countries</span>
          <Info size={14} className='text-muted-foreground' />
        </div>
        <CountrySelect />
      </div>
      <div className='flex flex-col gap-y-1'>
        <div className='flex flex-row gap-x-2 items-center'>
          <Languages size={16} />
          <span className='text-[16px]'>Languages</span>
          <Info size={14} className='text-muted-foreground' />
        </div>
        <LanguageSelect />
      </div>
      <Button
        variant='default'
        size='sm'
        className='w-full mt-4 gap-2'
        onClick={handleClearFilters}
      >
        <RouteOff size={16} />
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
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side='left' className='w-[300px]'>
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
      <div className='hidden xl:block rounded-lg overflow-hidden shadow-md bg-gray-50 text-foreground dark:bg-stone-900 dark:text-foreground p-4 space-y-4'>
        <div className='flex flex-row items-center text-primary text-lg gap-x-2'>
          <SlidersHorizontal size={20} />
          <p className='text-xl'>Filters</p>
        </div>
        <FilterContent />
      </div>
    </>
  );
};
