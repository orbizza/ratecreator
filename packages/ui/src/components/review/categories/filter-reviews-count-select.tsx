"use client";
import React, { useState } from "react";
import { useRecoilState } from "recoil";
import {
  Checkbox,
  Label,
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
    // <div className='flex flex-col space-y-2'>
    //   {reviewCountCheckbox.map((item) => (
    //     <div
    //       key={item.id}
    //       className='flex items-center space-x-2 p-2 dark:hover:bg-accent hover:bg-neutral-200 hover:rounded-md cursor-pointer transition-colors duration-200 group'
    //     >
    //       <Checkbox
    //         id={item.id}
    //         checked={selectedFilters.includes(item.id)}
    //         onCheckedChange={(checked) =>
    //           handleCheckboxChange(checked as boolean, item.id)
    //         }
    //         className='group-hover:border-primary'
    //       />
    //       <Label
    //         htmlFor={item.id}
    //         className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none w-full'
    //       >
    //         {item.label}
    //       </Label>
    //     </div>
    //   ))}
    // </div>
    <div className='flex flex-col mb-2 gap-y-1'>
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
