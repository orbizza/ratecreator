"use client";

import React from "react";
import { Search, SquareMenu } from "lucide-react";

import {
  Button,
  Input,
  Label,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Separator,
} from "@ratecreator/ui";

export function MobileSideNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" className="mr-4">
          <SquareMenu size="20" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <div className=" grid gap-4 py-4">
          <div className="block lg:hidden">
            <Button
              variant="ghost"
              className="items-center border-2 border-transparent rounded-md"
            >
              <Search />
              <input
                id="SearchMD"
                type="text"
                placeholder="Search creators ..."
                className="flex h-8 w-[270px] rounded-md bg-transparent hover:bg-accent hover:text-accent-foreground ring-0 focus:ring-0 focus:outline-none px-3 py-2 text-sm file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50"
              />
            </Button>
          </div>
          <Separator className="my-4" />
          <Button>Get Started</Button>
          <Button variant={"ghost"}>Login</Button>
          <Button variant={"ghost"}>Categories</Button>
          <Button variant={"ghost"}>Blog</Button>
          <Separator className="my-4" />
          <Button>For Creators</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
