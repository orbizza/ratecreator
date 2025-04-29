/**
 * WhyRateCreator Component
 *
 * This component serves as a container for the "Why Rate Creator?" section, featuring:
 * - A prominent heading
 * - A grid of features highlighting the platform's benefits
 *
 * The component provides a clean, centered layout for showcasing
 * the key features and benefits of the Rate Creator platform.
 */

"use client";

import { RcFeatureSection } from "./why-rc-features";

export function WhyRateCreator() {
  return (
    <div className='md:pt-[2rem] lg:pt-[4rem] '>
      {/* Section heading */}
      <h1 className='mt-10  text-4xl md:text-6xl items-center text-center text-primary mb-3 md:mb-4'>
        <span className='inline-block top text-wrap'>Why Rate Creator?</span>
      </h1>

      {/* Feature grid section */}
      <RcFeatureSection />
    </div>
  );
}
