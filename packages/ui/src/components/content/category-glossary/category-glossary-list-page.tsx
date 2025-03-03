"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Category } from "@ratecreator/types/review";
import { getAllCategoriesAlphabetically } from "@ratecreator/actions/review";
import { ArrowUpCircle } from "lucide-react";
import { CategoryGlossarySkeleton } from "./category-glossary-skeleton";

// Local cache key
const LOCAL_CACHE_KEY = "category-glossary-cache";
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const CategoryGlossaryListPage = () => {
  const [categoriesByLetter, setCategoriesByLetter] = useState<{
    [key: string]: Category[];
  }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Check local storage cache first
        const cachedData = localStorage.getItem(LOCAL_CACHE_KEY);

        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          const now = new Date().getTime();

          // Use cache if it's less than 24 hours old
          if (now - timestamp < CACHE_EXPIRY) {
            console.log("Using local cache for categories");
            setCategoriesByLetter(data);
            setLoading(false);
            return;
          }
        }

        // Fetch from server if no valid cache
        const data = await getAllCategoriesAlphabetically();

        // Store in local storage with timestamp
        localStorage.setItem(
          LOCAL_CACHE_KEY,
          JSON.stringify({
            data,
            timestamp: new Date().getTime(),
          })
        );

        setCategoriesByLetter(data);
        setLoading(false);
      } catch (err) {
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
    if (sectionRefs.current[letter]) {
      sectionRefs.current[letter]?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Process categories to group numbers under '#'
  const processCategories = () => {
    const processed: { [key: string]: Category[] } = {};

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
      <div className='max-w-6xl mx-auto px-4 py-8'>
        <h1 className='text-3xl font-bold mb-6'>Categories Glossary</h1>
        <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded'>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row'>
      {/* Sidebar navigation for mobile - fixed at bottom */}
      <div className='md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-700 p-3 z-20 shadow-lg'>
        <div className='overflow-x-auto'>
          <div className='flex space-x-2 pb-1'>
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
      <div className='flex-1 md:pr-8 pb-16 md:pb-0'>
        <h1 className='text-3xl font-bold mb-2'>Categories Glossary</h1>
        <p className='text-gray-600 dark:text-gray-400 mb-8'>
          Explore a vast collection of categories covering diverse topics.{" "}
          <span className='text-primary'>Discover and review creators</span> and
          communities within each category to get insights, ratings, and expert
          opinions. Click on a category card to see more details.
        </p>

        {/* Jump to navigation - normal flow, scrolls away */}
        <div className='py-4 border-b border-gray-200 dark:border-gray-700 mb-8'>
          <div className='flex flex-wrap gap-1 justify-center'>
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

        {/* Categories by letter */}
        {alphabet.map((letter) => (
          <div
            key={letter}
            ref={(el) => {
              sectionRefs.current[letter] = el;
            }}
            id={`section-${letter}`}
            className='mb-10'
          >
            <h2 className='text-2xl font-bold mb-4 border-b border-gray-200 dark:border-gray-700 pb-2'>
              {letter}
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {processedCategories[letter].map((category) => (
                <Link
                  href={`/category-glossary/${category.slug}`}
                  key={category.id}
                  className='block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary dark:hover:border-primary hover:shadow-md transition-all'
                >
                  <h3 className='text-lg font-semibold mb-2'>
                    {category.name}
                  </h3>
                  {category.shortDescription && (
                    <p className='text-gray-600 dark:text-gray-400 text-sm'>
                      {category.shortDescription}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar navigation - scrollable and visible on desktop only */}
      <div className='hidden md:block w-auto sticky top-32 self-start max-h-[calc(100vh-80px)] overflow-y-auto'>
        <div className='p-0 rounded-lg'>
          <h3 className='font-semibold mb-1 text-gray-700 dark:text-gray-300'>
            Jump to
          </h3>
          <div className=''>
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
          className='fixed bottom-20 md:bottom-8 right-8 bg-primary hover:bg-primary/80 text-white p-2 rounded-full shadow-lg transition-all z-30'
          aria-label='Scroll to top'
        >
          <ArrowUpCircle size={24} />
        </button>
      )}
    </div>
  );
};
