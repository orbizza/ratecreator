"use client";

import { Button } from "@ratecreator/ui";
import { Plus, X } from "lucide-react";
import type { MemberFilters as MemberQueryFilters } from "@ratecreator/actions/content";

// Define filter categories with their types and available operators
const filterConfig: Record<
  string,
  {
    type: "text" | "boolean" | "date" | "select";
    operators: string[];
    options?: { label: string; value: string }[];
  }
> = {
  Name: {
    type: "text",
    operators: ["contains", "does not contain", "starts with", "ends with"],
  },
  Email: {
    type: "text",
    operators: [
      "contains",
      "does not contain",
      "starts with",
      "ends with",
      "is",
    ],
  },
  Role: {
    type: "select",
    operators: ["is", "is not"],
    options: [
      { label: "Admin", value: "ADMIN" },
      { label: "Writer", value: "WRITER" },
      { label: "User", value: "USER" },
      { label: "Creator", value: "CREATOR" },
      { label: "Brand", value: "BRAND" },
    ],
  },
  Created: {
    type: "date",
    operators: [
      "is",
      "is before",
      "is after",
      "is on or before",
      "is on or after",
    ],
  },
};

const filterCategories = Object.keys(filterConfig);

export interface Filter {
  id: string;
  category: string;
  operator: string;
  value: string;
}

const generateId = (): string => Math.random().toString(36).substring(2, 9);

interface MemberFilterComponentProps {
  filters: Filter[];
  onFiltersChange: (filters: Filter[]) => void;
  onApply: () => void;
  onReset: () => void;
}

export function MemberFilterComponent({
  filters,
  onFiltersChange,
  onApply,
  onReset,
}: MemberFilterComponentProps): JSX.Element {
  const addFilter = (): void => {
    const newCategory = "Name";
    const config = filterConfig[newCategory];
    onFiltersChange([
      ...filters,
      {
        id: generateId(),
        category: newCategory,
        operator: config.operators[0],
        value:
          config.type === "select" ? (config.options?.[0]?.value ?? "") : "",
      },
    ]);
  };

  const removeFilter = (id: string): void => {
    const updatedFilters = filters.filter((filter) => filter.id !== id);
    onFiltersChange(updatedFilters);
  };

  const updateFilter = (id: string, key: string, value: string): void => {
    const updatedFilters = filters.map((filter) => {
      if (filter.id !== id) return filter;

      // When category changes, reset operator and value to defaults for new category
      if (key === "category") {
        const config = filterConfig[value];
        return {
          ...filter,
          category: value,
          operator: config.operators[0],
          value:
            config.type === "select" ? (config.options?.[0]?.value ?? "") : "",
        };
      }

      return { ...filter, [key]: value };
    });
    onFiltersChange(updatedFilters);
  };

  const renderValueInput = (filter: Filter): JSX.Element => {
    const config = filterConfig[filter.category];

    if (
      (config.type === "boolean" || config.type === "select") &&
      config.options
    ) {
      return (
        <select
          className="h-9 rounded-md bg-background border border-input px-3 text-sm w-44 cursor-pointer hover:border-primary focus:border-primary focus:outline-none transition-colors"
          onChange={(e) => {
            updateFilter(filter.id, "value", e.target.value);
          }}
          value={filter.value}
        >
          {config.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (config.type === "date") {
      return (
        <input
          className="h-9 rounded-md bg-background border border-input px-3 text-sm w-44 cursor-pointer hover:border-primary focus:border-primary focus:outline-none transition-colors"
          onChange={(e) => {
            updateFilter(filter.id, "value", e.target.value);
          }}
          type="date"
          value={filter.value}
        />
      );
    }

    // Default text input
    return (
      <input
        className="h-9 w-44 rounded-md bg-background border border-input px-3 text-sm placeholder:text-muted-foreground hover:border-primary focus:border-primary focus:outline-none transition-colors"
        onChange={(e) => {
          updateFilter(filter.id, "value", e.target.value);
        }}
        placeholder="Enter value..."
        type="text"
        value={filter.value}
      />
    );
  };

  return (
    <div className="p-2 rounded-md">
      <div className="bg-muted/50 p-4 mb-4 rounded-md">
        {filters.map((filter) => {
          const config = filterConfig[filter.category];
          return (
            <div
              className="flex items-center gap-3 mb-4 last:mb-0"
              key={filter.id}
            >
              <select
                className="h-9 rounded-md bg-background border border-input px-3 text-sm w-40 cursor-pointer hover:border-primary focus:border-primary focus:outline-none transition-colors"
                onChange={(e) => {
                  updateFilter(filter.id, "category", e.target.value);
                }}
                value={filter.category}
              >
                {filterCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select
                className="h-9 rounded-md bg-background border border-input px-3 text-sm w-36 cursor-pointer hover:border-primary focus:border-primary focus:outline-none transition-colors"
                onChange={(e) => {
                  updateFilter(filter.id, "operator", e.target.value);
                }}
                value={filter.operator}
              >
                {config.operators.map((operator) => (
                  <option key={operator} value={operator}>
                    {operator}
                  </option>
                ))}
              </select>
              {renderValueInput(filter)}
              {filters.length > 1 ? (
                <Button
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 w-9"
                  onClick={() => {
                    removeFilter(filter.id);
                  }}
                  size="icon"
                  variant="ghost"
                >
                  <X className="w-4 h-4" />
                </Button>
              ) : (
                <div className="w-9" />
              )}
            </div>
          );
        })}
        <Button
          className="text-primary hover:text-primary/80 !no-underline mt-2"
          onClick={addFilter}
          variant="link"
        >
          <Plus className="w-4 h-4 mr-2" /> Add filter
        </Button>
      </div>
      <div className="flex justify-between items-center">
        <Button
          className="text-muted-foreground hover:text-foreground"
          onClick={onReset}
          variant="ghost"
        >
          Reset all
        </Button>
        <Button onClick={onApply}>Apply filters</Button>
      </div>
    </div>
  );
}

// Helper function to convert UI filters to API filters
export function convertFiltersToQuery(filters: Filter[]): MemberQueryFilters {
  const query: MemberQueryFilters = {};

  for (const filter of filters) {
    if (!filter.value) continue;

    switch (filter.category) {
      case "Name":
        query.name = { operator: filter.operator, value: filter.value };
        break;
      case "Email":
        query.email = { operator: filter.operator, value: filter.value };
        break;
      case "Role":
        query.role = { operator: filter.operator, value: filter.value };
        break;
      case "Created":
        query.createdAt = { operator: filter.operator, value: filter.value };
        break;
    }
  }

  return query;
}

// Helper to create initial filter
export function createInitialFilter(): Filter {
  return {
    id: generateId(),
    category: "Name",
    operator: "contains",
    value: "",
  };
}
