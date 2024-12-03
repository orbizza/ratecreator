"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import { Layout } from "lucide-react";
import { Checkbox, Label } from "@ratecreator/ui";
import { platformFiltersState } from "@ratecreator/store/review";

import {
  SiInstagram,
  SiYoutube,
  SiX,
  SiReddit,
  SiTiktok,
  SiTwitch,
} from "@icons-pack/react-simple-icons";

const platformFilters = [
  {
    id: "all",
    label: "All Platforms",
    icon: Layout,
    color: "text-primary",
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: SiInstagram,
    color: "text-rose-700",
  },
  {
    id: "youtube",
    label: "YouTube",
    icon: SiYoutube,
    color: "text-red-500",
  },
  {
    id: "x",
    label: "X",
    icon: SiX,
    color: "text-neutral-900 dark:text-neutral-100",
  },
  {
    id: "reddit",
    label: "Reddit",
    icon: SiReddit,
    color: "text-orange-600",
  },
  {
    id: "tiktok",
    label: "TikTok",
    icon: SiTiktok,
    color: "text-neutral-900 dark:text-neutral-100",
  },
  {
    id: "twitch",
    label: "Twitch",
    icon: SiTwitch,
    color: "text-purple-500",
  },
];

interface PlatformCheckboxProps {}

export const PlatformCheckbox: React.FC<PlatformCheckboxProps> = () => {
  const [selectedFilters, setSelectedFilters] =
    useRecoilState(platformFiltersState);

  const handleCheckboxChange = useCallback(
    (checked: boolean, id: string) => {
      setSelectedFilters((prev) => {
        if (id === "all") {
          return checked ? ["all"] : [];
        } else {
          const withoutAll = prev.filter((item) => item !== "all");
          if (checked) {
            return [...withoutAll, id];
          } else {
            const newValues = withoutAll.filter((item) => item !== id);
            return newValues.length === 0 ? ["all"] : newValues;
          }
        }
      });
    },
    [setSelectedFilters]
  );

  return (
    <div className='flex flex-col space-y-2'>
      {platformFilters.map(({ id, label, icon: Icon, color }) => (
        <div
          key={id}
          className='flex items-center space-x-2 p-2 hover:bg-neutral-200 dark:hover:bg-accent hover:rounded-md cursor-pointer transition-colors duration-200 group'
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            id={id}
            checked={(selectedFilters as string[]).includes(id)}
            onCheckedChange={(checked) =>
              handleCheckboxChange(checked as boolean, id)
            }
            className='group-hover:border-primary'
            onClick={(e) => {
              e.stopPropagation();
            }}
          />
          <div
            className='flex items-center gap-2'
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCheckboxChange(
                !(selectedFilters as string[]).includes(id),
                id
              );
            }}
          >
            <Icon size={16} className={color} />
            <Label
              htmlFor={id}
              className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none'
              onClick={(e) => e.stopPropagation()}
            >
              {label}
            </Label>
          </div>
        </div>
      ))}
    </div>
  );
};
