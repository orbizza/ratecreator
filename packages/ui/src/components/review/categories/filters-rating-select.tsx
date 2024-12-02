"use client";
import React, { useState } from "react";
import { Star, Info, Sparkles, StarHalf } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Checkbox,
  Label,
} from "@ratecreator/ui";

const ratingCheckbox = [
  {
    id: "all",
    label: "All",
    stars: null,
    color: "text-primary",
  },
  {
    id: "5",
    label: "All 5.0 stars",
    stars: 5,
    color: "text-green-500",
  },
  {
    id: "4-4.9",
    label: "4.0 - 4.9 stars",
    stars: 4,
    color: "text-emerald-500",
  },
  {
    id: "3-3.9",
    label: "3.0 - 3.9 stars",
    stars: 3,
    color: "text-yellow-500",
  },
  {
    id: "2-2.9",
    label: "2.0 - 2.9 stars",
    stars: 2,
    color: "text-orange-500",
  },
  {
    id: "1-1.9",
    label: "1.0 - 1.9 stars",
    stars: 1,
    color: "text-red-500",
  },
  {
    id: "0-0.9",
    label: "0.0 - 1.0 star",
    stars: 0,
    color: "text-red-600",
  },
];

const RatingStars: React.FC<{ count: number | null; color: string }> = ({
  count,
  color,
}) => {
  if (count === null) return null;
  else if (count === 0)
    return (
      <div className='flex gap-0.5'>
        <div className='flex items-center'>
          <StarHalf
            size={12}
            className={`fill-current ${color} transform translate-x-[6px]`}
          />
          <StarHalf
            rotate={90}
            size={12}
            className={`fill-current transform scale-x-[-1] -translate-x-[6px]`}
          />
        </div>

        {Array.from({ length: 4 }).map((_, index) => (
          <Star
            key={index}
            size={12}
            className={`${
              index < 0
                ? `fill-current ${color}`
                : "fill-current -translate-x-[6px]"
            }`}
          />
        ))}
      </div>
    );

  return (
    <div className='flex gap-0.5'>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={12}
          className={`${
            index < count ? `fill-current ${color}` : "fill-current  "
          }`}
        />
      ))}
    </div>
  );
};

export const RatingCheckbox: React.FC = () => {
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
      {ratingCheckbox.map((item) => (
        <div
          key={item.id}
          className='flex items-center space-x-2 p-2 hover:bg-neutral-200 dark:hover:bg-accent hover:rounded-md cursor-pointer transition-colors duration-200 group'
          onClick={() =>
            handleCheckboxChange(!selectedFilters.includes(item.id), item.id)
          }
        >
          <Checkbox
            id={item.id}
            checked={selectedFilters.includes(item.id)}
            className='group-hover:border-primary pointer-events-none'
          />
          <div className='flex items-center gap-2'>
            <Label
              htmlFor={item.id}
              className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70  cursor-pointer select-none ${item.color}`}
            >
              {item.label}
            </Label>
            {item.stars !== 0 ? (
              <RatingStars count={item.stars} color={item.color} />
            ) : (
              <RatingStars count={0} color={item.color} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
