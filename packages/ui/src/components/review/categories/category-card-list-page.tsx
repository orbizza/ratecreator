"use client";

import React from "react";
import Link from "next/link";

import { CategoryCardProps } from "@ratecreator/types/review";
import { Separator } from "@ratecreator/ui";

import { getIconForCategory } from "./category-icons";

/**
 * CategoryCardListPage Component
 *
 * A card component that displays a category and its subcategories.
 * Features include:
 * - Category icon and name display
 * - Dynamic background and hover colors
 * - Subcategory list with separators
 * - Responsive hover effects
 * - Dark mode support
 *
 * @component
 * @param {CategoryCardProps} props - Component props
 * @returns {JSX.Element} A category card component for list pages
 */
export const CategoryCardListPage: React.FC<CategoryCardProps> = ({
  category,
}) => {
  // Get the appropriate icon for the category
  const icon = getIconForCategory(category.name);

  return (
    <div className='rounded-lg overflow-hidden shadow-md flex flex-col h-full'>
      {/* Category header with icon and name */}
      <Link href={`/categories/${category.slug}`} passHref className='block'>
        <div
          className={`${category.bgColor} ${category.hoverColor} p-4 transition-transform hover:scale-105`}
        >
          <div className='flex flex-col items-center justify-center '>
            <div className='text-4xl text-gray-800 dark:text-white mb-2'>
              {icon}
            </div>
            <h3 className='text-lg font-semibold text-gray-800 dark:text-white text-center'>
              {category.name}
            </h3>
          </div>
        </div>
      </Link>

      {/* Subcategories list */}
      {category.subcategories && category.subcategories.length > 0 && (
        <div className='bg-white dark:bg-gray-900 p-4 flex-grow'>
          <ul className='list-none p-0 m-0'>
            {category.subcategories.map((subcat) => (
              <Link
                key={subcat.id}
                href={`/categories/${subcat.slug}`}
                passHref
                className='block transition-transform hover:scale-105'
              >
                <li className='text-sm text-gray-600 dark:text-gray-300 py-1'>
                  {subcat.name}
                  <Separator className='my-2' />
                </li>
              </Link>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
