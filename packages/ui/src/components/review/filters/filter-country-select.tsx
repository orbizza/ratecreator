"use client";

import { useRef, useState } from "react";
import { useRecoilState } from "recoil";

import { countryFiltersState } from "@ratecreator/store/review";

import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectEmpty,
  MultiSelectList,
  MultiSelectSearch,
  MultiSelectTrigger,
  renderMultiSelectOptions,
} from "@ratecreator/ui";

import { countryCodes } from "@ratecreator/store";
import { Globe, Info } from "lucide-react";

interface CustomMultiSelectValueProps {
  placeholder: string;
  maxDisplay?: number;
  maxItemLength?: number;
  values?: string[];
}

const CustomMultiSelectValue = ({
  placeholder,
  maxDisplay = 3,
  maxItemLength = 5,
  values = [],
}: CustomMultiSelectValueProps) => {
  if (!values.length) {
    return <span>{placeholder}</span>;
  }

  const displayValues = values.slice(0, maxDisplay);
  const remaining = values.length - maxDisplay;
  const labels = displayValues.map((value) => {
    const country = countryCodes.find((c) => c.id === value);
    return country?.label || value;
  });

  const displayText = (
    <span className="flex gap-1 items-center">
      {labels.map((label, index) => (
        <span key={label}>
          {index > 0 && ", "}
          {label.length > maxItemLength
            ? label === "All Countries"
              ? label
              : `${label.slice(0, maxItemLength)}...`
            : label}
        </span>
      ))}
    </span>
  );

  return (
    <div className="flex items-center gap-2">
      {displayText}
      {values.length > 0 && !values.includes("ALL") && (
        <span className="ml-auto bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded-full text-sm">
          {values.length}
        </span>
      )}
    </div>
  );
};

async function searchCountries(keyword?: string) {
  if (!keyword) return countryCodes;

  const lowerKeyword = keyword.toLowerCase();
  return countryCodes.filter((country) =>
    country.label.toLowerCase().includes(lowerKeyword),
  );
}
export const CountrySelect = () => {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState(countryCodes);
  const [selectedValues, setSelectedValues] =
    useRecoilState(countryFiltersState);
  const indexRef = useRef(0);

  const handleSearch = async (keyword?: string) => {
    const index = ++indexRef.current;
    setLoading(true);
    const newOptions = await searchCountries(keyword);
    if (indexRef.current === index) {
      setOptions(newOptions);
      setLoading(false);
    }
  };

  const handleValueChange = (newValues: string[]) => {
    const wasAllSelected = selectedValues.includes("ALL");
    const isAllSelected = newValues.includes("ALL");

    if (!wasAllSelected && isAllSelected) {
      setSelectedValues(["ALL"]);
      return;
    }

    if (wasAllSelected && !isAllSelected) {
      const nonAllValues = newValues.filter((value) => value !== "ALL");
      setSelectedValues(nonAllValues);
      return;
    }

    const nonAllValues = newValues.filter((value) => value !== "ALL");
    setSelectedValues(nonAllValues.length ? nonAllValues : ["ALL"]);
  };

  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex flex-row gap-x-2 items-center">
        <Globe size={16} />
        <span className="text-[16px]">Countries</span>
        <Info size={14} className="text-muted-foreground" />
      </div>
      <MultiSelect
        value={selectedValues}
        onValueChange={handleValueChange}
        onSearch={handleSearch}
      >
        <MultiSelectTrigger className="shadow-md bg-neutral-50 text-foreground dark:bg-neutral-950 dark:text-foreground">
          <CustomMultiSelectValue
            placeholder="Select countries"
            maxDisplay={3}
            maxItemLength={5}
            values={selectedValues}
          />
        </MultiSelectTrigger>
        <MultiSelectContent className="bg-neutral-50 text-foreground dark:bg-neutral-950">
          <MultiSelectSearch />
          <MultiSelectList>
            {loading
              ? null
              : renderMultiSelectOptions(
                  options.map((country) => ({
                    value: country.id,
                    label: country.label,
                  })),
                )}
            <MultiSelectEmpty>
              {loading ? "Loading..." : "No countries found"}
            </MultiSelectEmpty>
          </MultiSelectList>
        </MultiSelectContent>
      </MultiSelect>
    </div>
  );
};
