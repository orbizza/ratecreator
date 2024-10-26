"use client";

import { useRouter } from "next/navigation";
import { useRecoilState } from "recoil";
import { useCallback, useEffect, useState, forwardRef } from "react";
import type { ReactNode, ChangeEvent, KeyboardEvent } from "react";
import { InstantSearch, useHits, useSearchBox } from "react-instantsearch";
import {
  Link,
  MailOpen,
  CodeXml,
  Home,
  CircleUserRound,
  PenLine,
  Search,
  Library,
  Laptop,
  Newspaper,
  Hourglass,
  LucideIcon,
} from "lucide-react";

import {
  KBarAnimator,
  KBarProvider,
  KBarPortal,
  KBarPositioner,
  KBarSearch,
  KBarResults,
  useKBar,
  useMatches,
  ActionImpl,
  ActionId,
  VisualState,
} from "kbar";

import { getSearchClient } from "@ratecreator/db/algolia-client";
import { showToastState } from "@ratecreator/store";
import { Button } from "../../ui/button";
import { CreatorCard } from "../cards/card-commandbar-creator";
import { CommandBarReset } from "./commandbar-reset";

// Type Definitions
type Platform = "YOUTUBE" | "X" | "REDDIT";
type TabType = "All" | "YouTube" | "X" | "Reddit";

interface SearchResult {
  accountId: string;
  platform: Platform;
  handle: string;
  name: string;
  description: string;
  followerCount: number;
  imageUrl: string;
  categories: string[];
  rating: number;
  reviews: number;
}

interface ResultItemProps {
  action: ActionImpl;
  active: boolean;
  currentRootActionId: ActionId | null;
}

interface SearchComponentProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  activeTab: TabType;
}

interface CommandBarContentProps {
  children: ReactNode;
}

interface CommandBarProps {
  children: ReactNode;
}

interface GroupNameProps {
  name: string;
}

interface KBarAction {
  id: string;
  name: string;
  shortcut?: string[];
  keywords: string;
  section: string;
  perform: () => void;
  icon?: ReactNode;
  subtitle?: string;
}

// Helper function to type guard the search hits
function isSearchHit(hit: any): hit is SearchResult {
  return (
    typeof hit === "object" &&
    hit !== null &&
    typeof hit.objectID === "string" &&
    typeof hit.platform === "string" &&
    ["YOUTUBE", "X", "REDDIT"].includes(hit.platform)
  );
}

// Results rendering components
const ResultItem = forwardRef<HTMLDivElement, ResultItemProps>(
  ({ action, active, currentRootActionId }, ref) => {
    const ancestors = [...(action.ancestors || [])].reverse();

    return (
      <div
        ref={ref}
        className={`px-4 py-2 flex items-center justify-between cursor-pointer ${
          active
            ? "bg-accent text-accent-foreground rounded-md"
            : "text-foreground"
        }`}
      >
        <div className='flex items-center gap-2'>
          {action.icon && (
            <span className='text-muted-foreground'>{action.icon}</span>
          )}
          <div>
            <div className='flex items-center gap-2'>
              {ancestors.map((ancestor) => (
                <span
                  key={ancestor.id}
                  className='text-sm text-muted-foreground'
                >
                  {ancestor.name}
                </span>
              ))}
              <span>{action.name}</span>
            </div>
            {action.subtitle && (
              <span className='text-sm text-muted-foreground'>
                {action.subtitle}
              </span>
            )}
          </div>
        </div>
        {action.shortcut?.length ? (
          <div className='flex items-center uppercase gap-1'>
            {action.shortcut.map((sc) => (
              <kbd
                key={sc}
                className='px-2 py-1 text-xs bg-neutral-300 dark:bg-neutral-600 rounded-sm text-muted-foreground'
              >
                {sc}
              </kbd>
            ))}
          </div>
        ) : null}
      </div>
    );
  }
);

ResultItem.displayName = "ResultItem";

const GroupName = ({ name }: GroupNameProps): JSX.Element => (
  <div className='px-4 py-2 mt-2 text-xs font-medium text-muted-foreground uppercase'>
    {name}
  </div>
);

