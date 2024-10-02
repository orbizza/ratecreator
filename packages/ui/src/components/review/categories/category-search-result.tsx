"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Account, Category } from "@ratecreator/types/review";
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
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@ratecreator/ui";
import { getCategoryDetails } from "@ratecreator/actions/review";

import { CategoryBreadcrumb } from "./category-search-breadcrumb";
import { CreatorGrid } from "./category-search-creator-grid";
import { FilterSidebar } from "./category-search-filter-sidebar";
import { RelatedCategories } from "./category-search-related-category";
import { ArrowRightLeft, Info } from "lucide-react";
import { SubCategoriesList } from "./category-search-subcategory";

export const CategoriesSearchResults: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [creators, setCreators] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [creatorLoading, setCreatorLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
        console.log("Fetched categories:", data);
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
    <div className="container mx-auto p-4 mt-16">
      <div className="flex flex-col">
        <CategoryBreadcrumb categories={categories} />
        <div className="flex flex-col justify-center items-center w-full m-8 gap-4">
          <div className=" lg:text-5xl font-bold">
            Best in {currentCategory?.name}
          </div>
          <div className="flex flex-row items-center gap-x-2 text-muted-foreground">
            {currentCategory?.shortDescription} <Info size={18} />
          </div>
        </div>
        <Separator className="my-[4rem]" />
      </div>
      <div className="flex flex-row">
        <div className="flex flex-col gap-y-2 w-1/4 gap-x-2 pr-4">
          <FilterSidebar />
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
              <CategoryLoadingCard text="Sub Categories" />
              <CategoryLoadingCard text="Related Categories" />
            </div>
          )}
          {error && <div className="text-red-500">{error}</div>}
          {!loading && !error && !currentCategory && (
            <div>No category found</div>
          )}
        </div>
        <div className="flex flex-col w-3/4 gap-4 mb-4">
          <div className="flex flex-row justify-between">
            <div>Count</div>
            <div className="flex justify-end items-center gap-x-4">
              <span>Sort By</span>
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue
                    placeholder="Most Followers"
                    defaultValue={"most-followers"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel
                      defaultValue={"most-followers"}
                      className="text-primary"
                    >
                      Descending
                    </SelectLabel>
                    <SelectItem value="most-reviewed">Most Reviewed</SelectItem>
                    <SelectItem value="most-videos">Most Videos</SelectItem>
                    <SelectItem value="most-comments">Most Comments</SelectItem>
                    <SelectItem value="most-followers">
                      Most Followers
                    </SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel
                      defaultValue={"least-followers"}
                      className="text-primary"
                    >
                      Ascending
                    </SelectLabel>
                    <SelectItem value="least-reviewed">
                      Least Reviewed
                    </SelectItem>
                    <SelectItem value="least-videos">Least Videos</SelectItem>
                    <SelectItem value="least-comments">
                      Least Comments
                    </SelectItem>
                    <SelectItem value="least-followers">
                      Least Followers
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          {creatorLoading && <CreatorLoadingCard />}
          {!creatorLoading && <CreatorGrid creators={creators} />}
        </div>
      </div>
    </div>
  );
};

interface CategoryLoadingCardProps {
  text: string;
}

const CategoryLoadingCard: React.FC<CategoryLoadingCardProps> = ({ text }) => {
  return (
    <Accordion
      type="single"
      collapsible
      className="w-full"
      defaultValue="item-1"
    >
      <AccordionItem value="item-1">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex flex-row items-center mb-2 text-primary text-lg gap-x-2">
            <ArrowRightLeft size={20} />
            <p>{text}</p>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-col space-y-3">
            <Skeleton className="h-[125px] w-[250px] rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
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
  );
};
