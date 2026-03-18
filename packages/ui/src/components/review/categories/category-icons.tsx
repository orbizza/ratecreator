"use client";

import React from "react";
import {
  Cpu,
  Clapperboard,
  Car,
  BookOpen,
  Briefcase,
  Laugh,
  GraduationCap,
  Leaf,
  Scissors,
  Utensils,
  Gamepad2,
  HeartPulse,
  Landmark,
  Wrench,
  Users,
  Camera,
  Swords,
  Music,
  Newspaper,
  Sparkles,
  Drama,
  Trophy,
  Plane,
  Microscope,
  LucideIcon,
  Smartphone,
  Home,
  Mountain,
  PawPrint,
  Heart,
  SearchSlash,
  Video,
  TreePine,
} from "lucide-react";

/**
 * Mapping of category names to their corresponding Lucide icons.
 * Covers all 31 root categories (updated March 2026).
 */
const categoryIcons: Record<string, LucideIcon> = {
  "Anime, Comics, and Fandom": Drama,
  "Artificial Intelligence and Machine Learning": Cpu,
  "Arts and Entertainment": Clapperboard,
  "Books and Literature": BookOpen,
  "Business, Finance, and Entrepreneurship": Briefcase,
  "Comedy and Humor": Laugh,
  "Education and Professional Development": GraduationCap,
  "Environment and Sustainability": TreePine,
  "Fashion, Beauty, and Lifestyle": Scissors,
  "Food and Cooking": Utensils,
  "Gaming and Esports": Gamepad2,
  "Health and Fitness": HeartPulse,
  "History and Culture": Landmark,
  "Hobbies and DIY": Wrench,
  "Home and Garden": Home,
  "Kids and Family": Users,
  "Military and Defense": Swords,
  Music: Music,
  "News and Current Affairs": Newspaper,
  "Outdoors and Adventure": Mountain,
  "Pets and Animals": PawPrint,
  "Photography and Videography": Camera,
  "Relationships and Dating": Heart,
  "Science and Nature": Microscope,
  "Spirituality and Philosophy": Sparkles,
  "Sports and Athletics": Trophy,
  "Technology and Gadgets": Smartphone,
  "Travel and Tourism": Plane,
  "True Crime and Mystery": SearchSlash,
  "Vehicles and Transportation": Car,
  "Vlogs and Daily Life": Video,
};

/**
 * Get the appropriate icon component for a given category name
 *
 * @param {string} categoryName - The name of the category
 * @returns {React.ReactElement} A React element containing the category icon
 *
 * @example
 * // Returns a CPU icon for AI/ML category
 * getIconForCategory("Artificial Intelligence and Machine Learning")
 *
 * @example
 * // Returns a briefcase icon for unknown categories
 * getIconForCategory("Unknown Category")
 */
export function getIconForCategory(categoryName: string): React.ReactElement {
  const IconComponent = categoryIcons[categoryName] || Briefcase; // Default to Briefcase if no match
  return <IconComponent className="w-6 h-6" />;
}
