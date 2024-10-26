"use client";

import { useRouter } from "next/navigation";
import { useRecoilState } from "recoil";
import { useCallback, useEffect, useState } from "react";
import {
  InstantSearch,
  useInstantSearch,
  useHits,
  useSearchBox,
} from "react-instantsearch";
import {
  Link,
  MailOpen,
  CodeXml,
  Home,
  CircleUserRound,
  PenLine,
  Search,
  X,
  ExternalLink,
  Library,
  Laptop,
  Newspaper,
  Hourglass,
} from "lucide-react";

import {
  KBarAnimator,
  KBarProvider,
  KBarPortal,
  KBarPositioner,
  KBarSearch,
  useKBar,
} from "kbar";

import { getSearchClient } from "@ratecreator/db/algolia-client";
import { showToastState } from "@ratecreator/store";
import { TabType } from "@ratecreator/types/review";
import { CommandBarReset } from "./commandbar-reset";
import { CreatorCard } from "../cards/card-commandbar-creator";
import { Button } from "../../ui/button";
import React from "react";

// Separate component for search results

const SearchComponent = ({
  searchTerm,
  onSearchChange,
  activeTab,
}: {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  activeTab: TabType;
}) => {
  const { refine } = useSearchBox();
  const { hits } = useHits();
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    refine(searchTerm);
  }, [searchTerm, refine]);

  useEffect(() => {
    let filtered = [...hits];

    if (activeTab !== "All") {
      filtered = filtered.filter(
        (result) => result.platform === activeTab.toUpperCase()
      );
    }

    setFilteredResults(
      filtered.map((hit) => ({
        accountId: hit.objectID,
        platform: hit.platform,
        handle: hit.handle,
        name: hit.name,
        description: hit.description,
        followerCount: hit.followerCount,
        imageUrl: hit.imageUrl,
        categories: hit.categories,
        rating: hit.rating,
        reviews: hit.reviewCount,
      }))
    );
  }, [hits, activeTab]);

  return (
    <div className='mt-4 max-h-[50vh] overflow-y-auto'>
      {filteredResults.length > 0 ? (
        <div className='space-y-2'>
          {filteredResults.map((result) => (
            <CreatorCard key={result.accountId} {...result} />
          ))}
        </div>
      ) : searchTerm ? (
        <div className='text-center text-muted-foreground'>
          No results found for the current tab.
        </div>
      ) : null}
    </div>
  );
};

// Interface for search results
interface SearchResult {
  accountId: string;
  platform: "YOUTUBE" | "X" | "REDDIT";
  handle: string;
  name: string;
  description: string;
  followerCount: number;
  imageUrl: string;
  categories: string[];
  rating: number;
  reviews: number;
}

const tabs: TabType[] = ["All", "YouTube", "X", "Reddit"];
const CommandBarContent: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const searchClient = getSearchClient();
  const { query } = useKBar();

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabType>("All");

  const resetSearch = useCallback(() => {
    setSearchTerm("");
    setActiveTab("All");
  }, [query]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const clearSearch = () => {
    resetSearch();
  };

  const handleSearchRedirect = () => {
    if (searchTerm) {
      // Close KBar
      query.toggle();
      // Redirect to search page with query parameters
      router.push(
        `/search?q=${encodeURIComponent(searchTerm)}${activeTab !== "All" ? `&platform=${encodeURIComponent(activeTab)}` : ""}`
      );
    }
  };
  return (
    <>
      <InstantSearch searchClient={searchClient} indexName='accounts'>
        <KBarPortal>
          <KBarPositioner className='fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center pt-[14vh]'>
            <KBarAnimator className='w-full max-w-2xl bg-card text-card-foreground rounded-lg shadow-lg overflow-hidden flex flex-col'>
              <div className='p-4 flex-grow overflow-hidden'>
                <div className='relative flex'>
                  <Search
                    className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground'
                    size={20}
                  />

                  <KBarSearch
                    className='w-full pl-10 pr-4 py-2 bg-muted text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring'
                    onChange={handleSearchChange}
                    value={searchTerm}
                    placeholder='Search creators...'
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearchRedirect();
                      }
                    }}
                  />

                  {searchTerm && (
                    <div className='flex ml-2'>
                      <Button onClick={handleSearchRedirect}>Search</Button>
                    </div>
                  )}
                </div>
                {/* <InstantSearch searchClient={searchClient} indexName='accounts'> */}
                <SearchComponent
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  activeTab={activeTab}
                />
                {/* </InstantSearch> */}
              </div>
              <div className='flex border-t border-border'>
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    className={`flex-1 text-center py-2 ${
                      activeTab === tab
                        ? "border-t-2 border-primary "
                        : "bg-secondary text-muted-foreground hover:bg-primary hover:opacity-75 hover:text-accent-foreground"
                    }`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </KBarAnimator>
          </KBarPositioner>
        </KBarPortal>
      </InstantSearch>
      <CommandBarReset onReset={resetSearch} />
      {children}
    </>
  );
};

