"use client";

import { useRef, useState } from "react";
import { useRecoilState } from "recoil";
import { languageFiltersState } from "@ratecreator/store/review";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectEmpty,
  MultiSelectList,
  MultiSelectSearch,
  MultiSelectTrigger,
  MultiSelectValue,
  renderMultiSelectOptions,
} from "@ratecreator/ui";

import { languageCodes } from "@ratecreator/store";

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
  const labels = displayValues.map((value) => {
    const language = languageCodes.find((l) => l.id === value);
    return language?.label || value;
  });

  const displayText = (
    <span className='flex gap-1 items-center'>
      {labels.map((label, index) => (
        <span key={label}>
          {index > 0 && ", "}
          {label.length > maxItemLength
            ? label === "All Languages"
              ? label
              : `${label.slice(0, maxItemLength)}...`
            : label}
        </span>
      ))}
    </span>
  );

  return (
    <div className='flex items-center gap-2'>
      {displayText}
      {values.length > 0 && !values.includes("all") && (
        <span className='ml-auto bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded-full text-sm'>
          {values.length}
        </span>
      )}
    </div>
  );
};

async function searchLanguages(keyword?: string) {
  if (!keyword) return languageCodes;
  const lowerKeyword = keyword.toLowerCase();
  return languageCodes.filter((language) =>
    language.label.toLowerCase().includes(lowerKeyword)
  );
}

export const LanguageSelect = () => {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState(languageCodes);
  const [selectedValues, setSelectedValues] =
    useRecoilState(languageFiltersState);
  const indexRef = useRef(0);

  const handleSearch = async (keyword?: string) => {
    const index = ++indexRef.current;
    setLoading(true);
    const newOptions = await searchLanguages(keyword);
    if (indexRef.current === index) {
      setOptions(newOptions);
      setLoading(false);
    }
  };

  const handleValueChange = (newValues: string[]) => {
    const wasAllSelected = selectedValues.includes("all");
    const isAllSelected = newValues.includes("all");

    if (!wasAllSelected && isAllSelected) {
      setSelectedValues(["all"]);
      return;
    }

    if (wasAllSelected && !isAllSelected) {
      const nonAllValues = newValues.filter((value) => value !== "all");
      setSelectedValues(nonAllValues);
      return;
    }

    const nonAllValues = newValues.filter((value) => value !== "all");
    setSelectedValues(nonAllValues.length ? nonAllValues : ["all"]);
  };

  return (
    <MultiSelect
      value={selectedValues}
      onValueChange={handleValueChange}
      onSearch={handleSearch}
    >
      <MultiSelectTrigger className='shadow-md bg-neutral-50 text-foreground dark:bg-neutral-950 dark:text-foreground'>
        <CustomMultiSelectValue
          placeholder='Select languages'
          maxDisplay={3}
          maxItemLength={5}
          values={selectedValues}
        />
      </MultiSelectTrigger>
      <MultiSelectContent className='bg-neutral-50 text-foreground dark:bg-neutral-950'>
        <MultiSelectSearch />
        <MultiSelectList>
          {loading
            ? null
            : renderMultiSelectOptions(
                options.map((language) => ({
                  value: language.id,
                  label: language.label,
                }))
              )}
          <MultiSelectEmpty>
            {loading ? "Loading..." : "No languages found"}
          </MultiSelectEmpty>
        </MultiSelectList>
      </MultiSelectContent>
    </MultiSelect>
  );
};
