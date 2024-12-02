"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowDownZA,
  ArrowRightLeft,
  ArrowUpZA,
  ChevronRight,
  Info,
  SlidersHorizontal,
  SquareStack,
} from "lucide-react";

import { Category, SearchAccount } from "@ratecreator/types/review";
import {
  Separator,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
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
import { CreatorGrid } from "./category-search-creator-grid";
import { FilterSidebar } from "./category-search-filter-sidebar";
import { RelatedCategories } from "./category-search-related-category";
import { SubCategoriesList } from "./category-search-subcategory";
import { CardForSearchResult } from "../cards/card-search-results";
import { searchCreators } from "@ratecreator/actions/review";

// const creator: SearchAccount = {
//   accountId: "UC-lHJZR3Gqxm24_Vd_AJ5Yw",
//   name: "PewDiePie",
//   handle: "@pewdiepie",
//   imageUrl:
//     "https://yt3.ggpht.com/5oUY3tashyxfqsjO5SGhjT4dus8FkN9CsAHwXWISFrdPYii1FudD4ICtLfuCw6-THJsJbgoY=s88-c-k-c0x00ffffff-no-rj",
//   followerCount: 111000000,
//   rating: 3.9,
//   reviewCount: 10250,
//   videoCount: 4780,
//   categories: [
//     "arts-and-entertainment",
//     "comedy-and-humor",
//     "comedic-vlogs",
//     "gaming-and-esports",
//     "let-s-play-videos",
//     "gaming-news",
//     "lifestyle-and-vlogs",
//   ],
//   platform: "YOUTUBE",
//   createdAt: "2010-04-29T10:54:00Z",
//   bannerImageUrl: "",
// };
//https://yt3.googleusercontent.com/H2UiRucb_N6GUtayijRvKQIINVzMRpftdTqUQLhjxwsnTdx7TXmapV_SK7G5HpBZUgnQbVnHOQ

//https://yt3.googleusercontent.com/82q_54Y1P3uTo9hVWV82rIE_O_j4cZUaB_wFq_4LKcteG72IEaDqBsuoXarUA35osaFX6q-0
export const CategoriesSearchResults: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [creators, setCreators] = useState<SearchAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [creatorLoading, setCreatorLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDescending, setIsDescending] = useState(true);

  // Filters and Sorting
  const [platform, setPlatform] = useState<string[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);
  const [rating, setRating] = useState<string[]>([]);
  const [videoCount, setVideoCount] = useState<string[]>([]);
  const [reviewCount, setReviewCount] = useState<string[]>([]);
  const [country, setCountry] = useState<string[]>([]);
  const [language, setLanguage] = useState<string[]>([]);
  const [claimed, setClaimed] = useState<string | null>(null);
  const [madeForKids, setMadeForKids] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("followed");

  const handleClearFilters = useCallback(() => {
    setPlatform([]);
    setFollowers([]);
    setRating([]);
    setVideoCount([]);
    setReviewCount([]);
    setCountry([]);
    setLanguage([]);
    setClaimed(null);
    setMadeForKids(null);
  }, []);

  const handleToggle = () => {
    setIsDescending((prev) => !prev);
  };

  const fetchCreators = useCallback(async () => {
    try {
      setCreatorLoading(true);
      const results = await searchCreators({
        filters: {
          platform,
          categories: [slug],
        },
        sortBy,
        sortOrder: isDescending ? "desc" : "asc",
      });
      console.log("results: ", results);
      setCreators(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setCreatorLoading(false);
    }
  }, [
    sortBy,
    isDescending,
    platform,
    followers,
    rating,
    videoCount,
    reviewCount,
    country,
    language,
    claimed,
    madeForKids,
  ]);

  useEffect(() => {
    fetchCreators();
  }, [fetchCreators]);

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
        // console.log("Fetched categories:", data);
        if (data) {
          setCategories(data);
          localStorage.setItem(slugDetails, JSON.stringify(data));
          const expiryTime = new Date().getTime() + 24 * 60 * 60 * 1000; // 24 hours
          localStorage.setItem(slugExpiry, expiryTime.toString());
        }
        setLoading(false);
      } catch (err) {
        console.error("Error in fetchCategoryDetails:", err);
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
    <div className='container mx-auto p-4 mt-16'>
      <div className='flex flex-col'>
        {loading && (
          <div className='flex flex-row gap-x-2 items-center'>
            <span className='text-[12px] lg:text-sm text-muted-foreground hover:text-foreground'>
              {" "}
              Category
            </span>
            <ChevronRight
              className='text-sm text-muted-foreground '
              size={14}
            />
            <Skeleton className='h-4 w-[300px]' />
          </div>
        )}
        {!loading && <CategoryBreadcrumb categories={categories} />}
        <div className='flex flex-col justify-center items-center w-full m-8 gap-4'>
          <div className='flex flex-wrap justify-center items-baseline lg:text-5xl font-bold'>
            <span className='mr-2'>Best in</span>
            {loading ? (
              <Skeleton className='h-8 w-[250px] inline-block' /> // Adjust width as needed
            ) : (
              <span>{currentCategory?.name}</span>
            )}
          </div>
          <div className='flex flex-row items-center gap-x-2 text-muted-foreground'>
            {loading ? (
              <Skeleton className='h-4 w-[250px]' />
            ) : (
              <>
                <span className='text-[13px] md:text-sm lg:text-xl'>
                  {currentCategory?.shortDescription}
                </span>
                <Info size={14} />
              </>
            )}
          </div>
        </div>
        <Separator className='my-[2rem] xl:my-[4rem]' />
      </div>
      <div className='flex flex-row'>
        <div className='hidden xl:flex flex-col gap-y-2 xl:w-1/4 gap-x-2 pr-4'>
          <FilterSidebar
            onPlatformChange={setPlatform}
            onFollowersChange={setFollowers}
            onRatingChange={setRating}
            onVideoCountChange={setVideoCount}
            onReviewCountChange={setReviewCount}
            onCountryChange={setCountry}
            onLanguageChange={setLanguage}
            onClaimedChange={setClaimed}
            onMadeForKidsChange={setMadeForKids}
            onClearFilters={handleClearFilters}
          />
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
            <div className='flex flex-col '>
              <CategoryLoadingCard text='Sub Categories' type='sub' />
              <CategoryLoadingCard text='Related Categories' type='related' />
            </div>
          )}
          {error && <div className='text-red-500'>{error}</div>}
          {!loading && !error && !currentCategory && (
            <div>No category found</div>
          )}
        </div>
        <div className='flex flex-col w-full xl:w-3/4 gap-4 mb-4'>
          <div className='flex xl:hidden flex-col-reverse gap-y-2 md:flex-row md:items-center justify-between'>
            <div className='flex flex-row w-2/5 items-center text-primary justify-between '>
              {!loading && (
                <FilterSidebar
                  onPlatformChange={setPlatform}
                  onFollowersChange={setFollowers}
                  onRatingChange={setRating}
                  onVideoCountChange={setVideoCount}
                  onReviewCountChange={setReviewCount}
                  onCountryChange={setCountry}
                  onLanguageChange={setLanguage}
                  onClaimedChange={setClaimed}
                  onMadeForKidsChange={setMadeForKids}
                  onClearFilters={handleClearFilters}
                />
              )}
              {loading && (
                <Button
                  variant='default'
                  size='sm'
                  disabled
                  className='flex items-center gap-2'
                >
                  <SlidersHorizontal size={16} />
                  Filters
                </Button>
              )}
              {/* ToDo: Add a reset function and display the button as enabled
              once a filter is selected
                */}
            </div>

            <div className='flex flex-row md:w-3/5 items-center justify-between '>
              <div className='flex flex-row items-center'>
                {!loading && (
                  <SubCategoriesList
                    categories={currentCategory?.subcategories || []}
                  />
                )}
                {loading && (
                  <Button
                    variant='default'
                    size='sm'
                    disabled
                    className='flex items-center gap-2'
                  >
                    <SquareStack size={16} />
                    Sub Categories
                  </Button>
                )}
              </div>
              <div className='flex flex-row justify-between items-center '>
                {!loading && (
                  <RelatedCategories
                    categories={parentCategory?.subcategories || []}
                  />
                )}
                {loading && (
                  <Button
                    variant='default'
                    size='sm'
                    disabled
                    className='flex items-center gap-2'
                  >
                    <ArrowRightLeft size={16} />
                    Related Categories
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className='flex flex-row items-center justify-between'>
            <div>Count</div>
            <div className='flex justify-end items-center gap-x-2'>
              <Toggle
                aria-label='Toggle Sort Order'
                pressed={!isDescending}
                onPressedChange={handleToggle}
              >
                <span className='hidden lg:inline-block text-[12px] mr-1'>
                  {isDescending ? "Most" : "Least"}
                </span>
                {isDescending ? (
                  <ArrowDownZA size={16} />
                ) : (
                  <ArrowUpZA size={16} />
                )}
              </Toggle>
              <Select defaultValue='followed'>
                <SelectTrigger className='w-[118px] items-center'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup className='justify-start'>
                    <SelectItem value='followed'>Followed</SelectItem>
                    <SelectItem value='new'>New Account</SelectItem>
                    <SelectItem value='rated'>Rated</SelectItem>
                    <SelectItem value='reviewed'>Reviewed</SelectItem>
                    <SelectItem value='views'>Views</SelectItem>
                    <SelectItem value='videos'>Videos</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Info size={14} />
            </div>
          </div>
          {/* <div className='w-full items-center justify-center md:justify-between grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4'>
            <CardForSearchResult creator={creator} />
            <CardForSearchResult creator={creator} />
            <CardForSearchResult creator={creator} />
            <CardForSearchResult creator={creator} />
            <CardForSearchResult creator={creator} />
            <CardForSearchResult creator={creator} />
          </div> */}
          {creatorLoading && <CreatorLoadingCard />}
          {!creatorLoading && <CreatorGrid creators={creators} />}
        </div>
      </div>
    </div>
  );
};

interface CategoryLoadingCardProps {
  text: string;
  type: "sub" | "related";
}

const CategoryLoadingCard: React.FC<CategoryLoadingCardProps> = ({
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

const CreatorLoadingCard: React.FC = () => {
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
