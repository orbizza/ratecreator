"use client";
import React from "react";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectList,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@ratecreator/ui";

import { platforms } from "@ratecreator/store";

// Helper function to get platform label from value
const getPlatformLabel = (value: string) => {
  const platform = platforms.find((p) => p.value === value);
  return platform?.label || value;
};

// Custom MultiSelectValue component that displays labels instead of values
const CustomMultiSelectValue: React.FC<{
  placeholder?: string;
  maxDisplay?: number;
  values?: string[];
}> = ({ placeholder, maxDisplay = 3, values = [] }) => {
  if (!values.length) {
    return <span>{placeholder}</span>;
  }

  const displayValues = values.slice(0, maxDisplay);
  const remaining = values.length - maxDisplay;

  return (
    <span className="flex gap-1 items-center">
      {displayValues.map((value, index) => (
        <React.Fragment key={value}>
          {index > 0 && ", "}
          {getPlatformLabel(value)}
        </React.Fragment>
      ))}
      {remaining > 0 && ` + ${remaining} more`}
    </span>
  );
};

export const PlatformSelect: React.FC = () => {
  const [selectedValues, setSelectedValues] = React.useState<string[]>([
    "youtube",
    "x",
    "reddit",
    "instagram",
    "tiktok",
    "twitch",
  ]);

  return (
    <MultiSelect value={selectedValues} onValueChange={setSelectedValues}>
      <MultiSelectTrigger className="overflow-hidden shadow-md bg-neutral-50 text-foreground dark:bg-neutral-950 dark:text-foreground">
        <CustomMultiSelectValue
          placeholder="Platforms"
          maxDisplay={3}
          values={selectedValues}
        />
      </MultiSelectTrigger>
      <MultiSelectContent>
        <MultiSelectList>
          {platforms.map(({ value, label, icon: Icon, color }) => (
            <MultiSelectItem
              key={value}
              value={value}
              className="flex items-center gap-2"
            >
              <div className="flex items-center gap-2">
                <Icon size={16} className={color} />
                {label}
              </div>
            </MultiSelectItem>
          ))}
        </MultiSelectList>
      </MultiSelectContent>
    </MultiSelect>
  );
};
