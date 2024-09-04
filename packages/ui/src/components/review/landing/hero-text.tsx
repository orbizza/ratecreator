"use client";

import React from "react";
import { Search } from "lucide-react";
import {
  PlaceholdersAndVanishInput,
  TextGenerateEffect,
} from "@ratecreator/ui";

import { SearchPlaceholders } from "@ratecreator/store";

export const HeroText = () => {
  const headingWords = `Where You Go for Creators.`;
  // const headingWords = `Find a creator you can trust.`;
  // const subHeadingWords = `Search and review from 3,100,000+ creators across multiple platforms.`;
  const subHeadingWords = `Search and review from 3,100,000+ creators and communities.`;
  const placeholders = SearchPlaceholders;

  //  Add the action to open the command search bar
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("submitted");
  };

  return (
    <div className="flex flex-col items-start m-2 md:m-10 gap-y-8 mx-auto w-full max-w-3xl">
      <div className="flex flex-col items-start gap-y-2 w-full">
        <TextGenerateEffect
          words={headingWords}
          textClassName="text-3xl md:text-5xl lg:text-5xl xl:text-6xl "
        />
        <TextGenerateEffect
          words={subHeadingWords}
          className="text-primary"
          textClassName="font-semibold text-sm sm:text-[17px] md:text-[16px] lg:text-[18px] "
        />
        {/* -[#ff3131] */}
      </div>
      <div
        id="hero-search-bar"
        className="w-full relative ml-auto sm:-ml-6 md:-ml-24 lg:ml-0 mt-3 flex justify-start "
      >
        <PlaceholdersAndVanishInput
          placeholders={placeholders}
          onSubmit={onSubmit}
        />
        <Search className="absolute hidden sm:block left-3 sm:left-6 md:left-28 lg:left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" />
      </div>
    </div>
  );
};
