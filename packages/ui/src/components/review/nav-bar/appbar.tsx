"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import posthog from "posthog-js";

import {
  Button,
  ModeToggle,
  PlaceholdersAndVanishInput,
} from "@ratecreator/ui";
import { MobileSideNav } from "./mobile-side-nav";
import { MainMenu } from "./main-menu";
import { usePathname } from "next/navigation";

import { SearchPlaceholders } from "@ratecreator/store";
import { useKBar } from "kbar";
import { useAuth } from "@clerk/nextjs";

export function Appbar() {
  const [isHeroVisible, setIsHeroVisible] = useState(true);
  const [isLandingPage, setIsLandingPage] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsLandingPage(pathname === "/");
  }, [pathname]);

  useEffect(() => {
    if (!isLandingPage) {
      setIsHeroVisible(false);
      return;
    }

    const handleScroll = (entries: IntersectionObserverEntry[]) => {
      const heroEntry = entries[0];
      setIsHeroVisible(heroEntry.isIntersecting);
    };

    const observer = new IntersectionObserver(handleScroll, {
      threshold: 0.1,
    });

    const heroSection = document.querySelector("#hero-search-bar");
    if (heroSection) {
      observer.observe(heroSection);
    }

    return () => {
      if (heroSection) observer.unobserve(heroSection);
    };
  }, [isLandingPage]);

  const navBarStyle: React.CSSProperties = {
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  };

  const placeholders = SearchPlaceholders;

  const showSearchBar = isLandingPage ? !isHeroVisible : true;

  const { query } = useKBar();

  const handleSerarchClick = useCallback(() => {
    console.log({ event: "Search bar clicked" });
    posthog.capture("Search Bar Clicked", { property: "value" });
    query.toggle();
  }, [query]);

  const { isSignedIn, signOut } = useAuth();

  return (
    <header className='px-4 py-2'>
      <div className='max-w-screen-4xl mx-auto fixed top-0 left-0 right-0 z-50 shadow-sm'>
        <div
          className='w-full border-b-[1px] dark:border-b-neutral-600 backdrop-blur-md'
          style={navBarStyle}
        >
          <div className='w-full flex flex-row items-center justify-between p-2'>
            {/* Logo */}
            <div className='flex flex-row items-center gap-2 mx-2 mr-4'>
              <Link href='/' passHref className='flex items-center gap-1'>
                <Image
                  src='/logo.svg'
                  alt='Rate Creator'
                  width={40}
                  height={40}
                  className='w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10'
                />
                <span className='text-lg  xl:text-2xl font-semibold whitespace-nowrap'>
                  RATE<span className='text-[#ff3131]'> CREATOR</span>
                </span>
              </Link>
            </div>

            {/* Search Bar */}
            {showSearchBar && (
              <div className='hidden lg:block mx-[50px] xl:mx-20 w-full relative items-center justify-center'>
                <PlaceholdersAndVanishInput
                  placeholders={placeholders}
                  onClick={handleSerarchClick}
                />
              </div>
            )}

            {/* Additional Components */}
            <div className='flex items-center space-x-2 lg:space-x-2 mr-0 md:mr-2'>
              <div className='hidden 2xl:flex items-center'>
                <MainMenu />
              </div>
              {showSearchBar && (
                <div className='block lg:hidden'>
                  <Button
                    variant='ghost'
                    size={"icon"}
                    onClick={handleSerarchClick}
                  >
                    <Search />
                  </Button>
                </div>
              )}

              {/* {!isSignedIn && <ModeToggle />} */}
              <ModeToggle />

              <div className='block 2xl:hidden'>
                <MobileSideNav />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Appbar;
