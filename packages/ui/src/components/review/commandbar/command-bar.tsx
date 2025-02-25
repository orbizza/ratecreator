"use client";

import { useRouter } from "next/navigation";
import { useRecoilState } from "recoil";
import { useCallback, useEffect, useState, forwardRef } from "react";
import type { ReactNode, ChangeEvent, KeyboardEvent } from "react";
import {
  InstantSearch,
  useHits,
  useSearchBox,
  useInstantSearch,
} from "react-instantsearch";
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
  Book,
  UserRound,
  Settings,
  HelpCircle,
  Keyboard,
  List,
  LogOut,
  LogIn,
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
import { useAuth } from "@clerk/nextjs";
import { Skeleton } from "@ratecreator/ui";

// Type Definitions
type Platform = "YOUTUBE" | "X" | "TIKTOK" | "REDDIT";
type TabType = "All" | "YouTube" | "X" | "TikTok" | "Reddit";

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
    typeof hit.handle === "string" &&
    typeof hit.name === "string"
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
        <div className="flex items-center gap-2">
          {action.icon && (
            <span className="text-muted-foreground">{action.icon}</span>
          )}
          <div>
            <div className="flex items-center gap-2">
              {ancestors.map((ancestor) => (
                <span
                  key={ancestor.id}
                  className="text-sm text-muted-foreground"
                >
                  {ancestor.name}
                </span>
              ))}
              <span>{action.name}</span>
            </div>
            {action.subtitle && (
              <span className="text-sm text-muted-foreground">
                {action.subtitle}
              </span>
            )}
          </div>
        </div>
        {action.shortcut?.length ? (
          <div className="flex items-center uppercase gap-1">
            {action.shortcut.map((sc) => (
              <kbd
                key={sc}
                className="px-2 py-1 text-xs bg-neutral-300 dark:bg-neutral-600 rounded-sm text-muted-foreground"
              >
                {sc}
              </kbd>
            ))}
          </div>
        ) : null}
      </div>
    );
  },
);

ResultItem.displayName = "ResultItem";

