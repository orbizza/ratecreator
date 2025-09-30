"use client";
import type React from "react";
import { useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { cn } from "@ratecreator/ui/utils";

export const StickyBanner = ({
  className,
  children,
  hideOnScroll = false,
}: {
  className?: string;
  children: React.ReactNode;
  hideOnScroll?: boolean;
}) => {
  const [open, setOpen] = useState(true);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    console.log(latest);
    if (hideOnScroll && latest > 40) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  });

  return (
    <motion.div
      className={cn(
        // Ensure banner is above navbar and consistent height; shorter on mobile
        "sticky inset-x-0 top-0 z-[60] flex h-12 sm:h-16 w-full items-center justify-center bg-transparent px-4",
        className
      )}
      initial={{
        y: -100,
        opacity: 0,
      }}
      animate={{
        y: open ? 0 : -100,
        opacity: open ? 1 : 0,
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
    >
      {/* Sticky Banner content. To remove the banner globally, delete usages of
          <StickyBanner> in app layout(s) and reset the Appbar offset to top-0. */}
      {children}
    </motion.div>
  );
};
