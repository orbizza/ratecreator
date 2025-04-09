"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { AnimatedGradientText } from "@ratecreator/ui";

import { ny } from "@ratecreator/ui/utils";

import { IconCloudSection } from "./icon-cloud-section";

import { HeroTextNew } from "./hero-text-new";
export const HeroSection = () => {
  return (
    <section className='hero-section'>
      {/* Hero Text Section */}
      <div className='hero-text flex min-h-screen flex-col items-center p-6 lg:p-4 justify-center'>
        <div className='flex flex-col-reverse lg:flex-row items-center p-6 lg:p-4 justify-center lg:w-full'>
          <div id='hero-search-bar' className='lg:w-full'>
            <HeroTextNew />
          </div>
          <div className='hidden sm:flex lg:hidden'>
            <IconCloudSection />
          </div>
        </div>

        <Link
          href='/wip'
          className='flex items-center mt-4 hover:opacity-80 transition-opacity'
        >
          <AnimatedGradientText>
            <span className='flex items-center'>
              🎉
              <span className='mx-2 h-4 w-px shrink-0 bg-gray-700 dark:bg-gray-300' />
              <span
                className={ny(
                  `animate-gradient inline bg-gradient-to-r from-[#ffaa40] via-[#9c40ff] to-[#ffaa40] bg-[length:var(--bg-size)_100%] bg-clip-text text-transparent`
                )}
              >
                Can&apos;t find a creator? Add them
              </span>
              <ChevronRight className='ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5' />
            </span>
          </AnimatedGradientText>
        </Link>
      </div>
    </section>
  );
};
