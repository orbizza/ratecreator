"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import FuzzySearch from "fuzzy-search";
import { X, ArrowUp, ArrowUpCircle } from "lucide-react";

import { FetchedPostType } from "@ratecreator/types/content";
import { fetchPublishedPosts } from "@ratecreator/actions/content";
import { GlossarySkeleton } from "../content-skeletons/glossary-skeleton";

export const GlossaryListPage = () => {
  const [termsByLetter, setTermsByLetter] = useState<{
    [key: string]: FetchedPostType[];
  }>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<FetchedPostType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [searcher, setSearcher] = useState<FuzzySearch<FetchedPostType> | null>(
    null
  );
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({});

  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Add scroll event listener for scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToLetter = (letter: string) => {
    sectionRefs.current[letter]?.scrollIntoView({ behavior: "smooth" });
  };

  // Initialize fuzzy search when terms are loaded
  useEffect(() => {
    if (Object.keys(termsByLetter).length > 0) {
      const flattenedTerms = Object.values(termsByLetter).flat();
      setSearcher(
        new FuzzySearch(flattenedTerms, ["title", "slug", "excerpt"], {
          caseSensitive: false,
        })
      );
    }
  }, [termsByLetter]);

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
    const fetchTerms = async () => {
      try {
        const posts = await fetchPublishedPosts("glossary");

        // Group posts by first letter of title
        const groupedPosts = posts.reduce(
          (acc: { [key: string]: FetchedPostType[] }, post) => {
            const firstLetter = post.title.charAt(0).toUpperCase();
            const key = /^\d$/.test(firstLetter) ? "#" : firstLetter;

            if (!acc[key]) {
              acc[key] = [];
            }

            acc[key].push(post);
            return acc;
          },
          {}
        );

        setTermsByLetter(groupedPosts);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching terms:", err);
        setError("Failed to load glossary terms. Please try again later.");
        setLoading(false);
      }
    };

    fetchTerms();
  }, []);

  const alphabet = Object.keys(termsByLetter).sort((a, b) => {
    // Ensure '#' comes first
    if (a === "#") return -1;
    if (b === "#") return 1;
    return a.localeCompare(b);
  });

  const toggleSection = (letter: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [letter]: !prev[letter],
    }));
  };

  if (loading) {
    return <GlossarySkeleton />;
  }

  if (error) {
    return (
      <div className='max-w-6xl mx-auto px-4 py-8'>
        <h1 className='text-7xl font-bold mb-6 justify-center'>
          Creator Economy Glossary
        </h1>
        <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded'>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-6xl mx-auto px-4 py-8'>
      <div className='text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-bold justify-center text-center mb-10'>
        Creator Economy Glossary
      </div>

      {/* Alphabet Navigation */}
      <div className='flex justify-center gap-2 mb-8 flex-wrap'>
        {alphabet.map((letter) => (
          <button
            key={letter}
            onClick={() => scrollToLetter(letter)}
            className='w-8 h-8 flex items-center justify-center rounded-sm hover:bg-yellow-100 dark:hover:bg-yellow-900/20 transition-colors'
          >
            {letter}
          </button>
        ))}
      </div>

      {/* Mobile Fixed Alphabet Menu */}
      <div className='md:hidden fixed right-2 top-1/2 transform -translate-y-1/2 bg-white dark:bg-neutral-800 shadow-lg rounded-lg p-2 z-50'>
        <div className='flex flex-col gap-1'>
          {alphabet.map((letter) => (
            <button
              key={letter}
              onClick={() => scrollToLetter(letter)}
              className='text-xs w-6 h-6 flex items-center justify-center rounded-sm hover:bg-yellow-100 dark:hover:bg-yellow-900/20 transition-colors'
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      <div className='items-center justify-between gap-4 mb-8 relative w-full max-w-2xl mx-auto'>
        <input
          type='text'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='What are you looking for?'
          className='text-sm w-full border dark:border-transparent border-yellow-200 p-2 pr-10 rounded-md dark:bg-neutral-800 bg-white shadow-sm focus:border-yellow-400 focus:ring-0 focus:outline-none outline-none text-neutral-700 dark:text-neutral-200 dark:placeholder-neutral-400 placeholder:neutral-700'
        />
        {search.trim() && (
          <button
            onClick={() => {
              setSearch("");
              setResults([]);
            }}
            className='absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            aria-label='Clear search'
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Search Results */}
      {search.trim() && results.length > 0 && (
        <div className='mb-8'>
          <h2 className='text-2xl font-bold mb-4 border-b border-gray-200 dark:border-gray-700 pb-2'>
            Search Results
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {results.map((term) => (
              <Link
                href={`/glossary/${term.postUrl}`}
                key={term.id}
                className='block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary dark:hover:border-primary hover:shadow-md transition-all'
              >
                <h3 className='text-lg font-semibold mb-2'>{term.title}</h3>
                {term.excerpt && (
                  <p className='text-gray-600 dark:text-gray-400 text-sm'>
                    {term.excerpt}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* No Results Message */}
      {search.trim() && results.length === 0 && (
        <div className='mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center'>
          <p className='text-gray-600 dark:text-gray-400'>
            No glossary found matching "{search}".
          </p>
        </div>
      )}

      {/* Scroll to Top Button */}
      {showScrollTop && (
        // <button
        //   onClick={scrollToTop}
        //   className='fixed bottom-4 right-4 md:right-8 bg-yellow-500 hover:bg-yellow-600 text-white p-3 rounded-full shadow-lg transition-all z-50'
        //   aria-label='Scroll to top'
        // >
        //   <ArrowUp size={20} />
        //       </button>
        <button
          onClick={scrollToTop}
          className='fixed bottom-20 md:bottom-8 right-8 bg-primary hover:bg-primary/80 text-white p-2 rounded-full shadow-lg transition-all z-30'
          aria-label='Scroll to top'
        >
          <ArrowUpCircle size={24} />
        </button>
      )}

      {/* Terms by letter - only show when not searching or search is empty */}
      {!search.trim() && (
        <>
          {alphabet.map((letter) => {
            const terms = termsByLetter[letter];
            const displayedTerms = expandedSections[letter]
              ? terms
              : terms.slice(0, 6);
            const hasMore = terms.length > 6;

            return (
              <div
                key={letter}
                className='mb-10'
                ref={(el) => {
                  sectionRefs.current[letter] = el;
                }}
              >
                <div className='flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-700 pb-2'>
                  <h2 className='text-2xl font-bold'>
                    {letter}{" "}
                    <span className='text-sm text-gray-500'>
                      ({terms.length})
                    </span>
                  </h2>
                  {hasMore && (
                    <button
                      onClick={() => toggleSection(letter)}
                      className='text-primary hover:text-primary/80'
                    >
                      {expandedSections[letter] ? "Show Less" : "Show All"}
                    </button>
                  )}
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {displayedTerms.map((term) => (
                    <Link
                      href={`/glossary/${term.postUrl}`}
                      key={term.id}
                      className='block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary dark:hover:border-primary hover:shadow-md transition-all'
                    >
                      <h3 className='text-lg font-semibold mb-2'>
                        {term.title}
                      </h3>
                      {term.excerpt && (
                        <p className='text-gray-600 dark:text-gray-400 text-sm'>
                          {term.excerpt}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};
