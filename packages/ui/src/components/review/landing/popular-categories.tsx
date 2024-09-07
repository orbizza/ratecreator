"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";

import { MostPopularCategories } from "@ratecreator/store";
import { CardLandingVertical } from "../cards/card-landing-vertical";
import { Button } from "@ratecreator/ui";
import { WriteReviewCTA } from "./write-review-cta";

// CategoryList component
type CategoryListProps = {
  categories: Array<{ name: string }>;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
};

const CategoryList = ({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryListProps) => (
  <div className='space-y-2 my-[2rem]'>
    <h1 className='text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4'>
      Most Popular Categories
    </h1>
    {categories.map((category) => (
      <CategoryItem
        key={category.name}
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

// SelectedCategoryHeader component
const SelectedCategoryHeader = ({ category }: { category: string }) => (
  <div className='flex justify-end items-center mb-4'>
    <Button variant={"link"}>
      See all {category} <ChevronRight className='ml-1' size={16} />
    </Button>
  </div>
);

// CategoryGrid component
const CategoryGrid = ({ accounts }: { accounts: Array<any> }) => {
  const [screenSize, setScreenSize] = useState("");

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
        return accounts.slice(0, 9);
    }
  }, [accounts, screenSize]);

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-5 sm:ml-12'>
      {displayedAccounts.map((item) => (
        <CardLandingVertical key={item.accountId - item.platform} {...item} />
      ))}
    </div>
  );
};

// Main component
const PopularCategories = () => {
  const [selectedCategory, setSelectedCategory] = useState(
    MostPopularCategories[0].name
  );

  // Data structure: each category has its own list of account items
  const categories = MostPopularCategories;

  // Get selected category's data
  const selectedCategoryData = categories.find(
    (cat) => cat.name === selectedCategory
  );

  // Function to handle category selection
  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
  };

  return (
    <div className='flex flex-col ml-5 my-[5rem]'>
      {/* Category List */}
      <div className='flex'>
        <div className='w-2/5 md:w-1/4 pr-4'>
          <CategoryList
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
          />
          <Button className='w-full mt-4 justify-start'>
            View All Categories
          </Button>
        </div>

        {/* Category Grid */}
        <div className='mr-5 w-3/5 md:w-3/4'>
          <SelectedCategoryHeader category={selectedCategory} />
          <CategoryGrid
            accounts={selectedCategoryData ? selectedCategoryData.items : []}
          />
        </div>
      </div>
      <div className='my-[4rem]'>
        <WriteReviewCTA />
      </div>
    </div>
  );
};

export { PopularCategories };
