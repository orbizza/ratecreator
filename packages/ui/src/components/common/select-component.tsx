"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@ratecreator/ui";

import { capitalizeEachWord } from "@ratecreator/db/utils";

interface SelectComponentProps {
  placeholder: string;
  items: string[];
  onSelect: (item: string) => void;
  selectedItem: string;
}

export const SelectComponent = ({
  placeholder,
  items,
  onSelect,
  selectedItem,
}: SelectComponentProps) => {
  const handleSelect = (item: string) => {
    onSelect(capitalizeEachWord(item));
  };

  return (
    <Select onValueChange={handleSelect}>
      <div
        className={`${
          selectedItem && selectedItem !== placeholder
            ? "text-green-600 dark:text-green-500 rounded-md bg-neutral-100 dark:bg-neutral-800"
            : "text-neutral-200 dark:text-neutral-400"
        }`}
      >
        <SelectTrigger className="ml-2 bg-transparent border-transparent ring-0 outline-none focus:ring-0 focus:outline-none  text-sm md:text-sm">
          {capitalizeEachWord(selectedItem) || capitalizeEachWord(placeholder)}
        </SelectTrigger>{" "}
      </div>
      <SelectContent className="pl-0 bg-neutral-800 border-transparent ring-0 outline-none focus:ring-0 focus:outline-none">
        <SelectGroup className="pl-0 bg-neutral-800 ">
          {items.map((item) => (
            <SelectItem
              key={item}
              className="text-neutral-200 border-transparent hover:bg-neutral-950 hover:text-neutral-200 text-sm md:text-sm font-light !justify-start focus:ring-0 focus:outline-none focus:bg-neutral-950 focus:text-neutral-200 pr-5 "
              value={item}
              onClick={() => handleSelect(item)}
            >
              {capitalizeEachWord(item)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
