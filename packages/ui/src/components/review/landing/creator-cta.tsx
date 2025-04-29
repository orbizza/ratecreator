/**
 * CreatorCTA Component
 *
 * This component displays a call-to-action section for creators, featuring:
 * - Animated social media platform cards in a marquee layout
 * - A centered message asking if the user is a creator
 * - A call-to-action button to get started
 *
 * The component uses Framer Motion for animations and includes a dynamic
 * shuffling of social media platform cards to create an engaging visual effect.
 */

"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion, useAnimation, useInView } from "framer-motion";
import Link from "next/link";
import {
  Youtube,
  ChevronRight,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Twitch,
} from "lucide-react";

import { Button, Marquee } from "@ratecreator/ui";
import { cn, ny } from "@ratecreator/ui/utils";

/**
 * Array of social media platform tiles with their icons and background gradients
 * Each tile represents a platform that creators can be rated on
 */
const tiles = [
  {
    icon: <Facebook className="size-full" />,
    bg: (
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible rounded-full bg-gradient-to-r from-orange-600 via-rose-600 to-violet-600 opacity-70 blur-[20px] filter"></div>
    ),
  },
  {
    icon: <Twitter className="size-full" />,
    bg: (
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 opacity-70 blur-[20px] filter"></div>
    ),
  },
  {
    icon: <Youtube className="size-full" />,
    bg: (
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible rounded-full bg-gradient-to-r from-orange-600 via-rose-600 to-violet-600 opacity-70 blur-[20px] filter"></div>
    ),
  },
  {
    icon: <Instagram className="size-full" />,
    bg: (
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible rounded-full bg-gradient-to-r from-green-500 via-teal-500 to-emerald-600 opacity-70 blur-[20px] filter"></div>
    ),
  },
  {
    icon: <Twitch className="size-full" />,
    bg: (
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600 opacity-70 blur-[20px] filter"></div>
    ),
  },
  {
    icon: <Linkedin className="size-full" />,
    bg: (
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible rounded-full bg-gradient-to-r from-gray-600 via-gray-500 to-gray-400 opacity-70 blur-[20px] filter"></div>
    ),
  },
];

/**
 * Utility function to shuffle an array
 * Used to randomize the order of social media platform tiles
 */
const shuffleArray = (array: any[]) => {
  let currentIndex = array.length,
    randomIndex;
  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
};

/**
 * Card Component
 * Renders an individual social media platform card with animation
 */
const Card = (card: { icon: JSX.Element; bg: JSX.Element }) => {
  const id = useId();
  const controls = useAnimation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) {
      controls.start({
        opacity: 1,
        transition: { delay: Math.random() * 2, ease: "easeOut", duration: 1 },
      });
    }
  }, [controls, inView]);

  return (
    <motion.div
      key={id}
      ref={ref}
      initial={{ opacity: 0 }}
      animate={controls}
      className={cn(
        "relative size-20 cursor-pointer overflow-hidden rounded-2xl border-none p-4",
        // light styles
        "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
        // dark styles
        "transform-gpu dark:bg-transparent dark:[border:1px_solid_rgba(255,255,255,.1)] ",
      )}
    >
      {card.icon}
      {card.bg}
    </motion.div>
  );
};

/**
 * Main CreatorCTA Component
 * Renders the call-to-action section with animated social media platform cards
 */
export function CreatorCTA() {
  // State for storing shuffled versions of the tiles array
  const [randomTiles1, setRandomTiles1] = useState<typeof tiles>([]);
  const [randomTiles2, setRandomTiles2] = useState<typeof tiles>([]);
  const [randomTiles3, setRandomTiles3] = useState<typeof tiles>([]);
  const [randomTiles4, setRandomTiles4] = useState<typeof tiles>([]);

  // Shuffle tiles on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Ensures this runs client-side
      setRandomTiles1(shuffleArray([...tiles]));
      setRandomTiles2(shuffleArray([...tiles]));
      setRandomTiles3(shuffleArray([...tiles]));
      setRandomTiles4(shuffleArray([...tiles]));
    }
  }, []);

  return (
    <section id="cta">
      <div className="py-5 sm:py-14">
        <div className="container flex w-full flex-col items-center justify-center p-4">
          <div className="relative flex w-full  flex-col items-center justify-center overflow-hidden rounded-[2rem] border-none">
            {/* Animated marquee rows of social media platform cards */}
            <Marquee
              reverse
              className="-delay-[200ms] [--duration:20s]"
              repeat={4}
            >
              {randomTiles1.map((review, idx) => (
                <Card key={idx} {...review} />
              ))}
            </Marquee>
            <Marquee reverse className="[--duration:30s]" repeat={4}>
              {randomTiles2.map((review, idx) => (
                <Card key={idx} {...review} />
              ))}
            </Marquee>
            <Marquee
              reverse
              className="-delay-[200ms] [--duration:20s]"
              repeat={4}
            >
              {randomTiles3.map((review, idx) => (
                <Card key={idx} {...review} />
              ))}
            </Marquee>
            <Marquee reverse className="[--duration:30s]" repeat={4}>
              {randomTiles4.map((review, idx) => (
                <Card key={idx} {...review} />
              ))}
            </Marquee>

            {/* Centered CTA content */}
            <div className="absolute z-10">
              <div className="z-10 flex flex-col items-center text-center text-primary">
                <h1 className=" text-3xl md:text-5xl text-primary font-bold my-[2rem] lg:text-7xl">
                  Are you a creator?
                </h1>
                <Button
                  variant={"outline"}
                  className="rounded-full bg-secondary-foreground text-secondary "
                >
                  ✨ Get Started
                  <ChevronRight className="ml-1 size-4 transition-all duration-300 ease-out group-hover:translate-x-1" />
                </Button>
              </div>
              <div className="absolute inset-0 -z-10 rounded-full bg-background opacity-40 blur-xl" />
            </div>
            <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-b from-transparent to-background to-70% blur-xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
