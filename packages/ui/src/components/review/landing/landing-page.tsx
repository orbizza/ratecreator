"use client";

import React, { useEffect, useState, useRef } from "react";
import { HeroSection } from "./hero-section";
import { SparklesText, Separator, SphereMask } from "@ratecreator/ui";
import { CreatorCTA } from "./creator-cta";
import { WhyRateCreator } from "./why-rc";

export const LandingPage = () => {
  const [isCreatorCtaVisible, setIsCreatorCtaVisible] = useState(false);
  const creatorCtaRef = useRef(null);

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
      {/* <Separator className='my-4' /> */}

      {/* ToDo: Most Popular Categories with Write a review */}

      {/* ToDo: Reviews card */}

      {/* Why use RC */}
      <WhyRateCreator />

      {/* Border */}
      <div className="mb-10">
        {/* <hr className='my-4 border-t border-gray-300 dark:border-gray-700' /> */}
        <SphereMask />
      </div>

      {/* Creator CTA */}
      <div
        ref={creatorCtaRef}
        className={`total-accounts w-full mt-10 p-8 transition-opacity duration-1000  ${
          isCreatorCtaVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {isCreatorCtaVisible && <CreatorCTA />}
      </div>

      {/* Pre Footer */}
      <div className="h-[10rem] -my-[2rem] flex items-center justify-center">
        <SparklesText
          text="RATE CREATORS"
          className="text-5xl md:text-7xl lg:text-8xl xl:text-9xl text-rose-200"
          colors={{ first: "#ff3131", second: "#fecdd3" }}
        />
      </div>
    </main>
  );
};
