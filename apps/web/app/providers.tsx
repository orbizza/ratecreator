"use client";

import React from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

import { ThemeProvider, TooltipProvider } from "@ratecreator/ui";
import { CommandBar } from "@ratecreator/ui/review";
import { RecoilRoot } from "recoil";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <RecoilRoot>
        <CommandBar>
          <TooltipProvider>{children}</TooltipProvider>
        </CommandBar>
      </RecoilRoot>
    </ThemeProvider>
  );
};

if (typeof window !== "undefined") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || "", {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    person_profiles: "always", // or 'always' to create profiles for anonymous users as well.
    //identified_only -> for only identified
  });
  console.log(process.env.NEXT_PUBLIC_POSTHOG_KEY);
}
export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
