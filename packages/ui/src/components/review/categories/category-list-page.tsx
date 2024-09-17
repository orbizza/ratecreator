"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

import { getCategoryData } from "@ratecreator/actions/review";
import { getIconForCategory } from "./category-icons";
import { Category } from "@ratecreator/types/review";
import { PlaceholdersAndVanishInputCategory, Separator } from "@ratecreator/ui";
import SearchBar from "./search-bar";

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

interface CategoryWithColor extends Category {
  bgColor: string;
  hoverColor: string;
}

export const CategoryListPage: React.FC = () => {
  const [categories, setCategories] = useState<CategoryWithColor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategoryData();
        const categoriesWithColors = addColorsToCategories(
          data as CategoryWithColor[],
        );
        setCategories(categoriesWithColors);
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

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="container mx-auto p-4 mt-10">
      <div className="flex flex-col items-start md:items-center w-full gap-y-4 pt-10 pb-14">
        <div className="text-3xl md:text-5xl font-bold mb-4 mx-0 sm:mx-6 md:mx-auto">
          What are you looking for?
        </div>
        <div className="w-full">
          <SearchBar categories={categories} isLoading={false} />
        </div>
      </div>
      <Separator className="my-4" />
      <div className="mt-20 my-[4rem]">
        <h2 className="text-2xl font-semibold my-4 mb-10">
          Explore companies by category
        </h2>
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4">
          {categories.map((category) => (
            <div key={category.id} className="break-inside-avoid mb-4">
              <CategoryCard category={category} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface CategoryCardProps {
  category: CategoryWithColor;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const icon = getIconForCategory(category.name);

  return (
    <div className="rounded-lg overflow-hidden shadow-md flex flex-col h-full">
      <Link href={`/category/${category.slug}`} passHref className="block">
        <div
          className={`${category.bgColor} ${category.hoverColor} p-4 transition-transform hover:scale-105`}
        >
          <div className="flex flex-col items-center justify-center ">
            <div className="text-4xl text-gray-800 dark:text-white mb-2">
              {icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white text-center">
              {category.name}
            </h3>
          </div>
        </div>
      </Link>
      {category.subcategories && category.subcategories.length > 0 && (
        <div className="bg-white dark:bg-gray-900 p-4 flex-grow">
          <ul className="list-none p-0 m-0">
            {category.subcategories.map((subcat) => (
              <Link
                href={`/category/${subcat.slug}`}
                passHref
                className="block transition-transform hover:scale-105"
              >
                <li
                  key={subcat.id}
                  className="text-sm text-gray-600 dark:text-gray-300 py-1"
                >
                  {subcat.name}
                  <Separator className="my-2" />
                </li>
              </Link>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CategoryListPage;
