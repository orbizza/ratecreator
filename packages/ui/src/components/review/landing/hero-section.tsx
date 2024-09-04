"use client";

import React, { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

import {
  SphereMask,
  LinearGradient,
  RadialGradient,
  AnimatedGradientText,
  Separator,
} from "@ratecreator/ui";

import { ny } from "@ratecreator/ui/utils";

import { IconCloudSection } from "./icon-cloud-section";
import { HeroText } from "./hero-text";
import { StatsSection } from "./stats-section";

export const HeroSection = () => {
  const [isCataloguedVisible, setIsCataloguedVisible] = useState(false);

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
    <>
      <section className='hero-section'>
        {/* Hero Text Section */}
        <div className='hero-text flex h-screen flex-col items-center p-6 lg:p-4 justify-center'>
          <div className=' flex  flex-col-reverse lg:flex-row items-center p-6 lg:p-4 justify-center'>
            <div className=''>
              <HeroText />
            </div>
            <div className=''>
              <IconCloudSection />
            </div>
          </div>
          {/* Radial gradient background */}
          <RadialGradient />
          <SphereMask />
          <Link href='/add-creator'>
            <AnimatedGradientText>
              🎉 <hr className='mx-2 h-4 w-px shrink-0 bg-gray-300' />{" "}
              <span
                className={ny(
                  `animate-gradient inline bg-gradient-to-r from-[#ffaa40] via-[#9c40ff] to-[#ffaa40] bg-[length:var(--bg-size)_100%] bg-clip-text text-transparent`
                )}
              >
                Can&apos;t find a creator? Add them!
              </span>
              <ChevronRight className='ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5' />
            </AnimatedGradientText>
          </Link>
        </div>
        {/* <LinearGradient /> */}
      </section>

      <section id='catalogued-section'>
        <div
          className={`total-accounts w-full mt-0 p-8 transition-opacity duration-1000 my-[5rem] ${
            isCataloguedVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          {isCataloguedVisible && (
            <>
              <SphereMask />
              <StatsSection />
              {/* <LinearGradient /> */}
            </>
          )}
        </div>
      </section>
    </>
  );
};
