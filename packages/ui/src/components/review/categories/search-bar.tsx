"use client";

import React, { useState } from "react";
import { InstantSearch, Configure } from "react-instantsearch";
import { getSearchClient } from "@ratecreator/db/algolia-client";
import SearchContent from "./search-content";

const searchClient = getSearchClient();

const SearchBar: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const placeholders = [
    "Enter any category name",
    "Search for categories",
    "Search for sub-categories",
    "Find categories, subcategories or sub-subcategories",
  ];

  return (
    <InstantSearch searchClient={searchClient} indexName='categories'>
      <div className='mb-4 w-full items-center justify-center flex flex-col'>
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
