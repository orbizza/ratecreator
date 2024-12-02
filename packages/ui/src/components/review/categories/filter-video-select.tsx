"use client";
import React, { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Checkbox,
  Label,
} from "@ratecreator/ui";
import { Info, Video } from "lucide-react";
import { videoCountCheckbox } from "@ratecreator/store";

export const VideoCountCheckbox: React.FC = () => {
  const [selectedFilters, setSelectedFilters] = useState<string[]>(["all"]);

  const handleCheckboxChange = (checked: boolean, id: string) => {
    setSelectedFilters((prev) => {
      if (id === "all") {
        return checked ? ["all"] : [];
      } else {
        const withoutAll = prev.filter((item) => item !== "all");

        if (checked) {
          return [...withoutAll, id];
        } else {
          return withoutAll.filter((item) => item !== id);
        }
      }
    });
  };

  return (
    <div className='flex flex-col space-y-2'>
      {videoCountCheckbox.map((item) => (
        <div
          key={item.id}
          className='flex items-center space-x-2 p-2 dark:hover:bg-accent hover:bg-neutral-200 hover:rounded-md cursor-pointer transition-colors duration-200 group'
        >
          <Checkbox
            id={item.id}
            checked={selectedFilters.includes(item.id)}
            onCheckedChange={(checked) =>
              handleCheckboxChange(checked as boolean, item.id)
            }
            className='group-hover:border-primary'
          />
          <Label
            htmlFor={item.id}
            className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none w-full'
          >
            {item.label}
          </Label>
        </div>
      ))}
    </div>
  );
};
