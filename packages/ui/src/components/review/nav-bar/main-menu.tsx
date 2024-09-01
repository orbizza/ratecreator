"use client";

import React from "react";
import { Button, Separator } from "@ratecreator/ui";

export function MainMenu() {
  return (
    <div className="flex items-center h-8 gap-3">
      <Button>For Creators</Button>
      <Separator orientation="vertical" />
      <Button variant={"ghost"}>Categories</Button>
      <Button variant={"ghost"}>Blog</Button>
      <Button variant={"ghost"}>Login</Button>
      <Button>Get Started</Button>
    </div>
  );
}
