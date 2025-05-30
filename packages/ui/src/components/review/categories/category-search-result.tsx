"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowDownZA,
  ArrowRightLeft,
  ArrowUpZA,
  ChevronRight,
  Info,
  SlidersHorizontal,
  SquareStack,
} from "lucide-react";

import {
  Category,
  SearchAccount,
  SearchAccountsParams,
} from "@ratecreator/types/review";
import {
  Separator,
  Skeleton,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Toggle,
  Button,
} from "@ratecreator/ui";
import { getCategoryDetails } from "@ratecreator/actions/review";

import { CategoryBreadcrumb } from "./category-search-breadcrumb";
import { CreatorGrid } from "../cards/category-search-creator-grid";
import { FilterSidebar } from "./category-search-filter-sidebar";
import { RelatedCategories } from "./category-search-related-category";
import { SubCategoriesList } from "./category-search-subcategory";
import { searchCreators } from "@ratecreator/actions/review";
import { PaginationBar } from "../cards/pagination-bar";
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
import { useDebounce } from "@ratecreator/hooks";
import { useRecoilValue, useRecoilState, useResetRecoilState } from "recoil";
import {
  CategoryLoadingCard,
  CreatorLoadingCard,
  FilterSkeleton,
} from "../skeletons/skeleton-category-search-results";
import { truncateText } from "@ratecreator/db/utils";

/**
 * CategoriesSearchResults Component
 *
 * A comprehensive search results page for categories that displays:
 * - Category details and breadcrumb navigation
 * - Filter sidebar for refining search results
 * - Grid of creator cards matching the category
 * - Related categories and subcategories
 * - Pagination controls
 *
 * The component manages multiple states for filters, sorting, and pagination,
 * and implements caching for category details to improve performance.
 *
 * @component
 * @returns {JSX.Element} A category search results page
 */
