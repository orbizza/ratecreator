"use client";

import React from "react";
import { Button, Separator } from "@ratecreator/ui";
import { useRouter } from "next/navigation";

export function MainMenu() {
  const router = useRouter();

  return (
    <div className='flex items-center h-8 gap-x-2 xl:gap-3'>
      <Button variant={"ghost"} onClick={() => router.push("/creators")}>
        For creators
      </Button>
      <Separator orientation='vertical' />
      <Button variant={"link"} onClick={() => router.push("/write-review")}>
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
    </div>
  );
}
