"use client";

import { Checkbox, Label } from "@ratecreator/ui";

interface CalendarFiltersState {
  scheduled: boolean;
  published: boolean;
  newsletters: boolean;
  ideas: boolean;
}

interface CalendarFiltersProps {
  filters: CalendarFiltersState;
  onFilterChange: (key: keyof CalendarFiltersState) => void;
}

const filterColors: Record<keyof CalendarFiltersState, string> = {
  published: "bg-green-500",
  scheduled: "bg-blue-500",
  newsletters: "bg-purple-500",
  ideas: "bg-yellow-500",
};

export function CalendarFilters({
  filters,
  onFilterChange,
}: CalendarFiltersProps): JSX.Element {
  return (
    <div className="flex items-center gap-4 pt-4">
      <div className="flex items-center gap-2">
        <Checkbox
          id="filter-published"
          checked={filters.published}
          onCheckedChange={() => onFilterChange("published")}
        />
        <div className={`w-2.5 h-2.5 rounded-full ${filterColors.published}`} />
        <Label htmlFor="filter-published" className="text-sm cursor-pointer">
          Published
        </Label>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="filter-scheduled"
          checked={filters.scheduled}
          onCheckedChange={() => onFilterChange("scheduled")}
        />
        <div className={`w-2.5 h-2.5 rounded-full ${filterColors.scheduled}`} />
        <Label htmlFor="filter-scheduled" className="text-sm cursor-pointer">
          Scheduled
        </Label>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="filter-newsletters"
          checked={filters.newsletters}
          onCheckedChange={() => onFilterChange("newsletters")}
        />
        <div
          className={`w-2.5 h-2.5 rounded-full ${filterColors.newsletters}`}
        />
        <Label htmlFor="filter-newsletters" className="text-sm cursor-pointer">
          Newsletters
        </Label>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="filter-ideas"
          checked={filters.ideas}
          onCheckedChange={() => onFilterChange("ideas")}
        />
        <div className={`w-2.5 h-2.5 rounded-full ${filterColors.ideas}`} />
        <Label htmlFor="filter-ideas" className="text-sm cursor-pointer">
          Ideas
        </Label>
      </div>
    </div>
  );
}
