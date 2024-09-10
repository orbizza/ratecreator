"use client";

import React from "react";
import {
  Search,
  SquareMenu,
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
} from "lucide-react";
import { useRouter } from "next/navigation";
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
} from "@ratecreator/ui";

export function MobileSideNav() {
  const router = useRouter();
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();

  function getInitials(nameOrEmail: string) {
    if (!nameOrEmail) return "SD";

    const nameParts = nameOrEmail.split(" ");

    if (nameParts.length > 1) {
      const firstNameInitial = nameParts[0].charAt(0).toUpperCase();
      const lastNameInitial = nameParts[nameParts.length - 1]
        .charAt(0)
        .toUpperCase();
      return `${firstNameInitial}${lastNameInitial}`;
    } else {
      return nameOrEmail.charAt(0).toUpperCase();
    }
  }

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

          <SheetContent className="w-[320px] border-l-1 ">
            <SheetTitle>
              <Button
                variant="ghost"
                className="items-center  border-transparent rounded-md "
                size={"icon"}
              >
                <Search />
              </Button>
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
              <Button variant={"default"} className="w-[270px]">
                For creators
              </Button>
            </SheetClose>
            <Separator className="my-4 w-[270px]" />
            <div className=" grid gap-4 py-4 w-[270px]">
              {/* <div className=' grid gap-4 py-4 w-[270px]'> */}
              <SheetClose asChild>
                <Button
                  variant={"ghost"}
                  onClick={() => {}}
                  className="flex justify-between "
                >
                  <div className="flex items-center">
                    <User className="mr-4 size-4" />
                    <span>Profile</span>
                  </div>
                  <span>⇧⌘P</span>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button
                  variant={"ghost"}
                  onClick={() => {}}
                  className="flex justify-between "
                >
                  <div className="flex items-center">
                    <Star className="mr-4 size-4" />
                    <span>My Reviews</span>
                  </div>
                  <span>⌘R</span>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button
                  variant={"ghost"}
                  onClick={() => {}}
                  className="flex justify-between "
                >
                  <div className="flex items-center">
                    <ClipboardList className="mr-4 size-4" />
                    <span>My Lists</span>
                  </div>
                  <span>⌘L</span>
                </Button>
              </SheetClose>
              <Separator className="w-[270px]" />

              <SheetClose asChild>
                <Button
                  variant={"link"}
                  onClick={() => {}}
                  className="flex justify-between "
                >
                  <div className="flex items-center">
                    <PenLine className="mr-4 size-4" />
                    <span>Write a review</span>
                  </div>
                  <span>⌘W</span>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button
                  variant={"ghost"}
                  onClick={() => router.push("/categories")}
                  className="flex justify-between "
                >
                  <div className="flex items-center">
                    <Layers3 className="mr-4 size-4" />
                    <span>Categories</span>
                  </div>
                  <span>GC</span>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button
                  variant={"ghost"}
                  onClick={() => router.push("/blog")}
                  className="flex justify-between "
                >
                  <div className="flex items-center">
                    <Library className="mr-4 size-4" />
                    <span>Blog</span>
                  </div>
                  <span>GB</span>
                </Button>
              </SheetClose>

              <Separator className=" w-[270px]" />

              <SheetClose asChild>
                <Button
                  variant={"ghost"}
                  onClick={() => {}}
                  className="flex justify-between "
                >
                  <div className="flex items-center">
                    <Settings className="mr-4 size-4" />
                    <span>Settings</span>
                  </div>
                  <span>⌘S</span>
                </Button>
              </SheetClose>
              {/* <SheetClose asChild>
                  <Button
                    variant={"ghost"}
                    onClick={() => {}}
                    className='flex justify-between '
                  >
                    <div className='flex items-center'>
                      <CreditCard className='mr-4 size-4' />
                      <span>Billing</span>
                    </div>
                    <span>⌘B</span>
                  </Button>
                </SheetClose> */}
              <SheetClose asChild>
                <Button
                  variant={"ghost"}
                  onClick={() => {}}
                  className="flex justify-between "
                >
                  <div className="flex items-center">
                    <LifeBuoy className="mr-4 size-4" />
                    <span>Help</span>
                  </div>
                  <span>⌘H</span>
                </Button>
              </SheetClose>

              <SheetClose asChild>
                <Button
                  variant={"ghost"}
                  onClick={() => {}}
                  className="flex justify-between "
                >
                  <div className="flex items-center">
                    <Keyboard className="mr-4 size-4" />
                    <span>Keyboard shortcuts</span>
                  </div>
                  <span>⇧⌘K</span>
                </Button>
              </SheetClose>

              <Separator className="" />

              <SheetClose asChild>
                <Button
                  variant={"default"}
                  onClick={() => signOut()}
                  className="flex justify-between "
                >
                  <div className="flex items-center">
                    <LogOut className="mr-4 size-4" />
                    <span>Log out</span>
                  </div>
                  <span>⇧⌘Q</span>
                </Button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Sheet>
          <SheetTrigger asChild>
            <Button className="p-2" size={"icon"}>
              <SquareMenu size="30" />
            </Button>
          </SheetTrigger>

          <SheetContent className="w-[320px] border-l-1 ">
            <SheetTitle>
              <Button
                variant="ghost"
                className="items-center  border-transparent rounded-md "
                size={"icon"}
              >
                <Search />
              </Button>
            </SheetTitle>
            <Separator className="my-4 w-[270px]" />
            <div className=" grid gap-4 py-4 w-[270px]">
              <Button variant={"ghost"}>For creators</Button>
              {/* <Separator className='my-4 w-[270px]' /> */}
              <Button variant={"link"}>Write a review</Button>
              <SheetClose asChild>
                <Button
                  variant={"ghost"}
                  onClick={() => router.push("/categories")}
                >
                  Categories
                </Button>
              </SheetClose>
              <Button variant={"ghost"} onClick={() => router.push("/blog")}>
                Blog
              </Button>
              <Separator className="" />
              <SheetClose asChild>
                <Button
                  variant={"outline"}
                  onClick={() => router.push("/sign-in")}
                >
                  Log in
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button
                  variant={"default"}
                  onClick={() => router.push("/sign-up")}
                >
                  Sign up
                </Button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
