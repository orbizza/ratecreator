"use client";

import { BadgeCheck, Info } from "lucide-react";
import { useRecoilState } from "recoil";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ratecreator/ui";

import { claimedFilterState } from "@ratecreator/store/review";

const Claimed = () => {
  const [claimed, setClaimed] = useRecoilState(claimedFilterState);

  const handleClaimedChange = (value: string) => {
    setClaimed(
      value === "claimed-true"
        ? true
        : value === "claimed-false"
          ? false
          : null,
    );
  };

  return (
    <Select
      value={claimed === null ? "" : claimed ? "claimed-true" : "claimed-false"}
      onValueChange={handleClaimedChange}
    >
      <SelectTrigger className="shadow-md bg-neutral-50  dark:bg-neutral-950 ">
        <SelectValue placeholder="All Statuses" />
      </SelectTrigger>
      <SelectContent className="bg-neutral-50  dark:bg-neutral-950">
        <SelectItem value="claimed-true">Yes</SelectItem>
        <SelectItem value="claimed-false">No</SelectItem>
      </SelectContent>
    </Select>
  );
};

export const ClaimedSelect = () => {
  return (
    <div className="flex flex-col mb-2 gap-y-2">
      <div className="flex flex-row gap-x-2 items-center">
        <BadgeCheck size={16} />
        <span className="text-[16px]">Claimed</span>
        <Info size={14} className="text-muted-foreground" />
      </div>
      <Claimed />
    </div>
  );
};
