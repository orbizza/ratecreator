"use client";

import React from "react";
import { Search } from "lucide-react";
import {
  PlaceholdersAndVanishInput,
  TextGenerateEffect,
} from "@ratecreator/ui";

export const HeroText = () => {
  const headingWords = `Where You Go for Content Creators.`;
  const subHeadingWords = `Find, rate, and review from 3,100,000+ creators across multiple platforms.`;
  const placeholders = [
    "Find the best content creators",
    "Search based on categories",
    "Find influencers on Instagram",
    "Who is the best Youtuber?",
    "X accounts with largest following?",
  ];

  //  Add the action to open the command search bar
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("submitted");
  };

  return (
    <div className="flex flex-col items-start gap-y-8 mx-auto w-full max-w-3xl">
      <div className="flex flex-col items-start gap-y-2 w-full">
        <TextGenerateEffect
          words={headingWords}
          textClassName="text-2xl md:text-3xl lg:text-5xl"
        />
        <TextGenerateEffect
          words={subHeadingWords}
          className="text-[#ff3131]"
          textClassName="font-semibold text-[12px] md:text-sm lg:text-[16px]"
        />
      </div>
      <div className="w-full relative mt-3 flex lg:justify-start justify-center">
        <PlaceholdersAndVanishInput
          placeholders={placeholders}
          onSubmit={onSubmit}
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" />
      </div>
    </div>
  );
};
