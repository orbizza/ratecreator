"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  useRecoilValue,
  useRecoilState,
  useResetRecoilState,
  useSetRecoilState,
} from "recoil";
import { ArrowDownZA, ArrowUpZA, Info, SlidersHorizontal } from "lucide-react";

import {
  Category,
  SearchAccount,
  SearchAccountsParams,
} from "@ratecreator/types/review";
import {
  Separator,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Toggle,
  Button,
} from "@ratecreator/ui";
import { searchCreators } from "@ratecreator/actions/review";

import { CreatorGrid } from "../cards/category-search-creator-grid";
import { PaginationBar } from "../cards/pagination-bar";
import { FilterSidebar } from "./central-search-filter-sidebar";

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
  rootCategoryFiltersState,
} from "@ratecreator/store/review";
import { useDebounce } from "@ratecreator/hooks";

import {
  CreatorLoadingCard,
  FilterSkeleton,
} from "../skeletons/skeleton-category-search-results";

export const CentralSearchResults: React.FC<{
  searchQuery?: string;
  platform?: string;
}> = ({ searchQuery, platform: initialPlatform }) => {
  const [creators, setCreators] = useState<SearchAccount[]>([]);
  const [creatorLoading, setCreatorLoading] = useState<boolean>(true);
  const [filterSidebarLoading, setFilterSidebarLoading] =
    useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<number>(0);
  const [viewCount, setViewCount] = useState<string>("");
  const [hitsPerPage, setHitsPerPage] = useState<number>(0);
  const [currentPage, setCurrentPage] = useRecoilState(pageNumberState);

  // Filters and Sorting
  const platform = useRecoilValue(platformFiltersState);
  const setPlatformFilter = useSetRecoilState(platformFiltersState);
  const followers = useRecoilValue(followersFiltersState);
  const rating = useRecoilValue(ratingFiltersState);
  const videoCount = useRecoilValue(videoCountFiltersState);
  const reviewCount = useRecoilValue(reviewCountFiltersState);
  const country = useRecoilValue(countryFiltersState);
  const language = useRecoilValue(languageFiltersState);
  const claimed = useRecoilValue(claimedFilterState);
  const madeForKids = useRecoilValue(madeForKidsFilterState);
  const rootCategory = useRecoilValue(rootCategoryFiltersState);

  const debouncedPlatform = useDebounce(platform, 1000);
  const [sortBy, setSortBy] = useRecoilState(sortByFilterState);
  const [isDescending, setIsDescending] = useRecoilState(
    isDescendingFilterState
  );

  // Add reset functions for all states
  const resetPlatform = useResetRecoilState(platformFiltersState);
  const resetFollowers = useResetRecoilState(followersFiltersState);
  const resetRating = useResetRecoilState(ratingFiltersState);
  const resetVideoCount = useResetRecoilState(videoCountFiltersState);
  const resetReviewCount = useResetRecoilState(reviewCountFiltersState);
  const resetCountry = useResetRecoilState(countryFiltersState);
  const resetLanguage = useResetRecoilState(languageFiltersState);
  const resetClaimed = useResetRecoilState(claimedFilterState);
  const resetMadeForKids = useResetRecoilState(madeForKidsFilterState);
  const resetSortBy = useResetRecoilState(sortByFilterState);
  const resetIsDescending = useResetRecoilState(isDescendingFilterState);
  const resetPageNumber = useResetRecoilState(pageNumberState);
  const resetRootCategory = useResetRecoilState(rootCategoryFiltersState);

  // Add useEffect to reset all states on mount
  useEffect(() => {
    resetPlatform();
    resetFollowers();
    resetRating();
    resetVideoCount();
    resetReviewCount();
    resetCountry();
    resetLanguage();
    resetClaimed();
    resetMadeForKids();
    resetSortBy();
    resetIsDescending();
    resetPageNumber();
    resetRootCategory();
  }, [
    resetPlatform,
    resetFollowers,
    resetRating,
    resetVideoCount,
    resetReviewCount,
    resetCountry,
    resetLanguage,
    resetClaimed,
    resetMadeForKids,
    resetSortBy,
    resetIsDescending,
    resetPageNumber,
    resetRootCategory,
  ]);

  useEffect(() => {
    if (initialPlatform && !platform.includes(initialPlatform.toLowerCase())) {
      setPlatformFilter([initialPlatform.toUpperCase()]);
    }
  }, [initialPlatform, platform, setPlatformFilter]);

  const handleToggle = () => {
    setIsDescending((prev) => !prev);
    setCurrentPage(0);
  };

  const fetchCreators = useCallback(async () => {
    try {
      setCreatorLoading(true);
      const searchParams: SearchAccountsParams = {
        query: searchQuery || "",
        page: currentPage,
        limit: 20,
        filters: {
          platform: debouncedPlatform.includes("all")
            ? undefined
            : debouncedPlatform,
          followers: followers.includes("all") ? undefined : followers,
          rating: rating.includes("all") ? undefined : rating,
          videoCount: videoCount.includes("all") ? undefined : videoCount,
          reviewCount: reviewCount.includes("all") ? undefined : reviewCount,
          country: country.includes("ALL") ? undefined : country,
          language: language.includes("all") ? undefined : language,
          claimed: claimed === null ? undefined : claimed === true,
          madeForKids: madeForKids === null ? undefined : madeForKids === true,
          categories: rootCategory ? [rootCategory] : undefined,
        },
        sortBy,
        sortOrder: isDescending ? "desc" : "asc",
      };

      const results = await searchCreators(searchParams);

      if ("hits" in results && Array.isArray(results.hits)) {
        setCreators(results.hits as SearchAccount[]);
        if ("nbHits" in results && "hitsPerPage" in results) {
          setCount(results.nbHits as number);
          setHitsPerPage(results.hitsPerPage as number);
          const hitsPerPage = 20;
          const isLastPage =
            currentPage ===
            Math.floor((results.nbHits as number) / hitsPerPage);
          const start = currentPage * hitsPerPage + 1;
          const end = isLastPage
            ? (results.nbHits as number)
            : start + hitsPerPage - 1;

          const displayRange = `${start} - ${end} `;
          setViewCount(displayRange);
        }
      } else {
        throw new Error("Invalid search results format");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setCreatorLoading(false);
    }
  }, [
    sortBy,
    isDescending,
    debouncedPlatform,
    followers,
    rating,
    videoCount,
    reviewCount,
    country,
    language,
    claimed,
    madeForKids,
    currentPage,
    rootCategory,
    searchQuery,
  ]);

  useEffect(() => {
    fetchCreators();
  }, [fetchCreators]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Add useEffect to handle initial filter sidebar loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterSidebarLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className='container mx-auto p-4 mt-16'>
      <div className='flex flex-col'>
        <div className='flex flex-col justify-center items-center w-full mx-auto m-8 gap-4'>
          <div className='flex flex-wrap justify-center items-baseline text-3xl sm:text-4xl lg:text-5xl font-bold'>
            {searchQuery && searchQuery !== " " ? (
              <>
                <span className='mr-2'>Results for</span>
                <span className='text-primary'>"{searchQuery}"</span>
              </>
            ) : (
              <>
                <span className='mr-2'>Find a </span>
                <span className='text-primary'>Creator</span>
              </>
            )}
          </div>
        </div>
        <Separator className='my-[2rem] xl:my-[4rem]' />
      </div>
      <div className='flex flex-row'>
        <div className='hidden xl:flex flex-col gap-y-2 xl:w-1/4 gap-x-2 pr-4'>
          {!filterSidebarLoading && <FilterSidebar />}
          {filterSidebarLoading && (
            <div className='flex flex-col'>
              <FilterSkeleton />
            </div>
          )}
          {/* ToDo: Add category based filter */}

          {error && <div className='text-red-500'>{error}</div>}
        </div>
        <div className='flex flex-col w-full xl:w-3/4 gap-4 mb-4'>
          <div className='flex xl:hidden gap-y-2 flex-row items-center justify-between'>
            {filterSidebarLoading && (
              <Button
                variant='default'
                size='sm'
                disabled
                className='flex items-center gap-2'
              >
                <SlidersHorizontal size={16} />
                <span className='hidden md:inline-block'>Filters</span>
              </Button>
            )}
            {!filterSidebarLoading && <FilterSidebar />}
          </div>
          <div className='flex flex-row items-center justify-between'>
            <div>
              {creatorLoading && (
                <span className='text-muted-foreground text-sm'># of ###</span>
              )}
              {!creatorLoading && (
                <div className='flex flex-row items-center gap-x-2 text-muted-foreground text-sm'>
                  {" "}
                  {viewCount} of {count} <Info size={14} />
                </div>
              )}
            </div>
            <div className='flex justify-end items-center gap-x-2'>
              <Toggle
                aria-label='Toggle Sort Order'
                pressed={!isDescending}
                onPressedChange={handleToggle}
              >
                <span className='hidden sm:inline-block text-[12px] mr-1'>
                  {isDescending ? "Most" : "Least"}
                </span>
                {isDescending ? (
                  <ArrowDownZA size={16} />
                ) : (
                  <ArrowUpZA size={16} />
                )}
              </Toggle>
              <Select
                defaultValue='followed'
                onValueChange={(value) => {
                  setSortBy(value);
                  setCurrentPage(0);
                }}
                value={sortBy}
              >
                <SelectTrigger className='w-[118px] items-center'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup className='justify-start'>
                    <SelectItem value='followed'>Followed</SelectItem>
                    <SelectItem value='new-account'>New Account</SelectItem>
                    <SelectItem value='rated'>Rated</SelectItem>
                    <SelectItem value='review-count'>Review Count</SelectItem>
                    <SelectItem value='videos'>Videos</SelectItem>
                    <SelectItem value='views'>Views</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Info size={14} />
            </div>
          </div>
          {creatorLoading && <CreatorLoadingCard />}
          {!creatorLoading && (
            <>
              <CreatorGrid creators={creators} />
              <PaginationBar
                currentPage={currentPage}
                totalPages={Math.ceil(count / hitsPerPage)}
                onPageChange={handlePageChange}
                totalItems={count}
                itemsPerPage={hitsPerPage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
