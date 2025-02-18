"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronRight, List } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { cn } from "@ratecreator/ui/utils";

import {
  Button,
  Skeleton,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@ratecreator/ui";
import {
  PopularCategory,
  PopularAccount,
  PopularCategoryWithAccounts,
} from "@ratecreator/types/review";
import {
  getMostPopularCategories,
  getMostPopularCategoryWithData,
} from "@ratecreator/actions/review";

import { CardLandingVertical } from "../cards/card-landing-vertical";
import { WriteReviewCTA } from "./write-review-cta";
import {
  MostPopularCategoryLoadingCard,
  MostPopularCreatorLoadingCard,
} from "../skeletons/skeleton-category-search-results";

// CategoryList component
type CategoryListProps = {
  categories: PopularCategory[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  isMobileSheet?: boolean;
};

const CategoryList = ({
  categories,
  selectedCategory,
  onSelectCategory,
  isMobileSheet,
}: CategoryListProps) => (
  <div className="space-y-2 my-[1rem]">
    <h1 className="hidden sm:block text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
      Most Popular Categories
    </h1>
    {categories.map((category) => (
      <CategoryItem
        key={category.slug}
        category={category.name}
        isSelected={category.name === selectedCategory}
        onSelect={() => onSelectCategory(category.name)}
        isMobileSheet={isMobileSheet}
      />
    ))}
  </div>
);

// CategoryItem component
type CategoryItemProps = {
  category: string;
  isSelected: boolean;
  onSelect: () => void;
  isMobileSheet?: boolean;
};

const CategoryItem: React.FC<CategoryItemProps> = ({
  category,
  isSelected,
  onSelect,
  isMobileSheet,
}) => {
  const buttonContent = (
    <button
      className={`block w-full text-left py-2 px-4 rounded ${
        isSelected
          ? "border border-primary bg-background text-primary"
          : "bg-background text-secondary-foreground hover:bg-primary/90"
      }`}
      onClick={onSelect}
    >
      {category}
    </button>
  );

  return isMobileSheet ? (
    <SheetClose asChild>{buttonContent}</SheetClose>
  ) : (
    buttonContent
  );
};

// CategoryGrid component
const CategoryGrid = ({ accounts }: { accounts: PopularAccount[] }) => {
  const [screenSize, setScreenSize] = useState("");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const checkScreenSize = () => {
      //ToDo: change this to 640
      if (window.innerWidth < 720) {
        setScreenSize("small");
      } else if (window.innerWidth < 1024) {
        setScreenSize("medium");
      } else {
        setScreenSize("large");
      }
    };

    // Check on mount
    checkScreenSize();

    // Add event listener
    window.addEventListener("resize", checkScreenSize);

    // Clean up
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const displayedAccounts = useMemo(() => {
    switch (screenSize) {
      case "small":
        return accounts.slice(0, 5);
      case "medium":
        return accounts.slice(0, 8);
      default:
        return accounts.slice(0, 12);
    }
  }, [accounts, screenSize]);

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2  lg:grid-cols-3 ")}>
      {displayedAccounts.map((item, idx) => (
        <Link
          href={`/profile/${item?.platform.toLowerCase()}/${item?.accountId}`}
          key={item?.platform + item?.handle}
          className="relative group  block p-2 h-full w-full"
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence>
            {hoveredIndex === idx && (
              <motion.span
                className="absolute inset-0 h-full w-full bg-secondary-foreground/[0.5] dark:bg-secondary/[0.8] block  rounded-2xl"
                layoutId="hoverBackground"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { duration: 0.15 },
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.15, delay: 0.2 },
                }}
              />
            )}
          </AnimatePresence>
          <CardLandingVertical {...item} />
        </Link>
      ))}
    </div>
  );
};

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const CACHE_KEYS = {
  popularCategories: "mostPopularCategories",
  popularCategoriesExpiry: "mostPopularCategoriesExpiry",
  categoryAccounts: "mostPopularCategoryAccount",
  categoryAccountsExpiry: "mostPopularCategoryAccountExpiry",
};

const isValidCache = (expiryKey: string) => {
  const cacheExpiry = localStorage.getItem(expiryKey);
  return cacheExpiry && new Date().getTime() < Number(cacheExpiry);
};

const setCacheWithExpiry = (key: string, expiryKey: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(
      expiryKey,
      (new Date().getTime() + CACHE_TTL).toString(),
    );
  } catch (error) {
    console.error("Error setting cache:", error);
    // If localStorage is full, clear it and try again
    if (error instanceof Error && error.name === "QuotaExceededError") {
      localStorage.clear();
      try {
        localStorage.setItem(key, JSON.stringify(data));
        localStorage.setItem(
          expiryKey,
          (new Date().getTime() + CACHE_TTL).toString(),
        );
      } catch (retryError) {
        console.error("Failed to set cache after clearing:", retryError);
      }
    }
  }
};

const getCachedData = (key: string, expiryKey: string) => {
  try {
    const cachedData = localStorage.getItem(key);
    if (cachedData && isValidCache(expiryKey)) {
      return JSON.parse(cachedData);
    }
  } catch (error) {
    console.error("Error getting cached data:", error);
  }
  return null;
};

