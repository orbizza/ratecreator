"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";

import {
  Button,
  ModeToggle,
  Input,
  Separator,
  PlaceholdersAndVanishInput,
} from "@ratecreator/ui";
import { MobileSideNav } from "./mobile-side-nav";
import { MainMenu } from "./main-menu";

export function Appbar() {
  const navBarStyle: React.CSSProperties = {
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)", // This is for Safari compatibility
  };

  const placeholders = [
    "Find the best content creators",
    "Search based on categories",
    "Find influencers on Instagram",
    "Who is the best Youtuber?",
    "X accounts with largest following?",
  ];

  //  Add the action to open the command search bar
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("submitted");
  };

  return (
    <header className="px-4 py-2">
      <div className="max-w-screen-4xl mx-auto fixed top-0 left-0 right-0 z-50 shadow-sm">
        <div
          className="w-full border-b-[1px] dark:border-b-neutral-600 backdrop-blur-md"
          style={navBarStyle}
        >
          <div className="w-full flex items-center justify-between  p-2">
            <div className="flex flex-row items-center justify-between mx-2 gap-x-2 ">
              <Link
                href="/"
                passHref
                className="flex flex-row items-center gap-1"
              >
                <Image
                  src="/logo.svg"
                  alt="Rate Creator"
                  width={40}
                  height={40}
                  className="w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10"
                />
                <div className="text-sm md:text-lg lg:text-2xl font-semibold">
                  RATE<span className="text-[#ff3131]"> CREATOR</span>
                </div>
              </Link>
              {/* <div className='w-full relative flex '>
                <PlaceholdersAndVanishInput
                  placeholders={placeholders}
                  onSubmit={onSubmit}
                />
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5' />
              </div> */}
              <div className="hidden lg:block xl:mx-10">
                <Button
                  variant="ghost"
                  className="items-center border-2 border-transparent rounded-md bg-secondary"
                >
                  <Search />
                  <input
                    id="SearchMD"
                    type="text"
                    placeholder="Search creators or categories ..."
                    className="flex h-8 w-[110px]  xl:w-[280px] 2xl:w-[512px] rounded-md bg-transparent hover:bg-accent hover:text-accent-foreground ring-0 focus:ring-0 focus:outline-none px-3 py-2 text-sm file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </Button>
              </div>
            </div>

            {/* Main menu and right-side components */}
            <div className="flex items-center space-x-2 lg:space-x-4 mr-0 md:mr-2 ">
              {/* Main menu (visible on lg screens) */}
              <div className="hidden lg:flex items-center gap-4">
                <MainMenu />
              </div>

              {/* Search (visible on md and larger screens) */}
              <div className="hidden md:block lg:hidden">
                <Button
                  variant="ghost"
                  className="items-center border-2 border-transparent rounded-md bg-secondary"
                >
                  <Search />
                  <input
                    id="SearchMD"
                    type="text"
                    placeholder="Search creators ..."
                    className="flex h-8 w-full rounded-md bg-transparent hover:bg-accent hover:text-accent-foreground ring-0 focus:ring-0 focus:outline-none px-3 py-2 text-sm file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </Button>
              </div>

              {/* Search icon (visible only on sm screens) */}
              <div className="block md:hidden">
                <Button variant="ghost" className="bg-secondary">
                  <Search />
                </Button>
              </div>

              {/* Mode toggle (always visible) */}

              <ModeToggle />

              {/* Mobile side nav (visible on lg screens and smaller) */}
              <div className="block lg:hidden">
                <MobileSideNav />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
