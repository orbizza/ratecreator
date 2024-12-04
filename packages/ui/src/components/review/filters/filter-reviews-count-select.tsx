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

import { reviewCountCheckbox } from "@ratecreator/store";
import { reviewCountFiltersState } from "@ratecreator/store/review";
import { MessagesSquare } from "lucide-react";
import { Info } from "lucide-react";

export const ReviewCountCheckbox: React.FC = () => {
  const [selectedFilters, setSelectedFilters] = useRecoilState(
    reviewCountFiltersState
  );

  return (
    <div className='flex flex-col mb-2 gap-y-2'>
      <div className='flex flex-row gap-x-2 items-center'>
        <MessagesSquare size={16} />
        <span className='text-[16px]'>Review Count</span>
        <Info size={14} className='text-muted-foreground' />
      </div>
      <Select value={selectedFilters} onValueChange={setSelectedFilters}>
        <SelectTrigger className='shadow-md bg-neutral-50  dark:bg-neutral-950 '>
          <SelectValue placeholder='Select filter' />
        </SelectTrigger>
        <SelectContent className='bg-neutral-50  dark:bg-neutral-950'>
          <SelectGroup>
            {reviewCountCheckbox.map((item) => (
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
