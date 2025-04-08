"use client";

import { cn } from "@ratecreator/ui/utils";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useRef, useEffect } from "react";
import { Separator } from "@ratecreator/ui";
import { usePathname } from "next/navigation";

interface NavItem {
  name: string;
  link: string;
}

const navItems: NavItem[] = [
  // TODO: Enable each section when they are ready
  {
    name: "Blog",
    link: "/blog",
  },
  {
    name: "Creator Economy Glossary",
    link: "/glossary",
  },
  {
    name: "Category Glossary",
    link: "/category-glossary",
  },

  // {
  //   name: "Newsletter",
  //   link: "/newsletter",
  // },
];

export const ContentNavbar = () => {
  const navBarStyle: React.CSSProperties = {
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  };

  return (
    <div className="w-full  sticky top-[60px] z-20 mt-10" style={navBarStyle}>
      <DesktopNav navItems={navItems} />
      <MobileNav navItems={navItems} />
      <Separator className="mb-4" />
    </div>
  );
};

const DesktopNav = ({ navItems }: { navItems: NavItem[] }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  return (
    <motion.div
      onMouseLeave={() => {
        setHovered(null);
      }}
      className={cn(
        "hidden md:flex flex-row self-start items-center justify-between py-2 max-w-7xl mx-auto px-4 rounded-full relative w-full",
        "sticky top-16 z-30",
      )}
      style={{
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <Logo />
      <div className="md:flex flex-row flex-1 hidden items-center justify-end space-x-2 lg:space-x-2 text-sm text-black dark:text-white font-medium hover:text-zinc-800 transition duration-200">
        {navItems.map((navItem, idx: number) => (
          <Link
            onMouseEnter={() => setHovered(idx)}
            className="text-neutral-800 dark:text-neutral-200 relative px-4 py-2"
            key={`link=${idx}`}
            href={navItem.link}
          >
            {hovered === idx && (
              <motion.div
                layoutId="hovered"
                className="w-full h-full absolute inset-0 bg-gray-100 dark:bg-neutral-800 rounded-lg"
              />
            )}
            <span className="relative ">{navItem.name}</span>
          </Link>
        ))}
      </div>
    </motion.div>
  );
};

const MobileNav = ({ navItems }: { navItems: NavItem[] }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        open
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <>
      <motion.div
        ref={menuRef}
        animate={{
          borderRadius: open ? "4px" : "2rem",
        }}
        key={String(open)}
        className={cn(
          "flex relative flex-col md:hidden w-full justify-between items-center  max-w-[calc(100vw-2rem)] mx-auto px-4 py-2",
          " sticky top-16 z-30",
        )}
        style={{
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
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
              className="flex rounded-lg absolute top-10 right-0 bg-neutral-100/90 dark:bg-neutral-800/90 z-40 flex-col items-start justify-start gap-4 w-max px-4 py-8"
              style={{
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              {navItems.map((navItem, idx: number) => (
                <>
                  <Link
                    key={`link=${idx}`}
                    href={navItem.link}
                    className="relative text-black dark:text-white   hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:rounded-md p-2 -mt-2 -mb-2 hover:text-neutral-950 dark:hover:text-neutral-100 w-full"
                    onClick={() => setOpen(false)}
                  >
                    <motion.span className="block">{navItem.name} </motion.span>
                  </Link>
                  <Separator className="bg-neutral-400 dark:bg-neutral-700 " />
                </>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

const Logo = () => {
  const pathname = usePathname();

  const activeNavItem = navItems.find((item) => pathname.startsWith(item.link));

  return (
    <div className="font-normal flex space-x-2 items-center text-sm mr-4  text-black px-2 py-1  relative ">
      <Image src="/logo.svg" alt="logo" width={30} height={30} />
      <span className="block md:hidden font-medium text-black dark:text-white">
        {activeNavItem ? `${activeNavItem.name}` : "Help Center"}
      </span>
      <span className="hidden md:block  font-medium text-black dark:text-white">
        Help Center
      </span>
      {/* <span className='hidden  lg:block font-medium text-black dark:text-white'>
        Help Center{activeNavItem ? ` - ${activeNavItem.name}` : ""}
      </span> */}
    </div>
  );
};
