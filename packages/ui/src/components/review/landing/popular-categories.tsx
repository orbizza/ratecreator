"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { cn } from "@ratecreator/ui/utils";

import { Button, Skeleton } from "@ratecreator/ui";
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

// CategoryList component
type CategoryListProps = {
  categories: PopularCategory[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
};

const CategoryList = ({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryListProps) => (
  <div className="space-y-2 my-[1rem]">
    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
      Most Popular Categories
    </h1>
    {categories.map((category) => (
      <CategoryItem
        key={category.slug}
        category={category.name}
        isSelected={category.name === selectedCategory}
        onSelect={() => onSelectCategory(category.name)}
      />
    ))}
  </div>
);

// CategoryItem component
type CategoryItemProps = {
  category: string;
  isSelected: boolean;
  onSelect: () => void;
};

const CategoryItem = ({
  category,
  isSelected,
  onSelect,
}: CategoryItemProps) => (
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
          href={`/review/${item?.platform.toLowerCase()}/${item?.accountId}`}
          key={item?.handle}
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
        // Check for cached data in localStorage
        const cachedCategories = localStorage.getItem("mostPopularCategories");
        const cacheExpiry = localStorage.getItem("mostPopularCategoriesExpiry");
        const currentTime = new Date().getTime();
        if (
          cachedCategories &&
          cacheExpiry &&
          currentTime < Number(cacheExpiry)
        ) {
          // Use cached data if available and not expired
          const parsedCategories = JSON.parse(cachedCategories);

          setPopularCategories(parsedCategories);
          setLoadingCategories(false);
          if (parsedCategories.length > 0) {
            setSelectedCategory(parsedCategories[0].name);
          }

          return; // Exit early since we used cached data
        }

        const category_data = await getMostPopularCategories();
        setPopularCategories(category_data);
        setLoadingCategories(false);
        if (category_data.length > 0) {
          setSelectedCategory(category_data[0].name);
        }

        localStorage.setItem(
          "mostPopularCategories",
          JSON.stringify(category_data),
        );
        const expiryTime = new Date().getTime() + 24 * 60 * 60 * 1000; // 24 hours
        localStorage.setItem(
          "mostPopularCategoriesExpiry",
          expiryTime.toString(),
        );
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    const fetchCategoriesWithData = async () => {
      try {
        const cachedCategoryAccount = localStorage.getItem(
          "mostPopularCategoryAccount",
        );
        const cacheAccountExpiry = localStorage.getItem(
          "mostPopularCategoryAccountExpiry",
        );
        const currentTimeAccount = new Date().getTime();
        if (
          cachedCategoryAccount &&
          cacheAccountExpiry &&
          currentTimeAccount < Number(cacheAccountExpiry)
        ) {
          // Use cached data if available and not expired
          const parsedCategories = JSON.parse(cachedCategoryAccount);

          setCategories(parsedCategories);
          setLoadingAccounts(false);
          if (parsedCategories.length > 0) {
            setSelectedCategory(parsedCategories[0].category.name);
          }
          return; // Exit early since we used cached data
        }
        const data = await getMostPopularCategoryWithData();
        setCategories(data);
        setLoadingAccounts(false);

        localStorage.setItem(
          "mostPopularCategoryAccount",
          JSON.stringify(data),
        );
        const expiryTime = new Date().getTime() + 24 * 60 * 60 * 1000; // 24 hours
        localStorage.setItem(
          "mostPopularCategoryAccountExpiry",
          expiryTime.toString(),
        );
        if (data.length > 0) {
          setSelectedCategory(data[0].category.name);
        }
      } catch (error) {
        console.error("Failed to fetch categories with accounts:", error);
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
    <div className="flex flex-col ml-5 my-[5rem]">
      <div className="flex">
        <div className="w-2/5 md:w-1/4 pr-4">
          {loadingCategories ? (
            <CategoryLoadingCard />
          ) : (
            <CategoryList
              // categories={categories.map((cat) => cat.category)}
              categories={popularCategories}
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
            />
          )}
          <Button
            className="w-full mt-4 justify-start"
            onClick={() => router.push("/categories")}
          >
            View All Categories
          </Button>
        </div>

        <div className="mr-5 w-3/5 md:w-3/4">
          {loadingAccounts ? (
            <CreatorLoadingCard />
          ) : selectedCategoryData ? (
            <>
              <div className="flex justify-end items-center mb-4">
                <Button
                  variant={"link"}
                  onClick={() =>
                    router.push(
                      `/categories/${selectedCategoryData.category.slug}`,
                    )
                  }
                >
                  See all {selectedCategoryData.category.name}{" "}
                  <ChevronRight className="ml-1" size={16} />
                </Button>
              </div>
              <CategoryGrid accounts={selectedCategoryData.accounts} />
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

const CategoryLoadingCard: React.FC = () => {
  const skeletonCount = 6;

  return (
    <div className="space-y-5 my-[1rem]">
      <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
        Most Popular Categories
      </h1>
      {[...Array(skeletonCount)].map((_, index) => (
        <div key={index} className="flex flex-col space-y-3">
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
};

const CreatorLoadingCard: React.FC = () => {
  const skeletonCount = 12;

  return (
    <>
      <div className="flex justify-end items-center mb-4">
        <Button variant={"link"}>
          See all <Skeleton className="h-4 w-[150px] ml-2" />
          <ChevronRight className="ml-1" size={16} />
        </Button>
      </div>
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4  gap-4">
        {[...Array(skeletonCount)].map((_, index) => (
          <div key={index} className="flex flex-col space-y-3">
            <Skeleton className="h-[125px] w-full rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export { PopularCategories };
