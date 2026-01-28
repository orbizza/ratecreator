"use client";

import { isSameMonth, isToday, format } from "date-fns";
import { cn } from "@ratecreator/ui/utils";
import type { CalendarEvent } from "@ratecreator/actions/content";

interface CalendarCellProps {
  day: Date;
  currentMonth: Date;
  events: CalendarEvent[];
  isSelected: boolean;
  onClick: (date: Date) => void;
  viewMode: "month" | "week";
}

function getEventColor(type: string): string {
  switch (type) {
    case "published":
      return "bg-green-500";
    case "scheduled":
      return "bg-blue-500";
    case "newsletter":
      return "bg-purple-500";
    case "idea":
      return "bg-yellow-500";
    default:
      return "bg-gray-500";
  }
}

export function CalendarCell({
  day,
  currentMonth,
  events,
  isSelected,
  onClick,
  viewMode,
}: CalendarCellProps): JSX.Element {
  const isCurrentMonth = isSameMonth(day, currentMonth);
  const isDayToday = isToday(day);

  return (
    <button
      className={cn(
        "bg-background p-2 min-h-[80px] text-left transition-colors hover:bg-accent/50",
        !isCurrentMonth && "text-muted-foreground/50 bg-muted/50",
        isSelected && "ring-2 ring-primary ring-inset",
        viewMode === "week" && "min-h-[120px]",
      )}
      onClick={() => onClick(day)}
      type="button"
    >
      <div className="flex flex-col h-full">
        <span
          className={cn(
            "inline-flex h-6 w-6 items-center justify-center rounded-full text-sm",
            isDayToday && "bg-primary text-primary-foreground font-semibold",
          )}
        >
          {format(day, "d")}
        </span>
        <div className="flex-1 mt-1 space-y-1 overflow-hidden">
          {events.slice(0, 3).map((event) => (
            <div
              key={event.id}
              className={cn(
                "text-xs truncate px-1 py-0.5 rounded text-white",
                getEventColor(event.type),
              )}
              title={event.title}
            >
              {event.title}
            </div>
          ))}
          {events.length > 3 && (
            <div className="text-xs text-muted-foreground px-1">
              +{events.length - 3} more
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
