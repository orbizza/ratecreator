"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Toggle } from "../ui/toggle";
import { Button } from "../ui/button";
import { IconToggle } from "../ui/icon-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

/**
 * ModeToggle Component
 *
 * A simple toggle button that switches between light and dark themes.
 * Uses a sun/moon icon that animates during the transition.
 *
 * @component
 * @returns {JSX.Element} A theme toggle button
 */
export function ModeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <Toggle
      aria-label='Toggle theme'
      pressed={resolvedTheme === "dark"}
      onPressedChange={(pressed) => setTheme(pressed ? "dark" : "light")}
      className=' data-[state=on]:bg-transparent'
      variant='outline'
    >
      {/* Sun icon for light theme */}
      <Sun className='size-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
      {/* Moon icon for dark theme */}
      <Moon className='absolute size-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
    </Toggle>
  );
}

/**
 * SystemModeToggle Component
 *
 * A dropdown menu that allows switching between light, dark, and system themes.
 * Includes animated sun/moon icons and accessible labels.
 *
 * @component
 * @returns {JSX.Element} A theme dropdown menu
 */
export function SystemModeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='icon'>
          {/* Sun icon for light theme */}
          <Sun className='size-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
          {/* Moon icon for dark theme */}
          <Moon className='absolute size-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
          <span className='sr-only'>Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {/* Theme options */}
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * SlideThemeToggle Component
 *
 * A sliding toggle switch for theme switching.
 * Uses a custom IconToggle component for the sliding animation.
 *
 * @component
 * @returns {JSX.Element} A sliding theme toggle
 */
export function SlideThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <IconToggle onToggle={(toggled) => setTheme(toggled ? "dark" : "light")} />
  );
}
