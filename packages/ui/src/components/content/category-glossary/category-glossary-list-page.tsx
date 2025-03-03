"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import FuzzySearch from "fuzzy-search";
import { ArrowUpCircle, X } from "lucide-react";

import { GlossaryCategory } from "@ratecreator/types/review";
import { getAllCategoriesAlphabetically } from "@ratecreator/actions/review";
import { CategoryGlossarySkeleton } from "./category-glossary-skeleton";
import { categoryGlossaryCache } from "@ratecreator/db/utils";

export const CategoryGlossaryListPage = () => {
  const [categoriesByLetter, setCategoriesByLetter] = useState<{
    [key: string]: GlossaryCategory[];
  }>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<GlossaryCategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [allCategories, setAllCategories] = useState<GlossaryCategory[]>([]);
  const [searcher, setSearcher] =
    useState<FuzzySearch<GlossaryCategory> | null>(null);

  // Initialize fuzzy search when categories are loaded
  useEffect(() => {
    if (Object.keys(categoriesByLetter).length > 0) {
      // Flatten categories from all letters into a single array
      const flattenedCategories = Object.values(categoriesByLetter).flat();
      setAllCategories(flattenedCategories);

      // Initialize the fuzzy searcher with the flattened array
      setSearcher(
        new FuzzySearch(
          flattenedCategories,
          ["name", "slug", "shortDescription"],
          {
            caseSensitive: false,
          },
        ),
      );
    }
  }, [categoriesByLetter]);

  // Update search results when search term changes
  useEffect(() => {
    if (searcher && search.trim()) {
      const searchResults = searcher.search(search);
      setResults(searchResults);
    } else {
      setResults([]);
    }
  }, [search, searcher]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Try to get data from IndexedDB cache
        const cachedData = await categoryGlossaryCache.getCachedCategories();

        if (cachedData) {
          console.log("Using IndexedDB cache for categories");
          setCategoriesByLetter(cachedData);
          setLoading(false);
          return;
        }

        // Fetch from server if no valid cache
        const data = await getAllCategoriesAlphabetically();

        // Store in IndexedDB cache
        await categoryGlossaryCache.setCachedCategories(data);

        setCategoriesByLetter(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Failed to load categories. Please try again later.");
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Update active section based on scroll position and control scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100; // Offset for better UX

      // Show/hide scroll to top button
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }

      // Find the section that is currently in view
      for (const letter of Object.keys(sectionRefs.current)) {
        const element = sectionRefs.current[letter];
        if (!element) continue;

        const { offsetTop, offsetHeight } = element;

        if (
          scrollPosition >= offsetTop &&
          scrollPosition < offsetTop + offsetHeight
        ) {
          setActiveSection(letter);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [categoriesByLetter]);

  const scrollToSection = (letter: string) => {
    // Reset search when a navigation button is clicked
    setSearch("");
    setResults([]);

    // Use setTimeout to ensure the DOM has updated after clearing search
    setTimeout(() => {
      if (sectionRefs.current[letter]) {
        sectionRefs.current[letter]?.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const scrollToTop = () => {
    // Reset search when scroll to top is clicked
    setSearch("");
    setResults([]);

    // Use setTimeout to ensure the DOM has updated
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  };

  // Process categories to group numbers under '#'
  const processCategories = () => {
    const processed: { [key: string]: GlossaryCategory[] } = {};

    Object.entries(categoriesByLetter).forEach(([letter, categories]) => {
      // If the letter is a number, use '#' as the key
      const key = /^\d$/.test(letter) ? "#" : letter;

      if (!processed[key]) {
        processed[key] = [];
      }

      processed[key] = [...processed[key], ...categories];
    });

    return processed;
  };

  const processedCategories = processCategories();
  const alphabet = Object.keys(processedCategories).sort((a, b) => {
    // Ensure '#' comes first
    if (a === "#") return -1;
    if (b === "#") return 1;
    return a.localeCompare(b);
  });

  if (loading) {
    return <CategoryGlossarySkeleton />;
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Categories Glossary</h1>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row">
      {/* Sidebar navigation for mobile - fixed at bottom - always visible */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-700 p-3 z-20 shadow-lg">
        <div className="overflow-x-auto">
          <div className="flex space-x-2 pb-1">
            {alphabet.map((letter) => (
              <button
                key={letter}
                onClick={() => scrollToSection(letter)}
                className={`min-w-[32px] h-8 flex items-center justify-center rounded ${
                  activeSection === letter
                    ? "bg-primary text-white dark:bg-primary"
                    : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 md:pr-8 pb-16 md:pb-0">
        <h1 className="text-3xl font-bold mb-2">Categories Glossary</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Explore a vast collection of categories covering diverse topics.{" "}
          <span className="text-primary">Discover and review creators</span> and
          communities within each category to get insights, ratings, and expert
          opinions. Click on a category card to see more details.
        </p>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 ">
          <p className="text-3xl font-bold md:w-2/4 lg:w-1/3">All Categories</p>
          <div className="relative w-full sm:min-w-96">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories"
              className="text-sm w-full border dark:border-transparent border-yellow-200 p-2 pr-10 rounded-md dark:bg-neutral-800 bg-white shadow-sm focus:border-yellow-400 focus:ring-0 focus:outline-none outline-none text-neutral-700 dark:text-neutral-200 dark:placeholder-neutral-400 placeholder:neutral-700"
            />
            {search.trim() && (
              <button
                onClick={() => {
                  setSearch("");
                  setResults([]);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Clear search"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Always show alphabet navigation regardless of search state */}
        <div className="py-4 border-b border-gray-200 dark:border-gray-700 mb-8">
          <div className="flex flex-wrap gap-1 justify-center">
            {alphabet.map((letter) => (
              <button
                key={letter}
                onClick={() => scrollToSection(letter)}
                className={`w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary ${
                  activeSection === letter
                    ? "bg-primary text-white dark:bg-primary hover:bg-primary/80"
                    : ""
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results */}
        {search.trim() && results.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
              Search Results
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((category) => (
                <Link
                  href={`/category-glossary/${category.slug}`}
                  key={category.id}
                  className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary dark:hover:border-primary hover:shadow-md transition-all"
                >
                  <h3 className="text-lg font-semibold mb-2">
                    {category.name}
                  </h3>
                  {category.shortDescription && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {category.shortDescription}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* No Results Message */}
        {search.trim() && results.length === 0 && (
          <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No categories found matching "{search}".
            </p>
          </div>
        )}

        {/* Categories by letter - only show when not searching or search is empty */}
        {!search.trim() && (
          <>
            {alphabet.map((letter) => (
              <div
                key={letter}
                ref={(el) => {
                  sectionRefs.current[letter] = el;
                }}
                id={`section-${letter}`}
                className="mb-10"
              >
                <h2 className="text-2xl font-bold mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                  {letter}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {processedCategories[letter].map((category) => (
                    <Link
                      href={`/category-glossary/${category.slug}`}
                      key={category.id}
                      className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary dark:hover:border-primary hover:shadow-md transition-all"
                    >
                      <h3 className="text-lg font-semibold mb-2">
                        {category.name}
                      </h3>
                      {category.shortDescription && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          {category.shortDescription}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Sidebar navigation - scrollable and always visible on desktop */}
      <div className="hidden md:block w-auto sticky top-32 self-start max-h-[calc(100vh-80px)] overflow-y-auto">
        <div className="p-0 rounded-lg">
          <h3 className="font-semibold mb-1 text-gray-700 dark:text-gray-300">
            Jump to
          </h3>
          <div className="">
            {alphabet.map((letter) => (
              <button
                key={letter}
                onClick={() => scrollToSection(letter)}
                className={`block w-full text-left px-3 py-1.5 rounded ${
                  activeSection === letter
                    ? "bg-primary text-white dark:bg-primary"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Floating scroll to top button - adjusted to be above mobile navigation */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 md:bottom-8 right-8 bg-primary hover:bg-primary/80 text-white p-2 rounded-full shadow-lg transition-all z-30"
          aria-label="Scroll to top"
        >
          <ArrowUpCircle size={24} />
        </button>
      )}
    </div>
  );
};
