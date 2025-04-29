"use client";

import React, { useState } from "react";
import { InstantSearch, Configure } from "react-instantsearch";
import { getSearchClient } from "@ratecreator/db/algolia-client";
import SearchContent from "./search-content";

// Initialize Algolia search client
const searchClient = getSearchClient();

/**
 * SearchBar Component
 *
 * A search component that integrates with Algolia for category search.
 * Features include:
 * - Real-time search with Algolia
 * - Dynamic placeholder text
 * - Search term state management
 *
 * @component
 * @returns {JSX.Element} A search bar component with Algolia integration
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
    <InstantSearch searchClient={searchClient} indexName="categories">
      <div className="mb-4 w-full items-center justify-center flex flex-col">
        <SearchContent
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          placeholders={placeholders}
        />
      </div>
    </InstantSearch>
  );
};

export default SearchBar;
