"use client";

import React from "react";
import {
  //   Paw,
  Music,
  Home,
  Utensils,
  Scissors,
  ShoppingCart,
  Briefcase,
  LucideIcon,
} from "lucide-react";

const categoryIcons: Record<string, LucideIcon> = {
  //   "Animals & Pets": Paw,
  "Events & Entertainment": Music,
  "Home & Garden": Home,
  "Restaurants & Bars": Utensils,
  "Beauty & Well-being": Scissors,
  "Shopping & Fashion": ShoppingCart,
  "Home Services": Briefcase,
  // Add more mappings as needed
};

export function getIconForCategory(categoryName: string): React.ReactElement {
  const IconComponent = categoryIcons[categoryName] || ShoppingCart; // Default to ShoppingCart if no match
  return <IconComponent className='w-6 h-6' />;
}
