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
  const headingWords = `Where You Go for Creators.`;
  const subHeadingWords = `Search and review from 3,100,000+ creators and communities.`;
  const placeholders = SearchPlaceholders;

  // State to control visibility of heading, subheading, and search bar

  const [isSubheadingVisible, setIsSubheadingVisible] = useState(false);

  useEffect(() => {
    const subheadingTimer = setTimeout(() => {
      setIsSubheadingVisible(true);
    }, 200);

    return () => {
      clearTimeout(subheadingTimer);
    };
  }, []);

  const { query } = useKBar();

  const handleSerarchClick = useCallback(() => {
    query.toggle();
  }, [query]);

  return (
    <div className="flex flex-col items-start m-2 md:m-10 gap-y-8 mx-auto w-full max-w-3xl">
      <div className="flex flex-col items-start gap-y-2 w-full">
        {/* Render heading with delay */}
        {
          <TextGenerateEffect
            words={headingWords}
            textClassName="text-3xl md:text-5xl lg:text-5xl xl:text-6xl"
            duration={0.05}
          />
        }

        {/* Render subheading with delay */}
        {isSubheadingVisible && (
          <TextGenerateEffect
            words={subHeadingWords}
            className="text-primary"
            duration={0.1}
            textClassName="font-semibold  text-sm sm:text-[17px] md:text-[16px] lg:text-[18px]"
          />
        )}
      </div>

      {/* Render search bar with delay */}
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
