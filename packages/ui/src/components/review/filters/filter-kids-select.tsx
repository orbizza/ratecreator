"use client";

import { Baby, Info } from "lucide-react";
import { useRecoilState } from "recoil";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ratecreator/ui";

import { madeForKidsFilterState } from "@ratecreator/store/review";

const MadeForKids = () => {
  const [madeForKids, setMadeForKids] = useRecoilState(madeForKidsFilterState);

  const handleMadeForKidsChange = (value: string) => {
    setMadeForKids(
      value === "kids-true" ? true : value === "kids-false" ? false : null,
    );
  };

  return (
    <Select
      value={
        madeForKids === null ? "" : madeForKids ? "kids-true" : "kids-false"
      }
      onValueChange={handleMadeForKidsChange}
    >
      <SelectTrigger className="shadow-md bg-neutral-50  dark:bg-neutral-950 ">
        <SelectValue placeholder="All contents" />
      </SelectTrigger>
      <SelectContent className="bg-neutral-50  dark:bg-neutral-950">
        <SelectItem value="kids-true">Yes</SelectItem>
        <SelectItem value="kids-false">No</SelectItem>
      </SelectContent>
    </Select>
  );
};

export const MadeForKidsSelect = () => {
  return (
    <div className="flex flex-col mb-2 gap-y-2">
      <div className="flex flex-row gap-x-2 items-center">
        <Baby size={16} />
        <span className="text-[16px]">Made for kids</span>
        <Info size={14} className="text-muted-foreground" />
      </div>
      <MadeForKids />
    </div>
  );
};
