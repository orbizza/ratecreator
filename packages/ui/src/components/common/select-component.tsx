"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@ratecreator/ui";

import { capitalizeEachWord } from "@ratecreator/db/utils";

/**
 * Type definition for select options
 */
type SelectOption = {
  value: string;
  label: string;
};

/**
 * Props for the SelectComponent
 */
interface SelectComponentProps {
  placeholder: string;
  items: string[] | SelectOption[];
  onSelect: (item: string) => void;
  selectedItem: string;
  showAll?: boolean;
}

// Constant for the "All" option value
const ALL_VALUE = "__all__";

/**
 * SelectComponent
 *
 * A reusable select component that supports both string arrays and SelectOption arrays.
 * It includes an optional "All" option and handles value normalization.
 *
 * @component
 * @param {SelectComponentProps} props - Component props
 * @returns {JSX.Element} A select component
 */
export const SelectComponent = ({
  placeholder,
  items,
  onSelect,
  selectedItem = "",
  showAll = false,
}: SelectComponentProps) => {
  /**
   * Handles the selection of an item
   * If the selected value is ALL_VALUE, it clears the selection
   */
  const handleSelect = (item: string) => {
    onSelect(item === ALL_VALUE ? "" : item);
  };

  // Convert both string arrays and SelectOption arrays to normalized SelectOption array
  const options: SelectOption[] =
    Array.isArray(items) && typeof items[0] === "string"
      ? (items as string[]).map((item) => ({
          value: String(item).toLowerCase(),
          label: capitalizeEachWord(String(item)),
        }))
      : (items as SelectOption[]).map((item) => ({
          value: String(item.value || "").toLowerCase(),
          label: item.label || capitalizeEachWord(String(item.value || "")),
        }));

  // Add "All" option if showAll is true
  const finalOptions: SelectOption[] = showAll
    ? [
        { value: ALL_VALUE, label: ` ${capitalizeEachWord(placeholder)}` },
        ...options,
      ]
    : options;

  // Find the current selected option, safely handle undefined/null values
  const currentValue = selectedItem
    ? String(selectedItem).toLowerCase()
    : ALL_VALUE;
  const currentOption = finalOptions.find(
    (item) => item.value === currentValue,
  );

  return (
    <Select value={currentValue} onValueChange={handleSelect}>
      {/* Container with conditional styling based on selection */}
      <div
        className={`${
          selectedItem && selectedItem !== placeholder
            ? "text-green-600 dark:text-green-500 rounded-md bg-neutral-100 dark:bg-neutral-800"
            : ""
        }`}
      >
        {/* Select trigger button */}
        <SelectTrigger className="ml-2 bg-transparent border-transparent ring-0 outline-none focus:ring-0 focus:outline-none  text-sm md:text-sm">
          {currentOption?.label || capitalizeEachWord(placeholder)}
        </SelectTrigger>{" "}
      </div>

      {/* Select dropdown content */}
      <SelectContent className="pl-0 bg-neutral-800 border-transparent ring-0 outline-none focus:ring-0 focus:outline-none">
        <SelectGroup className="pl-0 bg-neutral-800 ">
          {finalOptions.map((item) => (
            <SelectItem
              key={item.value}
              className="text-neutral-200 border-transparent hover:bg-neutral-950 hover:text-neutral-200 text-sm md:text-sm font-light !justify-start focus:ring-0 focus:outline-none focus:bg-neutral-950 focus:text-neutral-200 pr-5 "
              value={item.value}
            >
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
