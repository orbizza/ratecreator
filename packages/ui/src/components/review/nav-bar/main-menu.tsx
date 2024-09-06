"use client";

import React from "react";
import { Button, Separator } from "@ratecreator/ui";

export function MainMenu() {
  return (
    <div className='flex items-center h-8 gap-x-2 xl:gap-3'>
      <Button variant={"ghost"}>For creators</Button>
      <Separator orientation='vertical' />
      <Button variant={"link"}>Write a review</Button>
      <Button variant={"ghost"}>Categories</Button>
      <Button variant={"ghost"}>Blog</Button>
      <Button variant={"outline"}>Log in</Button>
      <Button variant={"default"}>Sign up</Button>
    </div>
  );
}
