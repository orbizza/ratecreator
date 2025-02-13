"use client";

import React, { useEffect, useState } from "react";

import { getCategoryData } from "@ratecreator/actions/review";

import { CategoryWithColor } from "@ratecreator/types/review";
import { Separator, Skeleton } from "@ratecreator/ui";

import SearchBar from "./search-bar";
import { CategoryCardListPage } from "./category-card-list-page";

const lightBgColors = [
  "bg-green-200",
  "bg-blue-200",
  "bg-yellow-200",
  "bg-red-200",
  "bg-pink-200",
  "bg-indigo-200",
  "bg-teal-200",
  "bg-orange-200",
  "bg-cyan-200",
  "bg-lime-200",
  "bg-emerald-200",
  "bg-sky-200",
  "bg-violet-200",
  "bg-fuchsia-200",
  "bg-rose-200",
];

const darkBgColors = [
  "dark:bg-green-800",
  "dark:bg-blue-800",
  "dark:bg-yellow-800",
  "dark:bg-red-800",
  "dark:bg-pink-800",
  "dark:bg-indigo-800",
  "dark:bg-teal-800",
  "dark:bg-orange-800",
  "dark:bg-cyan-800",
  "dark:bg-lime-800",
  "dark:bg-emerald-800",
  "dark:bg-sky-800",
  "dark:bg-violet-800",
  "dark:bg-fuchsia-800",
  "dark:bg-rose-800",
];

const lightHoverColors = [
  "hover:bg-green-300",
  "hover:bg-blue-300",
  "hover:bg-yellow-300",
  "hover:bg-red-300",
  "hover:bg-pink-300",
  "hover:bg-indigo-300",
  "hover:bg-teal-300",
  "hover:bg-orange-300",
  "hover:bg-cyan-300",
  "hover:bg-lime-300",
  "hover:bg-emerald-300",
  "hover:bg-sky-300",
  "hover:bg-violet-300",
  "hover:bg-fuchsia-300",
  "hover:bg-rose-300",
];

const darkHoverColors = [
  "dark:hover:bg-green-900",
  "dark:hover:bg-blue-900",
  "dark:hover:bg-yellow-900",
  "dark:hover:bg-red-900",
  "dark:hover:bg-pink-900",
  "dark:hover:bg-indigo-900",
  "dark:hover:bg-teal-900",
  "dark:hover:bg-orange-900",
  "dark:hover:bg-cyan-900",
  "dark:hover:bg-lime-900",
  "dark:hover:bg-emerald-900",
  "dark:hover:bg-sky-900",
  "dark:hover:bg-violet-900",
  "dark:hover:bg-fuchsia-900",
  "dark:hover:bg-rose-900",
];

export const CategoryListPage: React.FC = () => {
  const [categories, setCategories] = useState<CategoryWithColor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Check for cached data in localStorage
        const cachedCategories = localStorage.getItem("categoriesWithColors");
        const cacheExpiry = localStorage.getItem("categoriesWithColorsExpiry");
        const currentTime = new Date().getTime();

        if (
          cachedCategories &&
          cacheExpiry &&
          currentTime < Number(cacheExpiry)
        ) {
          // Use cached data if available and not expired
          const parsedCategories = JSON.parse(cachedCategories);
          setCategories(parsedCategories);
          setLoading(false);
          return; // Exit early since we used cached data
        }
        const data = await getCategoryData();
        const categoriesWithColors = addColorsToCategories(
          data as CategoryWithColor[],
        );
        setCategories(categoriesWithColors);

        // Cache the fetched data in localStorage and set an expiration (e.g., 24 hours)
        localStorage.setItem(
          "categoriesWithColors",
          JSON.stringify(categoriesWithColors),
        );
        const expiryTime = new Date().getTime() + 24 * 60 * 60 * 1000; // 24 hours
        localStorage.setItem(
          "categoriesWithColorsExpiry",
          expiryTime.toString(),
        );

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const addColorsToCategories = (
    categories: CategoryWithColor[],
  ): CategoryWithColor[] => {
    return categories.map((category, index) => ({
      ...category,
      bgColor: `${lightBgColors[index % lightBgColors.length]} ${darkBgColors[index % darkBgColors.length]}`,
      hoverColor: `${lightHoverColors[index % lightHoverColors.length]} ${darkHoverColors[index % darkHoverColors.length]}`,
    }));
  };

  return (
    <div className="container mx-auto p-4 mt-10">
      <div className="flex flex-col items-start md:items-center w-full gap-y-4 pt-10 pb-14">
        <div className="text-2xl md:text-3xl font-bold mb-4 mx-0 sm:mx-6 md:mx-auto">
          What are you looking for?
        </div>
        <div className="w-full">
          <SearchBar />
        </div>
      </div>
      <Separator className="my-0 md:my-4" />
      <div className="mt-10 lg:mt-20 my-[4rem]">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold my-4 mb-10">
          Explore{" "}
          <span className="text-primary">Creators &amp; Communities</span> by
          category
        </h2>
        {!loading && (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4">
            {categories.map((category) => (
              <div key={category.id} className="break-inside-avoid mb-4">
                <CategoryCardListPage category={category} />
              </div>
            ))}
          </div>
        )}
        {loading && <CategoryListLoadingCard />}
        {error && <p>Error: {error}</p>}
      </div>
    </div>
  );
};

const CategoryListLoadingCard: React.FC = () => {
  const skeletonCount = 7;

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4  gap-8">
      {[...Array(skeletonCount)].map((_, index) => (
        <>
          <div key={index} className="flex flex-col space-y-3">
            <Skeleton className="h-[125px] w-full rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
          <div key={index} className="flex flex-col space-y-3">
            <Skeleton className="h-[125px] w-full rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </>
      ))}
    </div>
  );
};