export const CategoriesSearchResults: React.FC = () => {
  const params = useParams();
  const slug = params?.slug as string;

  // State management for categories and creators
  const [categories, setCategories] = useState<Category[]>([]);
  const [creators, setCreators] = useState<SearchAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [creatorLoading, setCreatorLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<number>(0);
  const [viewCount, setViewCount] = useState<string>("");
  const [hitsPerPage, setHitsPerPage] = useState<number>(0);
  const [currentPage, setCurrentPage] = useRecoilState(pageNumberState);

  // Recoil state for filters and sorting
  const platform = useRecoilValue(platformFiltersState);
  const followers = useRecoilValue(followersFiltersState);
  const rating = useRecoilValue(ratingFiltersState);
  const videoCount = useRecoilValue(videoCountFiltersState);
  const reviewCount = useRecoilValue(reviewCountFiltersState);
  const country = useRecoilValue(countryFiltersState);
  const language = useRecoilValue(languageFiltersState);
  const claimed = useRecoilValue(claimedFilterState);
  const madeForKids = useRecoilValue(madeForKidsFilterState);

  // Debounced platform filter to prevent excessive API calls
  const debouncedPlatform = useDebounce(platform, 1000);
  const [sortBy, setSortBy] = useRecoilState(sortByFilterState);
  const [isDescending, setIsDescending] = useRecoilState(
    isDescendingFilterState,
  );

  // Reset functions for all filter states
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

  /**
   * Reset all filter states when the component mounts
   */
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
  ]);

  /**
   * Toggle sort order between ascending and descending
   */
  const handleToggle = () => {
    setIsDescending((prev) => !prev);
    setCurrentPage(0);
  };

  /**
   * Fetch creators based on current filters and pagination
   * Implements caching and error handling
   */
  const fetchCreators = useCallback(async () => {
    try {
      setCreatorLoading(true);
      const searchParams: SearchAccountsParams = {
        query: "",
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
          categories: [slug],
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
    slug,
  ]);

  // Fetch creators when filters or pagination changes
  useEffect(() => {
    fetchCreators();
  }, [fetchCreators]);

  /**
   * Handle page change in pagination
   * @param {number} page - The new page number
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  /**
   * Fetch category details with caching
   * Implements a 24-hour cache for category details
   */
  useEffect(() => {
    const fetchCategoryDetails = async () => {
      try {
        // Check cached slug data in localStorage
        const slugDetails = slug + "-categoryDetails";
        const cachedSlugData = localStorage.getItem(slugDetails);
        const slugExpiry = slug + "-detailsExpiry";
        const cacheExpiry = localStorage.getItem(slugExpiry);
        const currentTime = new Date().getTime();

        if (
          cachedSlugData &&
          cacheExpiry &&
          currentTime < Number(cacheExpiry)
        ) {
          // Use cached data if available and not expired
          const parsedCategories = JSON.parse(cachedSlugData);
          console.log("Using local cached details for slug: ", slug);
          setCategories(parsedCategories);
          setLoading(false);
          return; // Exit early since we used cached data
        }

        const data = await getCategoryDetails(slug);
        if (data) {
          setCategories(data);
          localStorage.setItem(slugDetails, JSON.stringify(data));
          const expiryTime = new Date().getTime() + 24 * 60 * 60 * 1000; // 24 hours
          localStorage.setItem(slugExpiry, expiryTime.toString());
        }
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    };

    fetchCategoryDetails();
  }, [slug]);

  const currentCategory = categories[categories.length - 1];
  const parentCategory =
    categories.length > 1 ? categories[categories.length - 2] : null;

  return (
    <div className="container mx-auto p-4 mt-16">
      <div className="flex flex-col">
        {loading && (
          <div className="flex flex-row gap-x-2 items-center">
            <span className="text-[12px] lg:text-sm text-muted-foreground hover:text-foreground">
              {" "}
              Category
            </span>
            <ChevronRight
              className="text-sm text-muted-foreground "
              size={14}
            />
            <Skeleton className="h-4 w-[300px]" />
          </div>
        )}
        {!loading && <CategoryBreadcrumb categories={categories} />}
        <div className="flex flex-col justify-center items-center w-full m-4 md:m-8 gap-2 md:gap-4">
          <div className="flex flex-wrap mx-auto justify-center items-baseline lg:text-5xl font-bold">
            <span className="sm:mr-2">Best in</span>
            {loading ? (
              <Skeleton className="h-8 w-[250px] inline-block" /> // Adjust width as needed
            ) : (
              <span>{truncateText(currentCategory?.name, 30)}</span>
            )}
          </div>
          <div className="flex flex-row items-center justify-center md:gap-x-2 text-muted-foreground">
            {loading ? (
              <Skeleton className="h-4 w-[250px]" />
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-x-2 gap-y-2">
                <span className="text-[13px] md:text-sm lg:text-xl">
                  {truncateText(currentCategory?.shortDescription || "", 100)}
                </span>
                <Info size={14} />
              </div>
            )}
          </div>
        </div>
        <Separator className="my-[2rem] xl:my-[4rem]" />
      </div>
      <div className="flex flex-row">
        <div className="hidden xl:flex flex-col gap-y-2 xl:w-1/4 gap-x-2 pr-4">
          {!loading && <FilterSidebar />}
          {!loading && (
            <>
              <SubCategoriesList
                categories={currentCategory?.subcategories || []}
              />
              <RelatedCategories
                categories={parentCategory?.subcategories || []}
              />
            </>
          )}
          {loading && (
            <div className="flex flex-col ">
              <FilterSkeleton />
              <CategoryLoadingCard text="Sub Categories" type="sub" />
              <CategoryLoadingCard text="Related Categories" type="related" />
            </div>
          )}
          {error && <div className="text-red-500">{error}</div>}
          {!loading && !error && !currentCategory && (
            <div>No category found</div>
          )}
        </div>
        <div className="flex flex-col w-full xl:w-3/4 gap-4 mb-4">
          <div className="flex xl:hidden gap-y-2 flex-row items-center justify-between">
            {loading && (
              <Button
                variant="default"
                size="sm"
                disabled
                className="flex items-center gap-2"
              >
                <SlidersHorizontal size={16} />
                <span className="hidden md:inline-block">Filters</span>
              </Button>
            )}
            {!loading && <FilterSidebar />}
            <div className="flex flex-row items-center">
              {!loading && (
                <SubCategoriesList
                  categories={currentCategory?.subcategories || []}
                />
              )}
              {loading && (
                <Button
                  variant="default"
                  size="sm"
                  disabled
                  className="flex items-center gap-2"
                >
                  <SquareStack size={16} />
                  <span className="hidden md:inline-block">Sub Categories</span>
                </Button>
              )}
            </div>
            <div className="flex flex-row justify-between items-center ">
              {!loading && (
                <RelatedCategories
                  categories={parentCategory?.subcategories || []}
                />
              )}
              {loading && (
                <Button
                  variant="default"
                  size="sm"
                  disabled
                  className="flex items-center gap-2"
                >
                  <ArrowRightLeft size={16} />
                  <span className="hidden md:inline-block">
                    Related Categories
                  </span>
                </Button>
              )}
            </div>
          </div>
          <div className="flex flex-row items-center justify-between">
            <div>
              {creatorLoading && (
                <span className="text-muted-foreground text-sm"># of ###</span>
              )}
              {!creatorLoading && (
                <div className="flex flex-row items-center gap-x-2 text-muted-foreground text-sm">
                  {" "}
                  {viewCount} of {count} <Info size={14} />
                </div>
              )}
            </div>
            {/* <div className="flex justify-end items-center gap-x-2">
              <Toggle
                aria-label="Toggle Sort Order"
                pressed={!isDescending}
                onPressedChange={handleToggle}
              >
                <span className="hidden sm:inline-block text-[12px] mr-1">
                  {isDescending ? "Most" : "Least"}
                </span>
                {isDescending ? (
                  <ArrowDownZA size={16} />
                ) : (
                  <ArrowUpZA size={16} />
                )}
              </Toggle>
              <Select
                defaultValue="followed"
                onValueChange={(value) => {
                  setSortBy(value);
                  setCurrentPage(0);
                }}
                value={sortBy}
              >
                <SelectTrigger className="w-[118px] items-center">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup className="justify-start">
                    <SelectItem value="followed">Followed</SelectItem>
                    <SelectItem value="new-account">New Account</SelectItem>
                    <SelectItem value="rated">Rated</SelectItem>
                    <SelectItem value="review-count">Review Count</SelectItem>
                    <SelectItem value="videos">Videos/Posts</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Info size={14} />
            </div> */}
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
