"use client";

import { useRouter } from "next/navigation";
import { useRecoilState } from "recoil";
import { useCallback, useEffect, useState } from "react";

import {
  Link,
  MailOpen,
  CodeXml,
  Home,
  CircleUserRound,
  PenLine,
  CircleDollarSign,
  Laptop,
  Hourglass,
  Library,
  // Youtube,
  Newspaper,
  Search,
  FolderRoot,
  X,
  UsersRound,
} from "lucide-react";

import {
  KBarAnimator,
  KBarProvider,
  KBarPortal,
  KBarPositioner,
  KBarSearch,
} from "kbar";

import { MostPopularCategories, showToastState } from "@ratecreator/store";
import { FilteredCategory, TabType } from "@ratecreator/types/review";
import { RenderResults } from "./commandbar-render-results";
import { CommandBarReset } from "./commandbar-reset";

const tabs: TabType[] = ["All", "Creators", "Communities", "Categories"];

export const CommandBar: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const [showToast, setShowToast] = useRecoilState(showToastState);

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabType>("All");
  // TODO: Fetch data from the server and serve the Most Popular Categories by default
  // TODO: List Actions by Default, clear on search
  const [filteredData, setFilteredData] = useState<FilteredCategory[]>(
    MostPopularCategories
  );

  const resetSearch = useCallback(() => {
    setSearchTerm("");
    setActiveTab("All");
    setFilteredData(MostPopularCategories);
  }, []);

  useEffect(() => {
    let filtered: FilteredCategory[] = MostPopularCategories;

    if (searchTerm) {
      filtered = MostPopularCategories.map((category) => ({
        ...category,
        items: category.items.filter(
          (item) =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.handle.toLowerCase().includes(searchTerm.toLowerCase())
        ),
      })).filter((category) => category.items.length > 0);
    }

    if (activeTab === "Creators") {
      filtered = filtered
        .map((category) => ({
          ...category,
          items: category.items.filter((item) => {
            if ("platform" in item) {
              return item.platform === "YOUTUBE";
            }
            return false;
          }),
        }))
        .filter((category) => category.items.length > 0);
    } else if (activeTab === "Categories") {
      filtered = [
        {
          name: "Categories",
          items: filtered.map((category) => ({
            name: category.name,
            isCategory: true as const,
          })),
        },
      ];
    } else if (activeTab === "Communities") {
      // For now, Communities tab is empty
      filtered = [];
    }

    setFilteredData(filtered);
  }, [searchTerm, activeTab]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const clearSearch = () => {
    resetSearch();
  };

  // useEffect(() => {
  //   const displayToast = () => {
  //     <div className='fixed bottom-5 right-5'>
  //       {/* {toast("Link copied to clipboard!", {
  //         action: {
  //           label: "Close",
  //           onClick: () => setShowToast(false),
  //         },
  //       })} */}
  //     </div>;
  //   };

  //   if (showToast) {
  //     displayToast();
  //     setShowToast(false);
  //   }
  // }, [showToast, setShowToast]);

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
      <KBarPortal>
        <KBarPositioner className='fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center pt-[14vh]'>
          <KBarAnimator className='w-full max-w-2xl bg-card text-card-foreground rounded-lg shadow-lg overflow-hidden flex flex-col'>
            <div className='p-4 flex-grow overflow-hidden'>
              <div className='relative'>
                <Search
                  className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground'
                  size={20}
                />
                <KBarSearch
                  className='w-full pl-10 pr-4 py-2 bg-muted text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring'
                  onChange={handleSearchChange}
                  value={searchTerm}
                  placeholder='Search creator, category, or community'
                />
                {searchTerm && (
                  <button
                    className='absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground'
                    onClick={clearSearch}
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
              <RenderResults
                filteredData={filteredData}
                activeTab={activeTab}
              />
            </div>
            <div className='flex border-t border-border'>
              {tabs.map((tab) => (
                <button
                  key={tab}
                  className={`flex-1 text-center py-2 ${
                    activeTab === tab
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
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
      <CommandBarReset onReset={resetSearch} />
      {children}
    </KBarProvider>
  );
};
