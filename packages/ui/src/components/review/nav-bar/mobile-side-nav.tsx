"use client";

import React from "react";
import { Search, SquareMenu } from "lucide-react";

import {
  Button,
  Sheet,
  SheetContent,
  SheetTrigger,
  Separator,
  SheetTitle,
} from "@ratecreator/ui";

export function MobileSideNav() {
  return (
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
        <div className=" grid gap-4 py-4 w-[270px]">
          <Button variant={"ghost"}>For creators</Button>
          {/* <Separator className='my-4 w-[270px]' /> */}
          <Button variant={"link"}>Write a review</Button>
          <Button variant={"ghost"}>Categories</Button>
          <Button variant={"ghost"}>Blog</Button>
          <Separator className="" />
          <Button variant={"outline"}>Log in</Button>
          <Button>Sign up</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
