"use client";

import * as React from "react";
import { format, isBefore, startOfDay } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@ratecreator/ui/utils";

import {
  Button,
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@ratecreator/ui";

/**
 * DatePicker Component
 *
 * A reusable date picker component that allows users to select a date.
 * It includes validation to prevent selecting dates before today.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Date} props.date - The currently selected date
 * @param {function} props.setDate - Function to update the selected date
 * @returns {JSX.Element} A date picker component
 */
export function DatePicker({
  date,
  setDate,
}: {
  date: Date;
  setDate: (date: Date) => void;
}) {
  // const [date, setDate] = useRecoilState(selectDate);

  // Disable dates before today
  const disabledDays = {
    before: startOfDay(new Date()),
  };

  return (
    <Popover>
      {/* Trigger button that displays the selected date or placeholder */}
      <PopoverTrigger asChild className='z-50'>
        <Button
          variant={"date"}
          className={cn(
            "w-[280px] justify-start text-left font-normal bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-600",
            !date && "text-muted-foreground"
          )}
        >
          {date ? format(date, "PPP") : <span>Pick a date</span>}
          <CalendarIcon className='ml-auto h-4 w-4' />
        </Button>
      </PopoverTrigger>

      {/* Calendar popover content */}
      <PopoverContent className='w-auto p-0 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-200'>
        <Calendar
          mode='single'
          selected={date}
          onSelect={(day) => {
            // Validate that the selected date is not before today
            if (day && !isBefore(day, startOfDay(new Date()))) {
              setDate(day);
            }
          }}
          disabled={disabledDays}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
