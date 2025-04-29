/**
 * CataloguedStats Component
 *
 * This component serves as a container for displaying catalogued statistics, featuring:
 * - Scroll-based visibility using Intersection Observer
 * - Animated opacity transitions
 * - Decorative sphere mask element
 * - Statistics section with platform-wise data
 *
 * The component manages the visibility of the statistics section based on
 * scroll position, providing a smooth reveal animation when the section
 * comes into view.
 */

"use client";

import React, { useEffect, useState } from "react";
import { SphereMask } from "@ratecreator/ui";

import { StatsSection } from "./stats-section";

export function CataloguedStats() {
  // State to track visibility of the catalogued stats section
  const [isCataloguedVisible, setIsCataloguedVisible] = useState(false);

  // Set up Intersection Observer to handle scroll-based visibility
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setIsCataloguedVisible(true);
      }
    });

    const target = document.querySelector("#catalogued-section");
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, []);

  return (
    <section id='catalogued-section' className='mb-[5rem] sm:mb-[16rem]'>
      <div
        className={`total-accounts w-full mt-0  p-8 transition-opacity duration-1000 ${
          isCataloguedVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {isCataloguedVisible && (
          <>
            {/* Decorative sphere mask element */}
            <SphereMask />

            {/* Statistics section with platform-wise data */}
            <StatsSection />
          </>
        )}
      </div>
    </section>
  );
}
