"use client";

import React, { useState, useEffect } from "react";
import { getCategoryData } from "@ratecreator/actions/review";
import { getIconForCategory } from "./category-icons";
import { Category } from "@ratecreator/types/review";
import { PlaceholdersAndVanishInputCategory, Separator } from "@ratecreator/ui";

const bgColors = [
  "bg-blue-200 dark:bg-blue-700",
  "bg-green-200 dark:bg-green-700",
  "bg-yellow-200 dark:bg-yellow-700",
  "bg-red-200 dark:bg-red-700",
  "bg-purple-200 dark:bg-purple-700",
  "bg-pink-200 dark:bg-pink-700",
  "bg-indigo-200 dark:bg-indigo-700",
  "bg-teal-200 dark:bg-teal-700",
];

interface CategoryWithColor extends Category {
  bgColor: string;
}

export const CategoryListPage: React.FC = () => {
  const [categories, setCategories] = useState<CategoryWithColor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategoryData();
        const categoriesWithColors = data.map((category) => ({
          ...category,
          bgColor: bgColors[Math.floor(Math.random() * bgColors.length)],
        }));
        setCategories(categoriesWithColors);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="container mx-auto p-4 mt-10">
      <div className="flex flex-col items-start md:items-center w-full gap-y-4 pt-10 pb-14 ">
        <div className="text-3xl md:text-5xl font-bold mb-4 mx-0 sm:mx-6 md:mx-auto">
          What are you looking for?
        </div>
        <div className="w-full">
          <SearchBar />
        </div>
      </div>
      <Separator className=" my-4" />
      <div className="mt-20 my-[4rem]">
        <h2 className="text-2xl font-semibold my-4 mb-10">
          Explore companies by category
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories
            .filter((cat) => cat.depth === 0)
            .map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
        </div>
      </div>
    </div>
  );
};

const SearchBar: React.FC = () => {
  const placeholders = [
    "Search for categories",
    "Search for sub-categories",
    "Enter any category name",
  ];
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("submitted");
  };
  return (
    <div className="mb-4 w-full items-center justify-center flex">
      <PlaceholdersAndVanishInputCategory
        placeholders={placeholders}
        onSubmit={onSubmit}
      />
    </div>
  );
};

interface CategoryCardProps {
  category: CategoryWithColor;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const icon = getIconForCategory(category.name);

  return (
    <div
      className={`${category.bgColor} rounded-lg overflow-hidden transition-colors duration-300 ${
        isHovered ? "bg-opacity-80 dark:bg-opacity-60" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-4">
        <div className="flex items-center mb-2">
          {icon}
          <h3 className="text-lg font-semibold ml-2">{category.name}</h3>
        </div>
        {/* {category.description && (
          <p className='text-sm mb-2 text-gray-600 dark:text-gray-300'>
            {category.description}
          </p>
        )} */}
        {category.subcategories && category.subcategories.length > 0 && (
          <ul>
            {category.subcategories.map((subcategory) => (
              <li key={subcategory.id} className="text-sm py-1">
                {subcategory.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
