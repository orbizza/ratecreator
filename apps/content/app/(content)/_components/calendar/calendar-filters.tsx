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

export function CalendarFilters({
  filters,
  onFilterChange,
}: CalendarFiltersProps): JSX.Element {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Checkbox
          id="filter-published"
          checked={filters.published}
          onCheckedChange={() => onFilterChange("published")}
        />
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
        <Label htmlFor="filter-ideas" className="text-sm cursor-pointer">
          Ideas
        </Label>
      </div>
    </div>
  );
}
