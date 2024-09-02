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

const stats = [
  { value: 700000, label: "YouTube Channels", icon: SiYoutube },
  { value: 1200000, label: "X Profiles", icon: SiX },
  { value: 800000, label: "Instagram Accounts", icon: SiInstagram },
  { value: 400000, label: "TikTok Profiles", icon: SiTiktok },
  { value: 70000, label: "Twitch Broadcasters", icon: SiTwitch },
  { value: 400000, label: "Reddit Communities", icon: SiReddit },
];

const formatValue = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
};

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
    <section id="stats">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="text-center space-y-4 py-4 mx-auto">
          <h2 className="text-[14px]  font-mono font-medium tracking-tight">
            PLATFORM WISE CREATORS & COMMUNITIES
          </h2>
          <h4 className="text-[42px] text-primary font-medium mb-4 text-balance max-w-3xl mx-auto tracking-tighter">
            Total Accounts Cataloged
          </h4>
        </div>
        <div
          className="grid grid-cols-1 mx-20 md:mx-auto md:grid-cols-2 lg:grid-cols-3 gap-8"
          ref={ref}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial="hidden"
              animate={controls}
              variants={itemVariants}
              custom={index}
              className="flex flex-col sm:flex-row items-center sm:items-start space-y-2 sm:space-y-0 sm:space-x-4"
            >
              <stat.icon className="w-10 h-10 lg:w-12 lg:h-12 text-primary" />
              <div className="text-center sm:text-left">
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-1">
                  <CountingNumber value={stat.value} />
                </h3>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
