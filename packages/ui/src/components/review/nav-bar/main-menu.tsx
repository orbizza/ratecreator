"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";

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
import { getInitials } from "@ratecreator/db/utils";

const isProtectedRoute = (path: string) => {
  return path.startsWith("/review") || path.startsWith("/user-profile");
};

export function MainMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();

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
          <Button
            variant={"ghost"}
            onClick={() => handleNavigation("/category-glossary")}
          >
            Help Center
          </Button>

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
                <DropdownMenuItem onClick={() => handleNavigation("/wip")}>
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
          <Button
            variant={"ghost"}
            onClick={() => handleNavigation("/category-glossary")}
          >
            Help Center
          </Button>
          <Button
            variant={"outline"}
            onClick={() => {
              const returnUrl = encodeURIComponent(pathname);
              router.push(`/sign-in?redirect_url=${returnUrl}`);
            }}
          >
            Log in
          </Button>
          <Button
            variant={"default"}
            onClick={() => {
              const returnUrl = encodeURIComponent(pathname);
              router.push(`/sign-up?redirect_url=${returnUrl}`);
            }}
          >
            Get Started
          </Button>
          <div className="hidden lg:block">
            <ModeToggle />
          </div>
        </>
      )}
    </div>
  );
}
