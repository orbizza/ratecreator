"use client";

import React from "react";
import { Button, Separator } from "@ratecreator/ui";

export function MainMenu() {
  return (
    <div className='flex items-center h-8 gap-x-2 xl:gap-3'>
      <Button variant={"default"}>For Creators</Button>
      <Separator orientation='vertical' />
      <Button variant={"link"}>Write a review</Button>
      <Button variant={"ghost"}>Categories</Button>
      <Button variant={"ghost"}>Blog</Button>
      <Button variant={"default"}>Login</Button>
    </div>
  );
}
