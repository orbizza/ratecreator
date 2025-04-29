/**
 * LandingPage Component
 *
 * This component serves as the main landing page layout, featuring:
 * - Hero section with search functionality
 * - Popular categories section
 * - Statistics display
 * - Why Rate Creator section
 * - Creator call-to-action section
 * - Animated footer text
 *
 * The component uses Intersection Observer to handle scroll-based animations
 * and visibility of certain sections.
 */

"use client";

import React, { useEffect, useState, useRef } from "react";
import { HeroSection } from "./hero-section";
import { SparklesText, Separator, SphereMask } from "@ratecreator/ui";
import { CreatorCTA } from "./creator-cta";
import { WhyRateCreator } from "./why-rc";
import { CataloguedStats } from "./catalogued-stats";
import { PopularCategories } from "./popular-categories";

export const LandingPage = () => {
  // State to track visibility of creator CTA section
  const [isCreatorCtaVisible, setIsCreatorCtaVisible] = useState(false);
  const creatorCtaRef = useRef(null);

  // Set up Intersection Observer to handle scroll-based animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsCreatorCtaVisible(true);
          observer.disconnect(); // Stop observing once visible
        }
      },
      { threshold: 0.1 }, // Trigger when 10% of the element is visible
    );

    if (creatorCtaRef.current) {
      observer.observe(creatorCtaRef.current);
    }

    return () => {
      if (creatorCtaRef.current) {
        observer.unobserve(creatorCtaRef.current);
      }
    };
  }, []);

  return (
    <main className="min-h-[calc(100vh-20vh)] max-w-screen-xl mx-auto">
      {/* Hero Section with Create Creator CTA */}
      <HeroSection />

      <Separator className="my-4" />

      {/* Popular Categories section with Write a review CTA */}
      <PopularCategories />

      {/* Statistics section showing catalogued data */}
      <CataloguedStats />

      <Separator className="my-0 sm:my-4" />

      {/* Why Rate Creator section explaining the platform's benefits */}
      <WhyRateCreator />

      {/* Decorative sphere mask element */}
      <div className="mb-0 sm:mb-10">
        <SphereMask />
      </div>

      {/* Creator CTA section with scroll-based visibility */}
      <div
        ref={creatorCtaRef}
        className={`total-accounts w-full mt-0 sm:mt-10 p-8 transition-opacity duration-1000  ${
          isCreatorCtaVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {isCreatorCtaVisible && <CreatorCTA />}
      </div>

      {/* Pre-footer section with animated text */}
      <div className="ml-1 sm:ml-0 h-[10rem] -my-[2rem] flex items-center justify-center">
        <SparklesText
          text="RATE CREATORS"
          className="text-5xl md:text-7xl lg:text-8xl xl:text-9xl text-rose-200"
          colors={{ first: "#ff3131", second: "#fecdd3" }}
        />
      </div>
    </main>
  );
};
