"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button, Separator } from "@ratecreator/ui";

import { CreatorCard, CategoryCard } from "@ratecreator/ui/review";

import { FilteredCategory, TabType } from "@ratecreator/types/review";
import { useKBar } from "kbar";

interface RenderResultsProps {
  filteredData: FilteredCategory[];
  activeTab: TabType;
}

export const RenderResults: React.FC<RenderResultsProps> = ({
  filteredData,
  activeTab,
}) => {
  const router = useRouter();
  const { query } = useKBar();

  const handleCategoryClick = (categoryName: string) => {
    router.push(`/categories/${encodeURIComponent(categoryName)}`);
  };
  return (
    <div className='mt-4 max-h-[50vh] overflow-y-auto'>
      {filteredData.map((category) => (
        <div key={category.name} className='mb-6'>
          <Button
            variant={"link"}
            onClick={() => handleCategoryClick(category.name)}
            className='w-full text-left mb-2 hover:bg-accent rounded-md transition-colors duration-200'
          >
            <h3 className='text-sm font-semibold text-muted-foreground py-1 px-2'>
              {category.name}
            </h3>
          </Button>
          <div className='space-y-2'>
            {category.items.map((item) =>
              "isCategory" in item ? (
                <CategoryCard key={item.name} name={item.name} />
              ) : (
                <CreatorCard
                  key={item.accountId}
                  {...item}
                  setOpen={() => query.toggle()}
                />
              )
            )}
          </div>
          <Separator className='my-4' />
        </div>
      ))}
      {filteredData.length === 0 && (
        <div className='text-center text-muted-foreground'>
          No results found for the current tab.
        </div>
      )}
    </div>
  );
};
