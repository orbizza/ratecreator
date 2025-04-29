/**
 * HeroText Component
 *
 * This component renders the main hero text section of the landing page, featuring:
 * - Animated text generation effects for heading and subheading
 * - Search bar with dynamic placeholders
 * - Staggered reveal animations
 * - Integration with kbar for search functionality
 *
 * The component uses a combination of custom animations and the kbar
 * search interface to create an engaging hero section.
 */

"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import {
  PlaceholdersAndVanishInput,
  TextGenerateEffect,
} from "@ratecreator/ui";

import { SearchPlaceholders } from "@ratecreator/store";
import { useKBar } from "kbar";

export const HeroText = () => {
  // Main heading text
  const headingWords = `Find the Creators.`;

  // Subheading text with statistics
  const subHeadingWords = `Search and review from 3,100,000+ creators and communities.`;

  // Alternative heading and subheading options (commented out)
  /*
  Heading:
    Question Format:
    What will you explore among 3.1M+ creators?
    Ready to search and review millions of creators?
    Who will you connect with today?
    Want to review the best creators and communities?
    Sentence Format:
    Search and review from over 3.1M creators and communities.
    Explore 3.1M+ creators across platforms.
    Your gateway to millions of creators and communities.
    Find and review creators effortlessly.
  Subheading:
    Question Format:
    What will you explore among 3.1M+ creators?
    Ready to search and review millions of creators?
    Who will you connect with today?
    Want to review the best creators and communities?
    Sentence Format:
    Search and review from over 3.1M creators and communities.
    Explore 3.1M+ creators across platforms.
    Your gateway to millions of creators and communities.
    Find and review creators effortlessly.
   */

  // Search placeholders from store
  const placeholders = SearchPlaceholders;

  // State to control visibility of subheading and search bar
  const [isSubheadingVisible, setIsSubheadingVisible] = useState(false);

  // Set up delayed visibility for subheading
  useEffect(() => {
    const subheadingTimer = setTimeout(() => {
      setIsSubheadingVisible(true);
    }, 200);

    return () => {
      clearTimeout(subheadingTimer);
    };
  }, []);

  // Initialize kbar for search functionality
  const { query } = useKBar();

  // Handle search bar click
  const handleSerarchClick = useCallback(() => {
    query.toggle();
  }, [query]);

  return (
    <div className="flex flex-col items-start m-2 md:m-10 gap-y-8 mx-auto w-full max-w-3xl">
      <div className="flex flex-col items-start gap-y-2 w-full">
        {/* Animated heading text */}
        {
          <TextGenerateEffect
            words={headingWords}
            textClassName="text-3xl md:text-5xl lg:text-5xl xl:text-6xl"
            duration={0.05}
          />
        }

        {/* Animated subheading text - appears after delay */}
        {isSubheadingVisible && (
          <TextGenerateEffect
            words={subHeadingWords}
            className="text-primary"
            duration={0.1}
            textClassName="font-semibold  text-sm sm:text-[17px] md:text-[16px] lg:text-[18px]"
          />
        )}
      </div>

      {/* Search bar - appears after subheading */}
      {isSubheadingVisible && (
        <div
          id="hero-search-bar"
          className="w-full relative ml-auto sm:-ml-4 md:-ml-24 lg:ml-0 mt-3 flex justify-start"
        >
          <PlaceholdersAndVanishInput
            placeholders={placeholders}
            onClick={handleSerarchClick}
          />
        </div>
      )}
    </div>
  );
};
