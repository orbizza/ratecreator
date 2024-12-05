"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRecoilState, useResetRecoilState } from "recoil";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@ratecreator/ui";
import { rootCategoryFiltersState } from "@ratecreator/store/review";
import { Info, SquareStack } from "lucide-react";
import { Category } from "@ratecreator/types/review";
import { getCategoryData } from "@ratecreator/actions/review";
import { truncateText } from "@ratecreator/db/utils";
import { useSearchParams } from "next/navigation";

export const RootCategorySelect: React.FC = () => {
  const [selectedFilters, setSelectedFilters] = useRecoilState(
    rootCategoryFiltersState
  );
  const resetRootCategory = useResetRecoilState(rootCategoryFiltersState);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const searchParams = useSearchParams();
  const query = searchParams.get("query");
  const prevQueryRef = useRef(query);
  const [rootCategoryLength, setRootCategoryLength] = useState<number>(0);

  // Reset root category only when search query changes
  useEffect(() => {
    if (prevQueryRef.current !== query && query !== null) {
      resetRootCategory();
    }
    prevQueryRef.current = query;
  }, [query, resetRootCategory]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Check for cached data in localStorage
        const cachedCategories = localStorage.getItem(
          "searchPageRootCategories"
        );
        const cacheExpiry = localStorage.getItem(
          "searchPageRootCategoriesExpiry"
        );
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
          setRootCategoryLength(parsedCategories.length);
          return; // Exit early since we used cached data
        }
        const data = await getCategoryData();

        setCategories(data as Category[]);

        // Cache the fetched data in localStorage and set an expiration (e.g., 24 hours)
        localStorage.setItem("searchPageRootCategories", JSON.stringify(data));
        const expiryTime = new Date().getTime() + 24 * 60 * 60 * 1000; // 24 hours
        localStorage.setItem(
          "searchPageRootCategoriesExpiry",
          expiryTime.toString()
        );

        setLoading(false);
        setRootCategoryLength(data.length);
      } catch (err) {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <>
      <div className='flex flex-col mb-2 gap-y-2'>
        <div className='flex flex-row gap-x-2 items-center'>
          <SquareStack size={16} />
          <span className='text-[16px]'>Root Categories</span>
          <Info size={14} className='text-muted-foreground' />
        </div>
        {loading && (
          <Skeleton className='h-8 w-[300px] rounded-sm shadow-md bg-neutral-50  dark:bg-neutral-950' />
        )}
        {!loading && (
          <Select
            value={selectedFilters || "all"}
            onValueChange={(value) =>
              setSelectedFilters(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className='shadow-md bg-neutral-50 dark:bg-neutral-950 text-foreground dark:text-foreground'>
              <SelectValue
                placeholder='All Categories'
                className='text-primary'
              />
            </SelectTrigger>
            <SelectContent className='bg-neutral-50 dark:bg-neutral-950'>
              <SelectGroup>
                <SelectItem value='all'>
                  All Categories ({rootCategoryLength})
                </SelectItem>
                {categories.map((item) => (
                  <SelectItem key={item.id} value={item.slug}>
                    {truncateText(item.name, 35)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
      </div>
    </>
  );
};
