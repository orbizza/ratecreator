"use client";

import React from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@ratecreator/ui/utils";
import { useTheme } from "next-themes";

const IconToggle = ({
  onToggle,
}: {
  onToggle?: (toggled: boolean) => void;
}) => {
  const { theme, setTheme } = useTheme();

  const handleToggle = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    if (onToggle) {
      onToggle(newTheme === "dark");
    }
  };

  return (
    <button
      className={`relative h-7 w-12 cursor-pointer rounded-full duration-200`}
      onClick={handleToggle}
      style={{
        backgroundColor: theme === "dark" ? "#fb3a5d" : "#24252d50",
      }}
    >
      <span
        className={cn(
          `absolute left-0 top-0 flex items-center justify-center rounded-full bg-white shadow-lg transition-all duration-200`,
          theme === "dark"
            ? "translate-x-full transform"
            : "translate-x-0 transform",
          theme === "dark" ? "h-5 w-5" : "h-4 w-4",
          theme === "dark" ? "m-1" : "m-1.5"
        )}
      >
        <span className='relative flex h-full w-full'>
          <Moon
            size={13}
            strokeWidth={3}
            className={cn(
              "absolute left-0 top-0 h-full w-full p-1 text-red-500 transition-opacity duration-200",
              theme === "dark" ? "opacity-100" : "opacity-0"
            )}
          />
          <Sun
            size={13}
            strokeWidth={3}
            className={cn(
              "absolute left-0 top-0 h-full w-full p-0.5 text-[#24252d50] transition-opacity duration-200",
              theme === "dark" ? "opacity-0" : "opacity-100"
            )}
          />
        </span>
      </span>
    </button>
  );
};

export { IconToggle };
