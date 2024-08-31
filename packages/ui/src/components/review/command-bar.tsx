"use client";

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
} from "lucide-react";

import {
  KBarAnimator,
  KBarProvider,
  KBarPortal,
  KBarPositioner,
  KBarSearch,
  KBarResults,
  useMatches,
} from "kbar";

import { useRouter } from "next/navigation";
import { useRecoilState } from "recoil";

import { showToastState } from "@ratecreator/store";
import { useEffect } from "react";

export const CommandBar = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [showToast, setShowToast] = useRecoilState(showToastState);

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    const displayToast = () => {
      <div className="fixed bottom-5 right-5">
        {/* {toast("Link copied to clipboard!", {
          action: {
            label: "Close",
            onClick: () => setShowToast(false),
          },
        })} */}
      </div>;
    };

    if (showToast) {
      displayToast();
      setShowToast(false);
    }
  }, [showToast, setShowToast]);

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
      id: "source",
      name: "View Source",
      shortcut: ["s"],
      keywords: "view-source",
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
    <>
      <KBarProvider actions={actions}>
        <KBarPortal>
          <KBarPositioner className="fixed flex items-start justify-center w-full inset-0 py-[14vh] px-4 bg-black bg-opacity-80 box-border">
            <KBarAnimator className="bg-[#1a1c1e] max-w-[600px] w-full text-primary rounded-lg overflow-hidden support:backdrop-blur support:backdrop-saturate-300 support:backdrop-filter-blur-25 ">
              <div className="overflow-hidden scrollbar-hide">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="w-5 h-5 text-gray-400" />{" "}
                  </div>

                  <KBarSearch
                    placeholder="Type a command or search…"
                    className="pl-10 pr-4 py-2 w-full outline-none border-none m-0 text-primary bg-[#1a1c1e]"
                  />
                </div>
                <RenderResults />
              </div>
            </KBarAnimator>
          </KBarPositioner>
        </KBarPortal>
        {children}
      </KBarProvider>
    </>
  );
};

function RenderResults() {
  const { results } = useMatches();

  if (results.length === 0) {
    return (
      <div className="p-4 text-neutral-500 text-center">No results found.</div>
    );
  }

  return (
    <KBarResults
      items={results}
      onRender={({ item, active }) =>
        typeof item === "string" ? (
          <div className="p-4 text-xs uppercase tracking-wider ">{item}</div>
        ) : (
          <ResultItem action={item} active={active} />
        )
      }
    />
  );
}

interface ResultItemProps {
  action: any;
  active: boolean;
}

const ResultItem: React.FC<ResultItemProps> = ({ action, active }) => {
  return (
    <div
      className={`p-4 z-10 flex justify-between items-center   cursor-pointer transition-colors duration-200 ease-in-out text-neutral-400  ${
        active
          ? "text-primary bg-neutral-700 bg-opacity-90 hover:text-primary hover:bg-neutral-700 hover:bg-opacity-90"
          : " "
      }`}
    >
      <div className="flex gap-2 items-center">
        {action.icon}
        <div className="flex flex-col ">
          <span>{action.name}</span>
        </div>
      </div>
      {action.shortcut?.length ? (
        <div className="grid grid-flow-col gap-1">
          {action.shortcut.map((shortcut: string) => (
            <div
              className="bg-white bg-opacity-10 text-primary-foreground p-1 uppercase rounded-sm text-sm w-6 text-center"
              key={shortcut}
            >
              {shortcut}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};