const GroupName = ({ name }: GroupNameProps): JSX.Element => (
  <div className="px-4 py-2 mt-2 text-xs font-medium text-muted-foreground uppercase">
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
}: SearchComponentProps): JSX.Element => {
  const { refine } = useSearchBox();
  const { hits, results } = useHits();
  const { status } = useInstantSearch();
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const { query } = useKBar();
  const router = useRouter();

  useEffect(() => {
    refine(searchTerm || "");
  }, [searchTerm, refine]);

  useEffect(() => {
    const validHits = hits.filter(isSearchHit);
    const sortedResults = validHits.sort((a, b) => {
      return b.followerCount - a.followerCount;
    });

    setFilteredResults(
      sortedResults.map((hit) => ({
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
      })),
    );
  }, [hits]);

  return (
    <div className="mt-4 min-h-[300px]">
      {status === "loading" ? (
        <div className="space-y-4">
          <div className="px-4 py-2 text-sm text-muted-foreground">
            Loading results... In the meantime, you can:
          </div>
          <div className="space-y-2">
            <div
              onClick={() => {
                query.toggle();
                router.push("/write-review");
              }}
              className="px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-md"
            >
              <PenLine size={20} className="text-muted-foreground" />
              <div>
                <div>Write a Review</div>
                <div className="text-sm text-muted-foreground">
                  Share your experience about a creator
                </div>
              </div>
            </div>
            <div
              onClick={() => {
                query.toggle();
                router.push("/categories");
              }}
              className="px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-md"
            >
              <Book size={20} className="text-muted-foreground" />
              <div>
                <div>Browse Categories</div>
                <div className="text-sm text-muted-foreground">
                  Explore creators by category
                </div>
              </div>
            </div>
            <div
              onClick={() => {
                query.toggle();
                router.push("/my-lists");
              }}
              className="px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-md"
            >
              <List size={20} className="text-muted-foreground" />
              <div>
                <div>Create Lists</div>
                <div className="text-sm text-muted-foreground">
                  Organize creators into custom lists
                </div>
              </div>
            </div>
            <div
              onClick={() => {
                query.toggle();
                router.push("/blogs");
              }}
              className="px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-md"
            >
              <Newspaper size={20} className="text-muted-foreground" />
              <div>
                <div>Read Blog</div>
                <div className="text-sm text-muted-foreground">
                  Latest updates and creator insights
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : filteredResults.length > 0 ? (
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {filteredResults.map((result) => (
            <div key={result.accountId}>
              <CreatorCard
                key={result.accountId}
                {...result}
                setOpen={() => query.toggle()}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          No results found.
        </div>
      )}
    </div>
  );
};

const CommandBarContent = ({
  children,
}: CommandBarContentProps): JSX.Element => {
  const router = useRouter();
  const searchClient = getSearchClient();
  const { query } = useKBar();

  const [searchTerm, setSearchTerm] = useState<string>("");

  const resetSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchRedirect = () => {
    if (searchTerm) {
      query.toggle();
      const searchParams = new URLSearchParams();
      searchParams.set("q", searchTerm);
      router.push(`/search?${searchParams.toString()}`);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSearchRedirect();
    }
  };

  return (
    <>
      <InstantSearch searchClient={searchClient} indexName="accounts">
        <KBarPortal>
          <KBarPositioner className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center pt-[14vh]">
            <KBarAnimator className="w-full max-w-2xl bg-card text-card-foreground rounded-lg shadow-lg overflow-hidden flex flex-col">
              <div className="p-4 flex-grow overflow-hidden">
                <div className="relative flex items-center">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                    size={20}
                  />
                  <CustomKBarSearch
                    defaultPlaceholder="Type name, description or category... "
                    className="w-full pl-10 pr-4 py-2 my-1 bg-muted text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    onChange={handleSearchChange}
                    value={searchTerm}
                    onKeyDown={handleKeyDown}
                  />

                  {searchTerm && (
                    <div className="flex ml-2">
                      <Button onClick={handleSearchRedirect}>Search</Button>
                    </div>
                  )}
                </div>

                <SearchComponent
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                />
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
  const router = useRouter();
  const { signOut } = useAuth();

  // Keyboard shortcuts
  const actions = [
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
      perform: () => window.open("https://creator.ratecreator.com", "_blank"),
      icon: <CodeXml size={20} />,
    },
    {
      id: "write-review",
      name: "Write Review",
      shortcut: ["w", "r"],
      keywords: "write-review",
      section: "General",
      perform: () => router.push("/write-review"),
      icon: <CircleUserRound size={20} />,
    },
    {
      id: "blogs",
      name: "Blogs",
      shortcut: ["g", "b"],
      keywords: "go-blogs",
      section: "General",
      perform: () => router.push("/blogs"),
      icon: <PenLine size={20} />,
    },
    {
      id: "newsletter",
      name: "Newsletter",
      shortcut: ["g", "n"],
      keywords: "go-newsletter",
      section: "General",
      perform: () => router.push("/newsletter"),
      icon: <Newspaper size={20} />,
    },
    {
      id: "glossary",
      name: "Glossary",
      shortcut: ["g", "g"],
      keywords: "go-glossary",
      section: "General",
      perform: () => router.push("/glossary"),
      icon: <Book size={20} />,
    },
    {
      id: "categories",
      name: "Categories",
      shortcut: ["g", "c"],
      keywords: "go-categories",
      section: "General",
      perform: () => router.push("/categories"),
      icon: <Book size={20} />,
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
      id: "settings",
      name: "Settings",
      shortcut: ["g", "s"],
      keywords: "go-settings",
      section: "General",
      perform: () => router.push("/settings"),
      icon: <Settings size={20} />,
    },
    {
      id: "help",
      name: "Help",
      shortcut: ["m", "h"],
      keywords: "my-help",
      section: "General",
      perform: () => router.push("/help"),
      icon: <HelpCircle size={20} />,
    },
    {
      id: "keyboard-shortcuts",
      name: "Keyboard Shortcuts",
      shortcut: ["g", "k"],
      keywords: "go-keyboard-shortcuts",
      section: "General",
      perform: () => router.push("/keyboard-shortcuts"),
      icon: <Keyboard size={20} />,
    },

    {
      id: "profile",
      name: "Profile",
      shortcut: ["m", "p"],
      keywords: "go-profile",
      section: "User Section",
      perform: () => router.push("/user-profile"),
      icon: <UserRound size={20} />,
    },
    {
      id: "my-reviews",
      name: "My Reviews",
      shortcut: ["m", "r"],
      keywords: "go-my-reviews",
      section: "User Section",
      perform: () => router.push("/my-reviews"),
      icon: <Book size={20} />,
    },
    {
      id: "my-lists",
      name: "My Lists",
      shortcut: ["m", "l"],
      keywords: "go-my-lists",
      section: "User Section",
      perform: () => router.push("/my-lists"),
      icon: <List size={20} />,
    },
    {
      id: "sign-out",
      name: "Sign Out",
      shortcut: ["s", "o"],
      keywords: "sign-out",
      section: "User Section",
      perform: () => signOut(),
      icon: <LogOut size={20} />,
    },
    {
      id: "sign-in",
      name: "Sign In",
      shortcut: ["s", "i"],
      keywords: "sign-in",
      section: "User Section",
      perform: () => router.push("/sign-in"),
      icon: <LogIn size={20} />,
    },
    {
      id: "sign-up",
      name: "Sign Up",
      shortcut: ["s", "u"],
      keywords: "sign-up",
      section: "User Section",
      perform: () => router.push("/sign-up"),
      icon: <UserRound size={20} />,
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
      role="combobox"
      aria-expanded={visualState === VisualState.showing}
      aria-controls="kbar-listbox"
      aria-autocomplete="list"
      value={value || searchQuery}
      placeholder={defaultPlaceholder}
      onChange={onChange}
      onKeyDown={onKeyDown}
    />
  );
};
