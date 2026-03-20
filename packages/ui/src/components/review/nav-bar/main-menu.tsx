"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth, useUser, SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import {
  ChevronDown,
  Star,
  CreditCard,
  ClipboardList,
  Keyboard,
  LifeBuoy,
  LogOut,
  Settings,
  User,
  SunMoon,
  BookOpen,
  Newspaper,
  Layers3,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Separator,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  ModeToggle,
  IconToggle,
} from "@ratecreator/ui";
import { NotificationBell } from "@ratecreator/ui/common";
import {
  getUnreadCountAction,
  getNotificationsAction,
  markAsReadAction,
  markAllAsReadAction,
  clearAllReadAction,
} from "@ratecreator/actions";
import { ny } from "@ratecreator/ui/utils";
import { getInitials } from "@ratecreator/db/utils";

const isProtectedRoute = (path: string) => {
  return path.startsWith("/review") || path.startsWith("/user-profile");
};

const HELP_CENTER_ITEMS = [
  {
    path: "/blog",
    icon: Newspaper,
    label: "Blog",
    description: "Creator economy insights",
  },
  {
    path: "/glossary",
    icon: BookOpen,
    label: "Glossary",
    description: "Creator economy terms explained",
  },
  {
    path: "/category-glossary",
    icon: Layers3,
    label: "Categories Glossary",
    description: "Browse creator categories",
  },
];

