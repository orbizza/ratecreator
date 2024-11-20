// components/FilterSidebar.tsx

"use client";
import React, { useEffect, useState } from "react";
import { AppWindow, BadgeCheck, Info, SlidersHorizontal } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ratecreator/ui";

import RatingSelect from "./filters-rating-select";
import { PlatformSelect } from "./filter-platform-select";
import { FollowersSelect } from "./filter-follower-select";
import { VideoCountSelect } from "./filter-video-select";

interface FilterSidebarProps {}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }
  return (
    <div className="rounded-lg overflow-hidden shadow-md bg-gray-50 text-foreground dark:bg-stone-900 dark:text-foreground p-4  space-y-4">
      <div className="flex flex-row items-center text-primary text-lg gap-x-2">
        <SlidersHorizontal size={20} />
        <p className="text-xl">Filters</p>
      </div>
      <div className="flex flex-col gap-y-1 mx-auto">
        <div className="flex flex-row gap-x-2 items-center">
          <AppWindow size={16} />
          <span className="text-[16px]">Platforms</span>
          <Info size={14} className="text-muted-foreground" />
        </div>
        <PlatformSelect />
      </div>

      <RatingSelect />
      <FollowersSelect />
      <VideoCountSelect />
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Countries" />
        </SelectTrigger>
        <SelectContent></SelectContent>
      </Select>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent></SelectContent>
      </Select>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Reviews Count" />
        </SelectTrigger>
        <SelectContent></SelectContent>
      </Select>
      <div className="flex flex-col mb-2 gap-y-1 mx-auto">
        <div className="flex flex-row gap-x-2 items-center">
          <BadgeCheck size={16} />
          <span className="text-[16px]">Claimed</span>
          <Info size={14} className="text-muted-foreground" />
        </div>
        <Select defaultValue={"false"}>
          <SelectTrigger>
            <SelectValue placeholder="Claimed" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Yes</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