const RenderResults = (): JSX.Element => {
  const { results, rootActionId } = useMatches();

  return (
    <KBarResults
      items={results}
      onRender={({ item, active }) =>
        typeof item === "string" ? (
          <GroupName name={item} />
        ) : (
          <ResultItem
            action={item}
            active={active}
            currentRootActionId={rootActionId ?? null}
          />
        )
      }
    />
  );
};

const SearchComponent = ({
  searchTerm,
  onSearchChange,
  activeTab,
}: SearchComponentProps): JSX.Element => {
  const { refine } = useSearchBox();
  const { hits } = useHits();
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    refine(searchTerm);
  }, [searchTerm, refine]);

  useEffect(() => {
    const validHits = hits.filter(isSearchHit);
    let filtered = [...validHits];

    if (activeTab !== "All") {
      filtered = filtered.filter(
        (result) => result.platform === activeTab.toUpperCase()
      );
    }

    setFilteredResults(
      filtered.map((hit) => ({
        accountId: hit.objectID,
        platform: hit.platform as Platform,
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
            <div key={result.accountId}>
              {/* Replace with your CreatorCard component */}
              <CreatorCard key={result.accountId} {...result} />
            </div>
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

const tabs: readonly TabType[] = ["All", "YouTube", "X", "Reddit"] as const;

const CommandBarContent = ({
  children,
}: CommandBarContentProps): JSX.Element => {
  const router = useRouter();
  const searchClient = getSearchClient();
  const { query } = useKBar();

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabType>("All");
  const [showSearch, setShowSearch] = useState<boolean>(false);

  const resetSearch = useCallback(() => {
    setSearchTerm("");
    setActiveTab("All");
    setShowSearch(false);
  }, []);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setShowSearch(true);
  };

  const handleSearchRedirect = () => {
    if (searchTerm) {
      query.toggle();
      router.push(
        `/search?q=${encodeURIComponent(searchTerm)}${
          activeTab !== "All"
            ? `&platform=${encodeURIComponent(activeTab)}`
            : ""
        }`
      );
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSearchRedirect();
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
                  <CustomKBarSearch
                    defaultPlaceholder='Search creators and communities... '
                    className='w-full pl-10 pr-4 py-2 my-1 bg-muted text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring'
                    onChange={handleSearchChange}
                    value={searchTerm}
                    onKeyDown={handleKeyDown}
                  />

                  {/* <KBarSearch
                    className='w-full pl-10 pr-4 py-2 bg-muted text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring'
                    onChange={handleSearchChange}
                    value={searchTerm}
                    placeholder='Search creators or press ⌘+K for commands...'
                    onKeyDown={handleKeyDown}
                  /> */}

                  {searchTerm && (
                    <div className='flex ml-2'>
                      <Button onClick={handleSearchRedirect}>Search</Button>
                    </div>
                  )}
                </div>

                {showSearch ? (
                  <SearchComponent
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    activeTab={activeTab}
                  />
                ) : (
                  <RenderResults />
                )}
              </div>

              {showSearch && (
                <div className='flex border-t border-border'>
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      className={`flex-1 text-center py-2 ${
                        activeTab === tab
                          ? "border-t-2 border-primary"
                          : "bg-secondary text-muted-foreground hover:bg-primary hover:opacity-75 hover:text-accent-foreground"
                      }`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              )}
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

interface CustomSearchProps {
  defaultPlaceholder?: string;
  className?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  value?: string;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
}

export const CustomKBarSearch: React.FC<CustomSearchProps> = ({
  defaultPlaceholder = "Type your search here...",
  className = "",
  onChange,
  value,
  onKeyDown,
}) => {
  const { query, searchQuery, visualState } = useKBar((state) => ({
    searchQuery: state.searchQuery,
    visualState: state.visualState,
  }));

  return (
    <input
      ref={query.inputRefSetter}
      className={className}
      autoFocus={visualState === VisualState.showing}
      role='combobox'
      aria-expanded={visualState === VisualState.showing}
      aria-controls='kbar-listbox'
      aria-autocomplete='list'
      value={value || searchQuery}
      placeholder={defaultPlaceholder}
      onChange={onChange}
      onKeyDown={onKeyDown}
    />
  );
};
