"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Hash, Info, Layers2, ReceiptText, UserSearch } from "lucide-react";
import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Separator,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@ratecreator/ui";

import { getSingleGlossaryCategory } from "@ratecreator/actions/review";
import { Category } from "@ratecreator/types/review";
import { CategoryGlossaryPostSkeleton } from "./category-glossary-post-skeleton";
import { categoryGlossaryCache, truncateText } from "@ratecreator/db/utils";

export const CategoryGlossaryPost = () => {
  const params = useParams();
  const slug = params?.slug as string;
  const [isLoading, setIsLoading] = useState(true);

  const [category, setCategory] = useState<Category | null>(null);
  const [accounts, setAccounts] = useState<number>(0);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        // Try to get data from IndexedDB cache first
        const cachedData =
          await categoryGlossaryCache.getCachedCategoryWithAccounts(slug);

        if (cachedData) {
          console.log("Using cached category and accounts data from IndexedDB");
          setCategory(cachedData.category);
          setAccounts(cachedData.accounts);
          setIsLoading(false);
          return;
        }

        // If no cached data, fetch from API
        const { category, accounts } = await getSingleGlossaryCategory(slug);

        // Cache both category and accounts data together
        if (category) {
          await categoryGlossaryCache.setCachedCategoryWithAccounts(slug, {
            category,
            accounts,
          });
        }

        setCategory(category);
        setAccounts(accounts);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching category:", error);
        setIsLoading(false);
      }
    };

    fetchCategory();
  }, [slug]);

  if (isLoading) {
    return <CategoryGlossaryPostSkeleton />;
  }

  if (!category) {
    return <div>Category not found</div>;
  }

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto px-4 sm:px-6 mb-10">
      {/* Breadcrumb navigation */}
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/category-glossary">
              Category Glossary
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{category.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="hidden sm:flex flex-row gap-x-2 items-center text-primary">
        <Layers2 size={28} />
        <h1 className="text-2xl md:text-3xl font-semibold">{category.name}</h1>
      </div>
      <div className="flex sm:hidden flex-row gap-x-2 items-center text-primary ">
        {/* <Layers2 size={20} /> */}
        <h1 className="text-2xl font-semibold">{category.name}</h1>
      </div>
      <Accordion type="single" collapsible defaultValue="channel-description">
        <AccordionItem value="channel-description" className="border-0">
          <AccordionTrigger className="text-2xl font-bold hover:no-underline">
            <div className="flex flex-row gap-x-2 items-center text-primary">
              <ReceiptText size={28} />
              <span className="">Category Details</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="prose dark:prose-invert max-w-none">
              <h2 className="text-lg font-semibold">Short Description</h2>
              <p className="whitespace-pre-wrap  mt-2">
                {category.shortDescription || "No description available"}
              </p>
            </div>
            <div className="prose dark:prose-invert max-w-none mt-4">
              <h2 className="text-lg font-semibold">Long Description</h2>
              <p className="whitespace-pre-wrap  mt-2">
                {category.longDescription || "No description available"}
              </p>
            </div>
            <div className="flex flex-row gap-x-2 items-center text-primary mt-4">
              <UserSearch size={20} />
              <h2 className="text-lg font-semibold">Category Accounts</h2>
              <Info size={12} className="text-muted-foreground" />
            </div>
            <div className="flex flex-col items-start gap-2 mt-2">
              <span className="text-sm ">
                Total creators &amp; communities in this category:{" "}
                <span className="text-primary font-semibold">{accounts}</span>
              </span>
              <Link
                href={`/categories/${category.slug}`}
                className="text-sm text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-500 hover:underline"
              >
                <span className="">View all creator &amp; communities</span>
              </Link>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Separator />
      <Accordion type="single" collapsible defaultValue="category-keywords">
        <AccordionItem value="category-keywords" className="border-0">
          <AccordionTrigger className="text-2xl font-bold hover:no-underline">
            <div className="flex flex-row gap-x-2 items-center text-primary">
              <Hash size={28} />
              <span className="">Category Keywords</span>
              <Info size={14} className="text-muted-foreground" />
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-wrap gap-2">
              {category.keywords.map((keyword, index) => (
                <KeywordBadge key={index} keyword={keyword} />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

const KeywordBadge = ({ keyword }: { keyword: String }) => (
  <Link href={`/search?q=${keyword}`}>
    <Badge
      variant="secondary"
      className="px-3 py-1.5 gap-1.5 hover:bg-secondary/80 cursor-pointer transition-colors"
    >
      <Hash className="w-3 h-3 -mr-1" />
      {keyword.trim()}
    </Badge>
  </Link>
);