// Main component
const PopularCategories = () => {
  const [categories, setCategories] = useState<PopularCategoryWithAccounts[]>(
    [],
  );
  const [popularCategories, setPopularCategories] = useState<PopularCategory[]>(
    [],
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  const [loadingAccounts, setLoadingAccounts] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Check for cached categories
        const cachedCategories = getCachedData(
          CACHE_KEYS.popularCategories,
          CACHE_KEYS.popularCategoriesExpiry,
        );

        if (cachedCategories) {
          setPopularCategories(cachedCategories);
          setLoadingCategories(false);
          if (cachedCategories.length > 0) {
            setSelectedCategory(cachedCategories[0].name);
          }
          return;
        }

        const category_data = await getMostPopularCategories();
        setPopularCategories(category_data);
        setLoadingCategories(false);
        if (category_data.length > 0) {
          setSelectedCategory(category_data[0].name);
        }

        setCacheWithExpiry(
          CACHE_KEYS.popularCategories,
          CACHE_KEYS.popularCategoriesExpiry,
          category_data,
        );
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setLoadingCategories(false);
      }
    };

    const fetchCategoriesWithData = async () => {
      try {
        // Check for cached category accounts
        const cachedCategoryAccount = getCachedData(
          CACHE_KEYS.categoryAccounts,
          CACHE_KEYS.categoryAccountsExpiry,
        );

        if (cachedCategoryAccount) {
          setCategories(cachedCategoryAccount);
          setLoadingAccounts(false);
          if (cachedCategoryAccount.length > 0) {
            setSelectedCategory(cachedCategoryAccount[0].category.name);
          }
          return;
        }

        const data = await getMostPopularCategoryWithData();
        setCategories(data);
        setLoadingAccounts(false);

        setCacheWithExpiry(
          CACHE_KEYS.categoryAccounts,
          CACHE_KEYS.categoryAccountsExpiry,
          data,
        );

        if (data.length > 0) {
          setSelectedCategory(data[0].category.name);
        }
      } catch (error) {
        console.error("Failed to fetch categories with accounts:", error);
        setLoadingAccounts(false);
      }
    };

    fetchCategories();
    fetchCategoriesWithData();
  }, []);

  const selectedCategoryData = categories.find(
    (cat) => cat.category.name === selectedCategory,
  );

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
  };

  return (
    <div className="flex flex-col ml-0 sm:ml-5 my-0 sm:my-[5rem]">
      {/* Mobile Sheet Categories */}
      <div className="sm:hidden ml-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="default"
              size="sm"
              className="flex items-center gap-2"
            >
              <List size={20} />
              <span>Most Popular Categories</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[300px] overflow-y-auto max-h-screen pt-10"
          >
            <SheetTitle className="flex text-primary items-center gap-2 mt-4">
              <List size={20} />
              Most Popular Categories
            </SheetTitle>

            <div className="mt-6">
              {loadingCategories ? (
                <MostPopularCategoryLoadingCard />
              ) : (
                <CategoryList
                  categories={popularCategories}
                  selectedCategory={selectedCategory}
                  onSelectCategory={handleSelectCategory}
                  isMobileSheet={true}
                />
              )}
            </div>
            <Button
              className="w-full mt-4 justify-start"
              onClick={() => router.push("/categories")}
            >
              View All Categories
            </Button>
          </SheetContent>
        </Sheet>
      </div>
      <div className="flex ">
        <div className="hidden sm:block w-2/5 md:w-1/4 pr-4">
          {/* Desktop Categories */}
          <div className="hidden sm:block">
            {loadingCategories ? (
              <MostPopularCategoryLoadingCard />
            ) : (
              <CategoryList
                categories={popularCategories}
                selectedCategory={selectedCategory}
                onSelectCategory={handleSelectCategory}
                isMobileSheet={false}
              />
            )}
            <Button
              className="w-full mt-4 justify-start"
              onClick={() => router.push("/categories")}
            >
              View All Categories
            </Button>
          </div>
        </div>

        <div className="mr-0 sm:mr-5 w-full sm:w-3/5 md:w-3/4 ">
          {loadingAccounts ? (
            <MostPopularCreatorLoadingCard />
          ) : selectedCategoryData ? (
            <>
              <div className="flex justify-start sm:justify-end items-center mt-4 sm:mt-0 mb-2 sm:mb-4 ">
                <Button
                  variant={"link"}
                  onClick={() =>
                    router.push(
                      `/categories/${selectedCategoryData.category.slug}`,
                    )
                  }
                >
                  See all {selectedCategoryData.category.name}{" "}
                  <ChevronRight className="ml-0 sm:ml-1" size={16} />
                </Button>
              </div>
              <CategoryGrid accounts={selectedCategoryData.accounts} />
              <Button
                className="block sm:hidden w-auto mt-4 ml-3 justify-start"
                onClick={() => router.push("/categories")}
              >
                View All Categories
              </Button>
            </>
          ) : null}
        </div>
      </div>
      <div className="my-[5rem]">
        <WriteReviewCTA />
      </div>
    </div>
  );
};

export { PopularCategories };
