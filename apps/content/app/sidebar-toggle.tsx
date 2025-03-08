"use client";

import { Separator } from "@ratecreator/ui";

import { SidebarTrigger } from "@ratecreator/ui";
import { useAuth } from "@clerk/nextjs";
export function SidebarToggle() {
  const { isSignedIn } = useAuth();
  return isSignedIn ? (
    <header className="flex h-16 shrink-0 items-center gap-2">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
      </div>
    </header>
  ) : (
    <></>
  );
}
