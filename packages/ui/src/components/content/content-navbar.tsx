"use client";
import { cn } from "@ratecreator/ui/utils";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { Separator } from "@ratecreator/ui";

export const ContentNavbar = () => {
  const navItems = [
    {
      name: "Blog",
      link: "/blog",
    },
    {
      name: "Category Glossary",
      link: "/category-glossary",
    },
    {
      name: "Creator Economy Glossary",
      link: "/glossary",
    },
    {
      name: "Newsletter",
      link: "/newsletter",
    },
  ];

  return (
    <div className="w-full shadow-sm">
      <DesktopNav navItems={navItems} />
      <MobileNav navItems={navItems} />
      <Separator className="mb-4" />
    </div>
  );
};

const DesktopNav = ({ navItems }: any) => {
  const [hovered, setHovered] = useState<number | null>(null);
  return (
    <motion.div
      onMouseLeave={() => {
        setHovered(null);
      }}
      className={cn(
        "hidden md:flex flex-row self-start  items-center justify-between py-2 max-w-7xl mx-auto px-4 rounded-full relative z-[60] w-full",
        "sticky top-40 inset-x-0",
      )}
    >
      <Logo />
      <div className="md:flex flex-row flex-1 hidden items-center justify-center space-x-2 lg:space-x-2 text-sm text-zinc-600 font-medium hover:text-zinc-800 transition duration-200">
        {navItems.map((navItem: any, idx: number) => (
          <Link
            onMouseEnter={() => setHovered(idx)}
            className="text-neutral-800 dark:text-neutral-200 relative px-4 py-2"
            key={`link=${idx}`}
            href={navItem.link}
          >
            {hovered === idx && (
              <motion.div
                layoutId="hovered"
                className="w-full h-full absolute inset-0 bg-gray-100 dark:bg-neutral-800 rounded-full"
              />
            )}
            <span className="relative z-20">{navItem.name}</span>
          </Link>
        ))}
      </div>
    </motion.div>
  );
};

const MobileNav = ({ navItems }: any) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.div
        animate={{
          borderRadius: open ? "4px" : "2rem",
        }}
        key={String(open)}
        className="flex relative flex-col md:hidden w-full justify-between items-center bg-white dark:bg-neutral-950  max-w-[calc(100vw-2rem)] mx-auto px-4 py-2"
      >
        <div className="flex flex-row justify-between items-center w-full">
          <Logo />
          {open ? (
            <IconX
              className="text-black dark:text-white"
              onClick={() => setOpen(!open)}
            />
          ) : (
            <IconMenu2
              className="text-black dark:text-white"
              onClick={() => setOpen(!open)}
            />
          )}
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex rounded-lg absolute top-10 right-0 bg-neutral-100 dark:bg-neutral-800 z-20 flex-col items-start justify-start gap-4 w-max px-4 py-8"
            >
              {navItems.map((navItem: any, idx: number) => (
                <Link
                  key={`link=${idx}`}
                  href={navItem.link}
                  className="relative text-neutral-700 dark:text-neutral-300   hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:rounded-md p-2 hover:text-neutral-950 dark:hover:text-neutral-100 w-full"
                  onClick={() => setOpen(false)}
                >
                  <motion.span className="block">{navItem.name} </motion.span>
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

const Logo = () => {
  return (
    <Link
      href="/"
      className="font-normal flex space-x-2 items-center text-sm mr-4  text-black px-2 py-1  relative z-20"
    >
      <Image src="/logo.svg" alt="logo" width={30} height={30} />
      <span className="font-medium text-black dark:text-white">Go Home</span>
    </Link>
  );
};
