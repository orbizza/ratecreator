"use client";

import React from "react";
import { useRecoilState } from "recoil";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ratecreator/ui";
import { followersCheckbox } from "@ratecreator/store";
import { followersFiltersState } from "@ratecreator/store/review";
import { Info, Users } from "lucide-react";

export const FollowersCheckbox: React.FC = () => {
  const [selectedFilters, setSelectedFilters] = useRecoilState(
    followersFiltersState
  );

  return (
    <div className='flex flex-col mb-2 gap-y-2'>
      <div className='flex flex-row gap-x-2 items-center'>
        <Users size={16} />
        <span className='text-[16px]'>Followers</span>
        <Info size={14} className='text-muted-foreground' />
      </div>
      <Select value={selectedFilters} onValueChange={setSelectedFilters}>
        <SelectTrigger className='shadow-md bg-neutral-50  dark:bg-neutral-950 '>
          <SelectValue placeholder='Select filter' />
        </SelectTrigger>
        <SelectContent className='bg-neutral-50  dark:bg-neutral-950'>
          <SelectGroup>
            {followersCheckbox.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};
