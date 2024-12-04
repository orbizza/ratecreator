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
import { Info, Video } from "lucide-react";
import { videoCountCheckbox } from "@ratecreator/store";
import { videoCountFiltersState } from "@ratecreator/store/review";

export const VideoCountCheckbox: React.FC = () => {
  const [selectedFilters, setSelectedFilters] = useRecoilState(
    videoCountFiltersState
  );

  return (
    <div className='flex flex-col mb-2 gap-y-2'>
      <div className='flex flex-row gap-x-2 items-center'>
        <Video size={16} />
        <span className='text-[16px]'>Video Count</span>
        <Info size={14} className='text-muted-foreground' />
      </div>
      <Select value={selectedFilters} onValueChange={setSelectedFilters}>
        <SelectTrigger className='shadow-md bg-neutral-50  dark:bg-neutral-950 '>
          <SelectValue placeholder='Select filter' />
        </SelectTrigger>
        <SelectContent className='bg-neutral-50  dark:bg-neutral-950'>
          <SelectGroup>
            {videoCountCheckbox.map((item) => (
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
