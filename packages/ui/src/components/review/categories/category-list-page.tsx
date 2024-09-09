"use client";

import React, { useState, useEffect } from "react";
import { getCategoryData } from "@ratecreator/actions/review";
import { getIconForCategory } from "./category-icons";
import { Category } from "@ratecreator/types/review";
import { PlaceholdersAndVanishInputCategory, Separator } from "@ratecreator/ui";

const bgColors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-red-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
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
        // console.log(data);
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
    return categories.map((category) => ({
      ...category,
      bgColor: bgColors[Math.floor(Math.random() * bgColors.length)],
      subcategories: category.subcategories
        ? addColorsToCategories(category.subcategories as CategoryWithColor[])
        : [],
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
          <SearchBar />
        </div>
      </div>
      <Separator className="my-4" />
      <div className="mt-20 my-[4rem]">
        <h2 className="text-2xl font-semibold my-4 mb-10">
          Explore companies by category
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category) => (
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
  const icon = getIconForCategory(category.name);

  return (
    <div
      className={`${category.bgColor} rounded-lg overflow-hidden transition-transform transform hover:scale-105 text-white`}
    >
      <div className="p-4">
        <div className="flex items-center mb-2">
          {icon}
          <h3 className="text-lg font-semibold ml-2">{category.name}</h3>
        </div>
        {category.subcategories && category.subcategories.length > 0 && (
          <div className="mt-2 text-sm">
            <strong>Subcategories:</strong>
            <ul className="list-disc list-inside mt-1">
              {category.subcategories.map((subcat) => (
                <li key={subcat.id}>{subcat.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
