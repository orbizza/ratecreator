"use client";

import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import {
  PlaceholdersAndVanishInput,
  TextGenerateEffect,
} from "@ratecreator/ui";

import { SearchPlaceholders } from "@ratecreator/store";

export const HeroText = () => {
  const headingWords = `Where You Go for Creators.`;
  const subHeadingWords = `Search and review from 3,100,000+ creators and communities.`;
  const placeholders = SearchPlaceholders;

  // State to control visibility of heading, subheading, and search bar

  const [isSubheadingVisible, setIsSubheadingVisible] = useState(false);
  const [isSearchBarVisible, setIsSearchBarVisible] = useState(false);

  useEffect(() => {
    // Show subheading after heading (1 second later)
    const subheadingTimer = setTimeout(() => {
      setIsSubheadingVisible(true);
    }, 700);

    // Show search bar after subheading (1 second later)
    const searchBarTimer = setTimeout(() => {
      setIsSearchBarVisible(true);
    }, 900);

    // Cleanup timers if component unmounts
    return () => {
      // clearTimeout(headingTimer);
      clearTimeout(subheadingTimer);
      clearTimeout(searchBarTimer);
    };
  }, []);

  //  Add the action to open the command search bar
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("submitted");
  };

  return (
    <div className='flex flex-col items-start m-2 md:m-10 gap-y-8 mx-auto w-full max-w-3xl'>
      <div className='flex flex-col items-start gap-y-2 w-full'>
        {/* Render heading with delay */}
        {
          <TextGenerateEffect
            words={headingWords}
            textClassName='text-3xl md:text-5xl lg:text-5xl xl:text-6xl'
          />
        }

        {/* Render subheading with delay */}
        {isSubheadingVisible && (
          <TextGenerateEffect
            words={subHeadingWords}
            className='text-primary'
            textClassName='font-semibold  text-sm sm:text-[17px] md:text-[16px] lg:text-[18px]'
          />
        )}
      </div>

      {/* Render search bar with delay */}
      {isSearchBarVisible && (
        <div
          id='hero-search-bar'
          className='w-full relative ml-auto sm:-ml-4 md:-ml-24 lg:ml-0 mt-3 flex justify-start'
        >
          <PlaceholdersAndVanishInput
            placeholders={placeholders}
            onSubmit={onSubmit}
          />
        </div>
      )}
    </div>
  );
};
