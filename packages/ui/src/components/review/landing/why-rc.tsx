"use client";

import { RcFeatureSection } from "./why-rc-features";

export function WhyRateCreator() {
  return (
    <div className='md:pt-[2rem] lg:pt-[4rem] '>
      <h1 className='mt-10  text-4xl md:text-6xl items-center text-center text-primary mb-3 md:mb-4'>
        <span className='inline-block top text-wrap'>Why Rate Creator?</span>
      </h1>
      <RcFeatureSection />
    </div>
  );
}
