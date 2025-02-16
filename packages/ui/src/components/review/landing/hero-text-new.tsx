"use client";
import { cn } from "@ratecreator/ui/utils";
import { Manrope } from "next/font/google";
import Image from "next/image";
import React, { useCallback, useEffect, useRef } from "react";
import { RoughNotation, RoughNotationGroup } from "react-rough-notation";
import { animate, stagger, useInView } from "framer-motion";
import { IconCloudSection } from "./icon-cloud-section";
import { useKBar } from "kbar";
import { useRouter } from "next/navigation";
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "700"],
});

export function HeroTextNew() {
  const ref = useRef(null);
  const isInView = useInView(ref);
  const { query } = useKBar();
  const router = useRouter();

  const handleSerarchClick = useCallback(() => {
    query.toggle();
  }, [query]);
  return (
    <div ref={ref} className="w-full mb-0">
      <div className="flex flex-col-reverse lg:grid lg:grid-cols-5 max-h-[50rem] md:max-h-[40rem] overflow-hidden gap-2 sm:gap-4 max-w-7xl mx-auto pt-0 sm:-mt-10 lg:-mt-0 -mt-7 lg:pt-20 items-start">
        <div className="w-full lg:col-span-3 py-6 sm:py-10 md:py-10 px-4 md:px-8">
          <RoughNotationGroup show={isInView}>
            <h2
              className={cn(
                "text-2xl sm:text-4xl lg:text-6xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 text-center sm:text-left",
                manrope.className,
              )}
            >
              Your favourite{" "}
              <RoughNotation
                type="highlight"
                animationDuration={2000}
                iterations={3}
                color="#FF313180"
                multiline
              >
                <span className="text-currentColor">content creators</span>
              </RoughNotation>{" "}
              are now available for{" "}
              <RoughNotation
                type="underline"
                animationDuration={2000}
                iterations={10}
                color="#FF3131"
              >
                reviews
              </RoughNotation>
            </h2>

            <p className="text-neutral-500 dark:text-neutral-400 text-sm md:text-lg max-w-2xl mt-4 md:mt-8 text-center sm:text-left">
              Rate Creator offers an extensive catalog of categories and
              subcategories, making it easy to search, and review{" "}
              <RoughNotation
                type="underline"
                animationDuration={2000}
                iterations={3}
                color="#FF3131"
              >
                3.5 million+
              </RoughNotation>{" "}
              creators and communities.
            </p>
          </RoughNotationGroup>
          <div className="flex sm:flex-row flex-col gap-4 items-center mt-8 [perspective:800px]">
            <button
              onClick={handleSerarchClick}
              className="px-4 py-2 rounded-lg bg-[#FF3131] w-full sm:w-auto font-bold text-black text-base hover:[transform:rotateX(10deg)] transition duration-200 origin-left hover:shadow-lg"
            >
              Search{" "}
              <kbd className="ml-2 bg-neutral-900 text-white px-1.5 py-0.5 rounded">
                ⌘
              </kbd>
              +
              <kbd className=" bg-neutral-900 text-white px-1.5 py-0.5 rounded">
                K
              </kbd>
            </button>
            <button
              className="text-black dark:text-white hover:border-[#FF3131] border border-transparent px-4 py-2 rounded-lg text-base transition duration-200 w-full sm:w-auto"
              onClick={() => router.push("/search")}
            >
              Write a review
            </button>
          </div>
        </div>
        <div className="hidden lg:flex lg:col-span-2 justify-end overflow-hidden h-full w-full relative flex-shrink-0">
          <IconCloudSection />
        </div>
        <div className="sm:hidden w-full flex justify-center overflow-hidden relative flex-shrink-0 -mb-4 sm:mb-0">
          <IconCloudSection />
        </div>
      </div>
    </div>
  );
}
