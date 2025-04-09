"use client";

import React, { useCallback } from "react";
import {
  Search,
  ChevronDown,
  Star,
  CreditCard,
  ClipboardList,
  Keyboard,
  LifeBuoy,
  LogOut,
  Settings,
  User,
  StarHalf,
  PenLine,
  Library,
  Layers3,
  LogIn,
  UserPlus,
  SunMoon,
  Menu,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";

import {
  Button,
  Sheet,
  SheetContent,
  SheetTrigger,
  Separator,
  SheetTitle,
  SheetClose,
  Avatar,
  AvatarImage,
  AvatarFallback,
  SheetHeader,
  ModeToggle,
  IconToggle,
} from "@ratecreator/ui";
import { useKBar } from "kbar";

import { getInitials } from "@ratecreator/db/utils";

const isProtectedRoute = (path: string) => {
  return path.startsWith("/review") || path.startsWith("/user-profile");
};

export function MobileSideNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const { query } = useKBar();

  const handleNavigation = (path: string) => {
    if (!isSignedIn && isProtectedRoute(path)) {
      const returnUrl = encodeURIComponent(path);
      router.push(`/sign-in?redirect_url=${returnUrl}`);
    } else {
      router.push(path);
    }
  };

  const handleSerarchClick = useCallback(() => {
    query.toggle();
  }, [query]);

  return (
    <>
      {isSignedIn ? (
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="hover:outline-none hover:bg-transparent focus-within:outline-none focus-within:bg-transparent"
            >
              <Avatar className="drop-shadow-md dark:drop-shadow-lg hover:drop-shadow-2xl dark:hover:drop-shadow-2xl transition-shadow duration-200">
                <AvatarImage src={user?.imageUrl} />
                <AvatarFallback>
                  {getInitials(
                    user?.fullName || user?.emailAddresses[0].toString() || "",
                  )}
                </AvatarFallback>
              </Avatar>
            </Button>
          </SheetTrigger>

          <SheetContent className="w-[320px] border-l-1 overflow-y-auto max-h-screen">
            <SheetTitle>
              <SheetClose asChild>
                <Button
                  variant="ghost"
                  className="items-center border-transparent rounded-md"
                  size={"icon"}
                  onClick={handleSerarchClick}
                >
                  <Search />
                </Button>
              </SheetClose>
            </SheetTitle>

            <SheetTitle className="p-2 flex items-center justify-center">
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
            </SheetTitle>
            <Separator className="my-4 w-[270px]" />
            <SheetClose asChild>
              <Button
                variant={"default"}
                className="w-[270px]"
                onClick={() =>
                  window.open("https://creator.ratecreator.com/", "_blank")
                }
              >
                For creators
              </Button>
            </SheetClose>
            <Separator className="my-4 w-[270px]" />
            <div className="grid gap-2 py-4 w-[270px]">
              <SheetClose asChild>
                <Button
                  variant={"ghost"}
                  onClick={() => handleNavigation("/user-profile")}
                  className="flex justify-between"
                >
                  <div className="flex items-center">
                    <User className="mr-4 size-4" />
                    <span>Profile</span>
                  </div>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button
                  variant={"ghost"}
                  onClick={() => handleNavigation("/wip")}
                  className="flex justify-between"
                >
                  <div className="flex items-center">
                    <Star className="mr-4 size-4" />
                    <span>My Reviews</span>
                  </div>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button
                  variant={"ghost"}
                  onClick={() => handleNavigation("/wip")}
                  className="flex justify-between"
                >
                  <div className="flex items-center">
                    <ClipboardList className="mr-4 size-4" />
                    <span>My Lists</span>
                  </div>
                </Button>
              </SheetClose>
              <Separator className="w-[270px]" />

              <SheetClose asChild>
                <Button
                  variant={"link"}
                  onClick={() => handleNavigation("/search")}
                  className="flex justify-between"
                >
                  <div className="flex items-center">
                    <PenLine className="mr-4 size-4" />
                    <span>Write a review</span>
                  </div>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button
                  variant={"ghost"}
                  onClick={() => handleNavigation("/categories")}
                  className="flex justify-between"
                >
                  <div className="flex items-center">
                    <Layers3 className="mr-4 size-4" />
                    <span>Categories</span>
                  </div>
                </Button>
              </SheetClose>
              {/* <SheetClose asChild>
                <Button
                  variant={"ghost"}
                  onClick={() => handleNavigation("/wip")}
                  className='flex justify-between'
                >
                  <div className='flex items-center'>
                    <Library className='mr-4 size-4' />
                    <span>Blog</span>
                  </div>
                </Button>
              </SheetClose> */}
              <SheetClose asChild>
                <Button
                  variant={"ghost"}
                  onClick={() => handleNavigation("/categories-glossary")}
                  className="flex justify-between"
                >
                  <div className="flex items-center">
                    <Library className="mr-4 size-4" />
                    <span>Help Center</span>
                  </div>
                </Button>
              </SheetClose>

              <Separator className="w-[270px]" />

              <SheetClose asChild>
                <Button
                  variant={"ghost"}
                  onClick={() => handleNavigation("/wip")}
                  className="flex justify-between"
                >
                  <div className="flex items-center">
                    <Settings className="mr-4 size-4" />
                    <span>Settings</span>
                  </div>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button
                  variant={"ghost"}
                  onClick={() => handleNavigation("/wip")}
                  className="flex justify-between"
                >
                  <div className="flex items-center">
                    <LifeBuoy className="mr-4 size-4" />
                    <span>Help</span>
                  </div>
                </Button>
              </SheetClose>

              <SheetClose asChild>
                <Button
                  variant={"ghost"}
                  onClick={() => handleNavigation("/wip")}
                  className="flex justify-between"
                >
                  <div className="flex items-center">
                    <Keyboard className="mr-4 size-4" />
                    <span>Keyboard shortcuts</span>
                  </div>
                </Button>
              </SheetClose>

              <Separator className="" />

              <SheetClose asChild>
                <div className="flex justify-between px-2 py-2 ml-2">
                  <div className="flex items-center">
                    <SunMoon className="mr-4 size-4" />
                    <span className="text-sm">Dark Mode</span>
                  </div>
                  <IconToggle />
                </div>
              </SheetClose>

              <Separator className="" />

              <SheetClose asChild>
                <Button
                  variant={"default"}
                  onClick={async () => {
                    await signOut();
                    router.push("/");
                  }}
                >
                  <div className="flex items-center">
                    <LogOut className="mr-4 size-4" />
                    <span>Log out</span>
                  </div>
                </Button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Sheet>
          <SheetTrigger asChild>
            <Button className="p-2" size={"icon"} variant={"outline"}>
              <Menu size="30" />
            </Button>
          </SheetTrigger>

          <SheetContent className="w-[320px] border-l-1 overflow-y-auto max-h-screen">
            <SheetTitle>
              <SheetClose asChild>
                <Button
                  variant="ghost"
                  className="items-center border-transparent rounded-md"
                  size={"icon"}
                  onClick={handleSerarchClick}
                >
                  <Search />
                </Button>
              </SheetClose>
            </SheetTitle>
            <Separator className="my-4 w-[270px]" />
            <div className="grid gap-2 py-4 w-[270px]">
              <SheetClose asChild>
                <Button
                  variant={"default"}
                  className="w-[270px]"
                  onClick={() =>
                    window.open("https://creator.ratecreator.com/", "_blank")
                  }
                >
                  For creators
                </Button>
              </SheetClose>
              <Separator className="my-4 w-[270px]" />

              <SheetClose asChild>
                <Button
                  variant={"link"}
                  onClick={() => handleNavigation("/search")}
                  className="flex justify-between"
                >
                  <div className="flex items-center">
                    <PenLine className="mr-4 size-4" />
                    <span>Write a review</span>
                  </div>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button
                  variant={"ghost"}
                  onClick={() => handleNavigation("/categories")}
                  className="flex justify-between"
                >
                  <div className="flex items-center">
                    <Layers3 className="mr-4 size-4" />
                    <span>Categories</span>
                  </div>
                </Button>
              </SheetClose>
              {/* <SheetClose asChild>
                <Button
                  variant={"ghost"}
                  onClick={() => handleNavigation("/wip")}
                  className='flex justify-between'
                >
                  <div className='flex items-center'>
                    <Library className='mr-4 size-4' />
                    <span>Blog</span>
                  </div>
                </Button>
              </SheetClose> */}
              <SheetClose asChild>
                <Button
                  variant={"ghost"}
                  onClick={() => handleNavigation("/categories-glossary")}
                  className="flex justify-between"
                >
                  <div className="flex items-center">
                    <Library className="mr-4 size-4" />
                    <span>Help Center</span>
                  </div>
                </Button>
              </SheetClose>

              <SheetClose asChild>
                <div className="flex justify-between px-2 py-2 ml-2">
                  <div className="flex items-center">
                    <SunMoon className="mr-4 size-4" />
                    <span className="text-sm">Dark Mode</span>
                  </div>
                  <IconToggle />
                </div>
              </SheetClose>

              <Separator className="w-[270px]" />
              <SheetClose asChild>
                <Button
                  variant={"default"}
                  onClick={() => {
                    const returnUrl = encodeURIComponent(pathname);
                    router.push(`/sign-up?redirect_url=${returnUrl}`);
                  }}
                >
                  <div className="flex items-center">
                    <UserPlus className="mr-4 size-4" />
                    <span>Get Started</span>
                  </div>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button
                  variant={"outline"}
                  onClick={() => {
                    const returnUrl = encodeURIComponent(pathname);
                    router.push(`/sign-in?redirect_url=${returnUrl}`);
                  }}
                >
                  <div className="flex items-center">
                    <LogIn className="mr-4 size-4" />
                    <span>Log in</span>
                  </div>
                </Button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
