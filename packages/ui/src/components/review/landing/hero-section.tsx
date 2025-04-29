/**
 * HeroSection Component
 *
 * This component renders the main hero section of the landing page, featuring:
 * - A hero text section with search functionality
 * - An icon cloud section (visible on small screens)
 * - A call-to-action link for adding new creators
 *
 * The component uses a responsive layout that adapts to different screen sizes.
 */

"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import {
  SphereMask,
  RadialGradient,
  AnimatedGradientText,
} from "@ratecreator/ui";

import { ny } from "@ratecreator/ui/utils";

import { IconCloudSection } from "./icon-cloud-section";
import { HeroText } from "./hero-text";
import { HeroTextNew } from "./hero-text-new";

export const HeroSection = () => {
  return (
    <section className="hero-section">
      {/* Hero Text Section - Contains the main content and search functionality */}
      <div className="hero-text flex min-h-screen flex-col items-center p-6 lg:p-4 justify-center">
        <div className="flex flex-col-reverse lg:flex-row items-center p-6 lg:p-4 justify-center lg:w-full">
          {/* Search bar container - Full width on large screens */}
          <div id="hero-search-bar" className="lg:w-full">
            <HeroTextNew />
          </div>
          {/* Icon cloud section - Only visible on small screens */}
          <div className="hidden sm:flex lg:hidden">
            <IconCloudSection />
          </div>
        </div>
        {/* Radial gradient background - Currently commented out */}
        {/* <RadialGradient /> */}
        {/* <SphereMask /> */}

        {/* Call-to-action link for adding new creators */}
        <Link
          href="/wip"
          className="flex items-center mt-4 hover:opacity-80 transition-opacity"
        >
          <AnimatedGradientText>
            <span className="flex items-center">
              🎉
              <span className="mx-2 h-4 w-px shrink-0 bg-gray-700 dark:bg-gray-300" />
              <span
                className={ny(
                  `animate-gradient inline bg-gradient-to-r from-[#ffaa40] via-[#9c40ff] to-[#ffaa40] bg-[length:var(--bg-size)_100%] bg-clip-text text-transparent`,
                )}
              >
                Can&apos;t find a creator? Add them
              </span>
              <ChevronRight className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
            </span>
          </AnimatedGradientText>
        </Link>
      </div>
    </section>
  );
};
