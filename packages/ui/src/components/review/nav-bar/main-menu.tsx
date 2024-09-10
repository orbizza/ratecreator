"use client";

import React from "react";
import { useRouter } from "next/navigation";
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
} from "@ratecreator/ui";

export function MainMenu() {
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
    <div className='flex items-center h-8 gap-x-2 xl:gap-3'>
      {isSignedIn ? (
        // Render menu when user is signed in
        <>
          <Button variant={"ghost"} onClick={() => router.push("/")}>
            For creators
          </Button>
          <Separator orientation='vertical' />
          <Button variant={"link"} onClick={() => router.push("/")}>
            Write a review
          </Button>
          <Button variant={"ghost"} onClick={() => router.push("/categories")}>
            Categories
          </Button>
          <Button variant={"ghost"} onClick={() => router.push("/blog")}>
            Blog
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                className='hover:outline-none hover:bg-transparent focus-within:outline-none focus-within:bg-transparent'
              >
                <Avatar className=''>
                  <AvatarImage src={user?.imageUrl} />
                  <AvatarFallback>
                    {getInitials(
                      user?.fullName || user?.emailAddresses[0].toString() || ""
                    )}
                  </AvatarFallback>
                </Avatar>
                {/* <ChevronDown className='ml-2' /> */}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='w-56 mt-2 mr-4'>
              <DropdownMenuLabel>
                {user?.fullName
                  ? user.fullName
                      .split(" ")
                      .map(
                        (namePart) =>
                          namePart.charAt(0).toUpperCase() +
                          namePart.slice(1).toLowerCase()
                      )
                      .join(" ")
                  : user?.emailAddresses[0].toString().toLowerCase() ||
                    "Anonymous"}
              </DropdownMenuLabel>

              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <User className='mr-2 size-4' />
                  <span>Profile</span>
                  <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Star className='mr-2 size-4' />
                  <span>My Reviews</span>
                  <DropdownMenuShortcut>⌘R</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ClipboardList className='mr-2 size-4' />
                  <span>My Lists</span>
                  <DropdownMenuShortcut>⌘L</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className='mr-2 size-4' />
                <span>Settings</span>
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LifeBuoy className='mr-2 size-4' />
                <span>Help</span>
                <DropdownMenuShortcut>⌘H</DropdownMenuShortcut>
              </DropdownMenuItem>
              {/* Enable when billing feature is added */}
              {/* <DropdownMenuItem>
                <CreditCard className='mr-2 size-4' />
                <span>Billing</span>
                <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
              </DropdownMenuItem> */}

              <DropdownMenuItem>
                <Keyboard className='mr-2 size-4' />
                <span>Keyboard shortcuts</span>
                <DropdownMenuShortcut>⇧⌘K</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className='mr-2 size-4' />
                <span>Log out</span>
                <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : (
        // Render menu when user is not signed in
        <>
          <Button variant={"ghost"} onClick={() => router.push("/")}>
            For creators
          </Button>
          <Separator orientation='vertical' />
          <Button variant={"link"} onClick={() => router.push("/")}>
            Write a review
          </Button>
          <Button variant={"ghost"} onClick={() => router.push("/categories")}>
            Categories
          </Button>
          <Button variant={"ghost"} onClick={() => router.push("/blog")}>
            Blog
          </Button>
          <Button variant={"outline"} onClick={() => router.push("/sign-in")}>
            Log in
          </Button>
          <Button variant={"default"} onClick={() => router.push("/sign-up")}>
            Sign up
          </Button>
        </>
      )}
    </div>
  );
}
