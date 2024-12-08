"use client";
import React from "react";
import { Star, Info, Sparkles, StarHalf } from "lucide-react";
import { useRecoilState } from "recoil";
import {
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ratecreator/ui";

import { ratingFiltersState } from "@ratecreator/store/review";

const ratingCheckbox = [
  {
    id: "all",
    label: "All Ratings",
    stars: null,
    color: "",
  },
  {
    id: "5",
    label: "All 5.0 stars",
    stars: 5,
    color: "text-emerald-500",
  },
  {
    id: "4-4.9",
    label: "4.0 - 4.9 stars",
    stars: 4,
    color: "text-green-500",
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
      <div className="flex gap-0.5">
        <div className="flex items-center">
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
    <div className="flex gap-0.5">
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
  const [selectedFilters, setSelectedFilters] =
    useRecoilState(ratingFiltersState);

  return (
    <div className="flex flex-col mb-2 gap-y-2">
      <div className="flex flex-row gap-x-2 items-center">
        <Sparkles size={16} />
        <span className="text-[16px]">Ratings</span>
        <Info size={14} className="text-muted-foreground" />
      </div>
      <Select value={selectedFilters} onValueChange={setSelectedFilters}>
        <SelectTrigger className="shadow-md bg-neutral-50  dark:bg-neutral-950 dark:text-foreground">
          <SelectValue placeholder="Select filter" />
        </SelectTrigger>
        <SelectContent className="bg-neutral-50  dark:bg-neutral-950">
          <SelectGroup>
            {ratingCheckbox.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor={item.id}
                    className={`text-sm font-medium  peer-disabled:cursor-not-allowed peer-disabled:opacity-70  cursor-pointer select-none ${item.color}`}
                  >
                    {item.label}
                  </Label>
                  {item.stars !== 0 ? (
                    <RatingStars count={item.stars} color={item.color} />
                  ) : (
                    <RatingStars count={0} color={item.color} />
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};
