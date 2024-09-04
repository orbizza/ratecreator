"use client";

import React from "react";
import { Search, SquareMenu } from "lucide-react";

import {
  Button,
  Sheet,
  SheetContent,
  SheetTrigger,
  Separator,
} from "@ratecreator/ui";

export function MobileSideNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className='p-2' size={"icon"}>
          <SquareMenu size='30' />
        </Button>
      </SheetTrigger>
      <SheetContent className='w-[320px] border-l-1 '>
        <div className=' grid gap-4 py-4 w-[270px]'>
          <Button
            variant='ghost'
            className='items-center border-2 border-transparent rounded-md bg-secondary w-[270px] justify-start'
          >
            <Search />
            <input
              id='SearchSidebar'
              type='text'
              placeholder='Search creators ...'
              className='flex h-8 w-[270px] rounded-md bg-transparent hover:bg-accent hover:text-accent-foreground ring-0 focus:ring-0 focus:outline-none px-3 py-2 text-sm file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50'
            />
          </Button>

          <Separator className='my-4 w-[270px]' />
          <Button>Login</Button>
          <Button variant={"link"}>Write a review</Button>
          <Button variant={"ghost"}>Categories</Button>
          <Button variant={"ghost"}>Blog</Button>
          <Separator className='my-4' />
          <Button variant={"default"}>For Creators</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
