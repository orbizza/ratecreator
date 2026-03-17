"use client";

import React, { useState } from "react";
import SearchContent from "./search-content";

/**
 * SearchBar Component
 *
 * A search component that integrates with Elasticsearch for category search.
 * Features include:
 * - Real-time search via useCategorySearch hook
 * - Dynamic placeholder text
 * - Search term state management
 *
 * @component
 * @returns {JSX.Element} A search bar component with Elasticsearch integration
 */
const SearchBar: React.FC = () => {
  // State for managing the search input value
  const [searchTerm, setSearchTerm] = useState("");

  // Array of placeholder texts to cycle through in the search input
  const placeholders = [
    "Enter any category name",
    "Search for categories",
    "Search for sub-categories",
    "Find categories, subcategories or sub-subcategories",
  ];

  return (
    <div className="mb-4 w-full items-center justify-center flex flex-col">
      <SearchContent
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        placeholders={placeholders}
      />
    </div>
  );
};

export default SearchBar;
