/**
 * StatsSection Component
 *
 * This component displays platform-wise statistics about creators and communities, featuring:
 * - Animated counting numbers for each statistic
 * - Platform icons and labels
 * - Responsive grid layout
 * - Scroll-based animations
 *
 * The component uses Framer Motion for animations and includes a custom
 * CountingNumber component for smooth number transitions.
 */

"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useAnimation,
  useInView,
  useMotionValue,
  useSpring,
  Variant,
} from "framer-motion";
import React from "react";
import {
  SiYoutube,
  SiX,
  SiInstagram,
  SiTiktok,
  SiTwitch,
  SiReddit,
} from "react-icons/si";
import { formatValue } from "@ratecreator/db/utils";

/**
 * Array of platform statistics with their values and availability status
 */
const stats = [
  {
    value: 710000,
    label: "YouTube Channels",
    icon: SiYoutube,
    isAvailable: true,
  },
  { value: 1196918, label: "X Profiles", icon: SiX, isAvailable: true },

  {
    value: 316935,
    label: "TikTok Profiles",
    icon: SiTiktok,
    isAvailable: true,
  },
  {
    value: 370079,
    label: "SubReddit Communities",
    icon: SiReddit,
    isAvailable: true,
  },
  {
    value: 810152,
    label: "Instagram Profiles",
    icon: SiInstagram,
    isAvailable: false,
  },
  {
    value: 72671,
    label: "Twitch Broadcasters",
    icon: SiTwitch,
    isAvailable: false,
  },
];

/**
 * CountingNumber Component
 * Renders a number that animates from 0 to its target value
 *
 * @param value - The target number to count up to
 * @param duration - Duration of the animation in seconds
 * @param prefix - Optional text to show before the number
 * @param suffix - Optional text to show after the number
 */
const CountingNumber = ({
  value,
  duration = 2,
  prefix = "",
  suffix = "",
}: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  });

  // Set the target value when the component mounts or value changes
  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  // Update the displayed number as the spring value changes
  useEffect(() => {
    springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${formatValue(Number(latest.toFixed(0)))}${suffix}`;
      }
    });
  }, [springValue, prefix, suffix]);

  return <span ref={ref} />;
};

/**
 * Main StatsSection Component
 * Renders the statistics grid with animated counting numbers
 */
export function StatsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const controls = useAnimation();

  // Start animation when the section comes into view
  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  // Animation variants for each stat item
  const itemVariants: { hidden: Variant; visible: Variant } = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <section id='stats'>
      <div className='container mx-auto px-1 sm:px-4 '>
        {/* Section header */}
        <div className='text-center space-y-4 py-4 mx-auto'>
          <h2 className='text-[14px]  font-mono font-medium tracking-tight'>
            PLATFORM WISE CREATORS & COMMUNITIES
          </h2>
          <h4 className='text-[42px] text-primary font-medium mb-4 lg:mb-8 text-balance max-w-3xl mx-auto tracking-tighter'>
            Total Accounts Catalogued
          </h4>
        </div>

        {/* Statistics grid */}
        <div
          className='grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8'
          ref={ref}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial='hidden'
              animate={controls}
              variants={itemVariants}
              custom={index}
              className='flex flex-col items-center space-y-2 px-2 sm:px-4 lg:flex-row lg:items-start lg:space-y-0 lg:space-x-4'
            >
              {/* Platform icon */}
              <stat.icon className='w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-primary' />

              {/* Stat content */}
              <div className='text-center lg:text-left'>
                <h3 className='text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1'>
                  <CountingNumber value={stat.value} />
                </h3>
                <p className='hidden sm:block text-sm text-muted-foreground'>
                  {stat.label}
                </p>
                {/* Coming soon indicator for unavailable platforms */}
                {!stat.isAvailable && (
                  <p className='text-xs sm:text-sm text-yellow-300 dark:text-yellow-500 italic'>
                    Coming Soon
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