export const CommandBar: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [showToast, setShowToast] = useRecoilState(showToastState);
  const router = useRouter();

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };
  const actions = [
    {
      id: "copy",
      name: "Copy Link",
      shortcut: ["c"],
      keywords: "copy-link",
      section: "General",
      perform: copyLink,
      icon: <Link size={20} />,
    },
    {
      id: "email",
      name: "Send Email",
      shortcut: ["e"],
      keywords: "send-email",
      section: "General",
      perform: () => router.push("/contact"),
      icon: <MailOpen size={20} />,
    },
    {
      id: "for-creator",
      name: "For Creator",
      shortcut: ["f", "c"],
      keywords: "for-creator",
      section: "General",
      perform: () =>
        window.open("https://github.com/deepshaswat/deepshaswat.com", "_blank"),
      icon: <CodeXml size={20} />,
    },
    {
      id: "home",
      name: "Home",
      shortcut: ["g", "h"],
      keywords: "go-home",
      section: "Go To",
      perform: () => router.push("/"),
      icon: <Home size={20} />,
    },
    {
      id: "about",
      name: "About",
      shortcut: ["g", "a"],
      keywords: "go-about",
      section: "Go To",
      perform: () => router.push("/about"),
      icon: <CircleUserRound size={20} />,
    },
    {
      id: "articles",
      name: "Articles",
      shortcut: ["g", "b"],
      keywords: "go-articles",
      section: "Go To",
      perform: () => router.push("/articles"),
      icon: <PenLine size={20} />,
    },
    // {
    //   id: "projects",
    //   name: "Projects",
    //   shortcut: ["g", "p"],
    //   keywords: "go-projects",
    //   section: "Go To",
    //   perform: () => router.push("/projects"),
    //   icon: <FolderRoot size={20} />,
    // },
    // {
    //   id: "investing",
    //   name: "Investing",
    //   shortcut: ["g", "i"],
    //   keywords: "go-investing",
    //   section: "Go To",
    //   perform: () => router.push("/investing"),
    //   icon: <CircleDollarSign size={20} />,
    // },
    // {
    //   id: "youtube",
    //   name: "YouTube",
    //   shortcut: ["g", "y"],
    //   keywords: "go-youtube",
    //   section: "Go To",
    //   perform: () => router.push("/youtube"),
    //   icon: <Youtube size={20} />,
    // },
    {
      id: "library",
      name: "Library",
      shortcut: ["g", "l"],
      keywords: "go-library",
      section: "Go To",
      perform: () => router.push("/library"),
      icon: <Library size={20} />,
    },
    {
      id: "uses",
      name: "Uses",
      shortcut: ["g", "u"],
      keywords: "go-uses",
      section: "Go To",
      perform: () => router.push("/uses"),
      icon: <Laptop size={20} />,
    },

    {
      id: "newsletter",
      name: "Newsletter",
      shortcut: ["g", "n"],
      keywords: "go-newsletter",
      section: "Go To",
      perform: () => router.push("/newsletter"),
      icon: <Newspaper size={20} />,
    },

    {
      id: "reminder",
      name: "Reminder",
      shortcut: ["g", "r"],
      keywords: "go-reminder",
      section: "Go To",
      perform: () => router.push("/reminder"),
      icon: <Hourglass size={20} />,
    },
  ];
  return (
    <KBarProvider actions={actions}>
      <CommandBarContent>{children}</CommandBarContent>
    </KBarProvider>
  );
};
