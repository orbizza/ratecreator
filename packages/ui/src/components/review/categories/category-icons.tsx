"use client";

import React from "react";
import {
  Cpu,
  Clapperboard,
  Volume2,
  Car,
  Book,
  Briefcase,
  Smile,
  GraduationCap,
  Leaf,
  Scissors,
  Utensils,
  Gamepad2,
  HeartPulse,
  Globe,
  Wrench,
  Users,
  Camera,
  ShieldCheck,
  Music,
  Newspaper,
  Mic,
  Star,
  Trophy,
  PlaneTakeoff,
  FlaskConical,
  Glasses,
  LucideIcon,
  MonitorSmartphone,
} from "lucide-react";

/**
 * Mapping of category names to their corresponding Lucide icons
 * Each category is associated with a specific icon that represents its theme
 */
const categoryIcons: Record<string, LucideIcon> = {
  "Artificial Intelligence and Machine Learning": Cpu,
  "Arts and Entertainment": Clapperboard,
  ASMR: Volume2,
  "Books and Literature": Book,
  "Business, Finance, and Entrepreneurship": Briefcase,
  "Comedy and Humor": Smile,
  "Education and Professional Development": GraduationCap,
  "Environment and Sustainability": Leaf,
  "Fashion, Beauty, and Lifestyle": Scissors,
  "Food and Cooking": Utensils,
  "Gaming and Esports": Gamepad2,
  "Health and Fitness": HeartPulse,
  "History and Culture": Globe,
  "Hobbies and DIY": Wrench,
  "Kids and Family": Users,
  "Lifestyle and Vlogs": Camera,
  "Military and Defense": ShieldCheck,
  Music: Music,
  "News and Current Affairs": Newspaper,
  Podcasts: Mic,
  "Science and Nature": FlaskConical,
  "Spirituality and Philosophy": Star,
  "Sports and Athletics": Trophy,
  "Technology and Gadgets": MonitorSmartphone,
  "Travel and Tourism": PlaneTakeoff,
  "Vehicles and Transportation": Car,
  "Virtual and Augmented Reality": Glasses,
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