function HelpCenterDropdown({
  onNavigate,
}: {
  onNavigate: (path: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  }, []);

  const handleLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  }, []);

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <Button variant="ghost" className="gap-1">
        Help Center
        <ChevronDown
          className={`size-3.5 opacity-60 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 rounded-md border bg-popover text-popover-foreground p-1 shadow-lg z-50 animate-in fade-in-0 zoom-in-95 duration-100">
          {HELP_CENTER_ITEMS.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                onNavigate(item.path);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-sm px-3 py-3 text-left text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
            >
              <item.icon className="size-4 text-muted-foreground shrink-0" />
              <div>
                <div className="font-medium">{item.label}</div>
                <div className="text-xs text-muted-foreground">
                  {item.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function MainMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleNavigation = (path: string) => {
    if (!isSignedIn && isProtectedRoute(path)) {
      const returnUrl = encodeURIComponent(path);
      router.push(`/sign-in?redirect_url=${returnUrl}`);
    } else {
      router.push(path);
    }
  };

  return (
    <div className="flex items-center h-8 gap-x-2 xl:gap-3">
      {isSignedIn ? (
        // Render menu when user is signed in
        <>
          <Button
            variant={"ghost"}
            onClick={() =>
              window.open("https://creator.ratecreator.com/", "_blank")
            }
          >
            For creators
          </Button>
          <Separator orientation="vertical" />
          <Button variant={"link"} onClick={() => handleNavigation("/search")}>
            Write a review
          </Button>
          <Button
            variant={"ghost"}
            onClick={() => handleNavigation("/categories")}
          >
            Categories
          </Button>
          {/* <Button variant={"ghost"} onClick={() => handleNavigation("/wip")}>
            Blog
          </Button> */}
          <HelpCenterDropdown onNavigate={handleNavigation} />

          <NotificationBell
            getUnreadCount={getUnreadCountAction}
            getNotifications={getNotificationsAction}
            markAsRead={markAsReadAction}
            markAllAsRead={markAllAsReadAction}
            clearAllRead={clearAllReadAction}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="hover:outline-none hover:bg-transparent focus-within:outline-none focus-within:bg-transparent"
              >
                <Avatar className="">
                  <AvatarImage src={user?.imageUrl} />
                  <AvatarFallback>
                    {getInitials(
                      user?.fullName ||
                        user?.emailAddresses[0].toString() ||
                        "",
                    )}
                  </AvatarFallback>
                </Avatar>
                {/* <ChevronDown className='ml-2' /> */}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mt-2 mr-4">
              <DropdownMenuLabel>
                {user?.fullName
                  ? user.fullName
                      .split(" ")
                      .map(
                        (namePart) =>
                          namePart.charAt(0).toUpperCase() +
                          namePart.slice(1).toLowerCase(),
                      )
                      .join(" ")
                  : user?.emailAddresses[0].toString().toLowerCase() ||
                    "Anonymous"}
              </DropdownMenuLabel>

              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => handleNavigation("/user-profile")}
                >
                  <User className="mr-2 size-4" />
                  <span>Profile</span>
                  <DropdownMenuShortcut>MP</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigation("/wip")}>
                  <Star className="mr-2 size-4" />
                  <span>My Reviews</span>
                  <DropdownMenuShortcut>MR</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigation("/my-lists")}>
                  <ClipboardList className="mr-2 size-4" />
                  <span>My Lists</span>
                  <DropdownMenuShortcut>ML</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleNavigation("/wip")}>
                <Settings className="mr-2 size-4" />
                <span>Settings</span>
                <DropdownMenuShortcut>GS</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNavigation("/wip")}>
                <LifeBuoy className="mr-2 size-4" />
                <span>Help</span>
                <DropdownMenuShortcut>MH</DropdownMenuShortcut>
              </DropdownMenuItem>
              {/* Enable when billing feature is added */}
              {/* <DropdownMenuItem onClick={() => router.push("/wip")}>
                <CreditCard className='mr-2 size-4' />
                <span>Billing</span>
                <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
              </DropdownMenuItem> */}

              <DropdownMenuItem onClick={() => handleNavigation("/wip")}>
                <Keyboard className="mr-2 size-4" />
                <span>Keyboard shortcuts</span>
                <DropdownMenuShortcut>GK</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => e.preventDefault()}>
                <SunMoon className="mr-2 size-4" />
                <span>Dark Mode</span>
                <DropdownMenuShortcut className="opacity-100">
                  <IconToggle />
                </DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await signOut();
                  router.push("/");
                }}
              >
                <LogOut className="mr-2 size-4" />
                <span>Log out</span>
                <DropdownMenuShortcut>SO</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : (
        // Render menu when user is not signed in
        <>
          <Button
            variant={"ghost"}
            onClick={() =>
              window.open("https://creator.ratecreator.com/", "_blank")
            }
          >
            For creators
          </Button>
          <Separator orientation="vertical" />
          <Button variant={"link"} onClick={() => handleNavigation("/search")}>
            Write a review
          </Button>
          <Button
            variant={"ghost"}
            onClick={() => handleNavigation("/categories")}
          >
            Categories
          </Button>
          {/* <Button variant={"ghost"} onClick={() => handleNavigation("/wip")}>
            Blog
          </Button> */}
          <HelpCenterDropdown onNavigate={handleNavigation} />
          <Button variant={"outline"} onClick={() => setShowAuthModal(true)}>
            Log in
          </Button>
          <Button variant={"default"} onClick={() => setShowAuthModal(true)}>
            Get Started
          </Button>
          <div className="hidden lg:block">
            <ModeToggle />
          </div>

          <DialogPrimitive.Root
            open={showAuthModal}
            onOpenChange={setShowAuthModal}
          >
            <DialogPrimitive.Portal>
              <DialogPrimitive.Overlay
                className={ny(
                  "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
                  "data-[state=open]:animate-in data-[state=closed]:animate-out",
                  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                )}
              />
              <DialogPrimitive.Content
                className={ny(
                  "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
                  "data-[state=open]:animate-in data-[state=closed]:animate-out",
                  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                  "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                  "outline-none",
                )}
              >
                <DialogPrimitive.Title className="sr-only">
                  Sign in to Rate Creator
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="sr-only">
                  Sign in or create an account to continue.
                </DialogPrimitive.Description>
                <SignIn
                  routing="hash"
                  appearance={{
                    baseTheme: isDark ? dark : undefined,
                  }}
                  fallbackRedirectUrl={pathname}
                />
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          </DialogPrimitive.Root>
        </>
      )}
    </div>
  );
}
