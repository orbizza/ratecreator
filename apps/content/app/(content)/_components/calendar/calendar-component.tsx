"use client";

import { useEffect, useState, useCallback } from "react";
import {
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  addYears,
  subYears,
  format,
  isSameDay,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  subWeeks,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from "lucide-react";
import { useRecoilValue } from "recoil";
import { contentPlatformAtom } from "@ratecreator/store";
import { Button, Card, CardContent, CardHeader } from "@ratecreator/ui";
import {
  fetchCalendarEvents,
  type CalendarEvent,
} from "@ratecreator/actions/content";
import { CalendarCell } from "./calendar-cell";
import { EventListSidebar } from "./event-list-sidebar";
import { CalendarFilters } from "./calendar-filters";

type ViewMode = "month" | "week";

interface CalendarFiltersState {
  scheduled: boolean;
  published: boolean;
  newsletters: boolean;
  ideas: boolean;
}

export function CalendarComponent(): JSX.Element {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CalendarFiltersState>({
    scheduled: true,
    published: true,
    newsletters: true,
    ideas: true,
  });
  const contentPlatform = useRecoilValue(contentPlatformAtom);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      let start: Date;
      let end: Date;

      if (viewMode === "month") {
        start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
        end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
      } else {
        start = startOfWeek(currentDate, { weekStartsOn: 0 });
        end = endOfWeek(currentDate, { weekStartsOn: 0 });
      }

      const platform = contentPlatform as
        | "RATECREATOR"
        | "CREATOROPS"
        | "DOCUMENTATION";
      const data = await fetchCalendarEvents(start, end, platform);
      setEvents(data);
    } catch {
      // Failed to fetch events
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewMode, contentPlatform]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const handlePreviousYear = (): void => {
    setCurrentDate(subYears(currentDate, 1));
  };

  const handleNextYear = (): void => {
    setCurrentDate(addYears(currentDate, 1));
  };

  const handlePrevious = (): void => {
    if (viewMode === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const handleNext = (): void => {
    if (viewMode === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const handleToday = (): void => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleDateSelect = (date: Date): void => {
    setSelectedDate(date);
  };

  const handleFilterChange = (key: keyof CalendarFiltersState): void => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRefresh = (): void => {
    void loadEvents();
  };

  const filteredEvents = events.filter((event) => {
    if (event.type === "scheduled" && !filters.scheduled) return false;
    if (event.type === "published" && !filters.published) return false;
    if (event.type === "newsletter" && !filters.newsletters) return false;
    if (event.type === "idea" && !filters.ideas) return false;
    return true;
  });

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return filteredEvents.filter((event) =>
      isSameDay(new Date(event.date), date),
    );
  };

  const getDaysInView = (): Date[] => {
    const days: Date[] = [];

    if (viewMode === "month") {
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
      const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
      let day = start;
      while (day <= end) {
        days.push(day);
        day = addDays(day, 1);
      }
    } else {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      for (let i = 0; i < 7; i++) {
        days.push(addDays(start, i));
      }
    }

    return days;
  };

  const days = getDaysInView();
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">
            View your scheduled posts, published content, and planned ideas
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                onClick={handlePreviousYear}
                size="icon"
                variant="outline"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button onClick={handlePrevious} size="icon" variant="outline">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold min-w-[180px] text-center">
                {viewMode === "month"
                  ? format(currentDate, "MMMM yyyy")
                  : `Week of ${format(startOfWeek(currentDate, { weekStartsOn: 0 }), "MMM d, yyyy")}`}
              </h2>
              <Button onClick={handleNext} size="icon" variant="outline">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button onClick={handleNextYear} size="icon" variant="outline">
                <ChevronsRight className="h-4 w-4" />
              </Button>
              <Button
                className="ml-2"
                onClick={handleToday}
                size="sm"
                variant="outline"
              >
                Today
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex border rounded-lg">
                <Button
                  className="rounded-r-none"
                  onClick={() => setViewMode("month")}
                  size="sm"
                  variant={viewMode === "month" ? "default" : "ghost"}
                >
                  Month
                </Button>
                <Button
                  className="rounded-l-none"
                  onClick={() => setViewMode("week")}
                  size="sm"
                  variant={viewMode === "week" ? "default" : "ghost"}
                >
                  Week
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-1">
              <div className="grid grid-cols-7 gap-px bg-muted">
                {weekDays.map((day) => (
                  <div
                    className="bg-background p-2 text-center text-sm font-medium text-muted-foreground"
                    key={day}
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div
                className={`grid grid-cols-7 gap-px bg-muted ${viewMode === "week" ? "" : "auto-rows-fr"}`}
              >
                {days.map((day) => (
                  <CalendarCell
                    currentMonth={currentDate}
                    day={day}
                    events={getEventsForDate(day)}
                    isSelected={
                      selectedDate ? isSameDay(day, selectedDate) : false
                    }
                    key={day.toISOString()}
                    onClick={handleDateSelect}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            </div>
          )}
          <CalendarFilters
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </CardContent>
      </Card>

      {selectedDate && (
        <EventListSidebar
          events={selectedDateEvents}
          onRefresh={handleRefresh}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
}
