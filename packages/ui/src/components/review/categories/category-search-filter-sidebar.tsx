// components/FilterSidebar.tsx
import React from "react";
import { Category } from "@ratecreator/types/review";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ratecreator/ui";
import { SlidersHorizontal } from "lucide-react";

interface FilterSidebarProps {}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({}) => {
  return (
    <div className='rounded-lg overflow-hidden shadow-md bg-gray-50 text-foreground dark:bg-stone-900 dark:text-foreground p-4  space-y-4'>
      <div className='flex flex-row items-center mb-2 text-primary text-lg gap-x-2'>
        <SlidersHorizontal size={20} />
        <p>Filters</p>
      </div>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder='Platforms' />
        </SelectTrigger>
        <SelectContent>{/* Add platform options */}</SelectContent>
      </Select>

      <Select>
        <SelectTrigger>
          <SelectValue placeholder='Rating' />
        </SelectTrigger>
        <SelectContent>{/* Add rating options */}</SelectContent>
      </Select>

      <Select>
        <SelectTrigger>
          <SelectValue placeholder='Sub Count' />
        </SelectTrigger>
        <SelectContent>{/* Add sub count options */}</SelectContent>
      </Select>

      <Select>
        <SelectTrigger>
          <SelectValue placeholder='Video Count' />
        </SelectTrigger>
        <SelectContent>{/* Add video count options */}</SelectContent>
      </Select>

      <Select>
        <SelectTrigger>
          <SelectValue placeholder='Countries' />
        </SelectTrigger>
        <SelectContent>{/* Add country options */}</SelectContent>
      </Select>

      <Select>
        <SelectTrigger>
          <SelectValue placeholder='Claimed' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='true'>Yes</SelectItem>
          <SelectItem value='false'>No</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
