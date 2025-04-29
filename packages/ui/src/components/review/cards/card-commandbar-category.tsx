"use client";
import React from "react";
import { useRouter } from "next/navigation";

/**
 * Props for the CategoryCard component
 */
interface CategoryCardProps {
  /** Name of the category to display */
  name: string;
}

/**
 * CategoryCard Component
 *
 * A card component used in the command bar to display category options.
 * Shows the category name and navigates to the category page when clicked.
 *
 * @component
 * @param {CategoryCardProps} props - Component props
 * @param {string} props.name - Name of the category to display
 * @returns {JSX.Element} A category card component for the command bar
 */
export const CategoryCard: React.FC<CategoryCardProps> = ({ name }) => {
  const router = useRouter();

  /**
   * Handles the click event on the category card
   * Navigates to the category page with the encoded category name
   */
  const handleClick = () => {
    router.push(`/categories/${encodeURIComponent(name)}`);
  };

  return (
    <button
      onClick={handleClick}
      className='w-full bg-card hover:bg-accent text-card-foreground p-3 rounded-md text-left transition-colors duration-200'
    >
      <h4 className='font-medium'>{name}</h4>
    </button>
  );
};
