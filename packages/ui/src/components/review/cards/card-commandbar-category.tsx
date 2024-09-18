"use client";
import React from "react";
import { useRouter } from "next/navigation";

interface CategoryCardProps {
  name: string;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ name }) => {
  const router = useRouter();

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
