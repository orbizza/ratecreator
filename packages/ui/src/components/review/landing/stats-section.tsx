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

const stats = [
  {
    value: 700000,
    label: "YouTube Channels",
    icon: SiYoutube,
    isAvailable: true,
  },
  { value: 1200000, label: "X Profiles", icon: SiX, isAvailable: true },

  {
    value: 400000,
    label: "TikTok Profiles",
    icon: SiTiktok,
    isAvailable: true,
  },
  {
    value: 400000,
    label: "Reddit Communities",
    icon: SiReddit,
    isAvailable: true,
  },
  {
    value: 800000,
    label: "Instagram Profiles",
    icon: SiInstagram,
    isAvailable: false,
  },
  {
    value: 70000,
    label: "Twitch Broadcasters",
    icon: SiTwitch,
    isAvailable: false,
  },
];

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

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${formatValue(Number(latest.toFixed(0)))}${suffix}`;
      }
    });
  }, [springValue, prefix, suffix]);

  return <span ref={ref} />;
};

export function StatsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  const itemVariants: { hidden: Variant; visible: Variant } = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <section id='stats'>
      <div className='container mx-auto px-4 '>
        <div className='text-center space-y-4 py-4 mx-auto'>
          <h2 className='text-[14px]  font-mono font-medium tracking-tight'>
            PLATFORM WISE CREATORS & COMMUNITIES
          </h2>
          <h4 className='text-[42px] text-primary font-medium mb-4 lg:mb-8 text-balance max-w-3xl mx-auto tracking-tighter'>
            Total Accounts Catalogued
          </h4>
        </div>
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
              <stat.icon className='w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-primary' />
              <div className='text-center lg:text-left'>
                <h3 className='text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1'>
                  <CountingNumber value={stat.value} />
                </h3>
                <p className='hidden sm:block text-sm text-muted-foreground'>
                  {stat.label}
                </p>
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
