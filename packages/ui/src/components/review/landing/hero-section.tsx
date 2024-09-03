"use client";

import React from "react";

import { IconCloudSection } from "./icon-cloud-section";
import { HeroText } from "./hero-text";
import RadialGradient from "../../ui/radial-gradient";
import { StatsSection } from "./stats-section";

export const HeroSection = () => {
  return (
    <section className="hero-section">
      <div className="flex flex-col-reverse md:flex-row items-center p-2 lg:p-10">
        <div className="lg:w-3/5">
          <HeroText />
        </div>
        <div className="lg:w-2/5">
          <IconCloudSection />
        </div>
      </div>
      <RadialGradient />
      <StatsSection />
    </section>
  );
};
