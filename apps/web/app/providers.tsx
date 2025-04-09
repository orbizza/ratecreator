"use client";

import React from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ThemeProvider, TooltipProvider } from "@ratecreator/ui";
import { CommandBar } from "@ratecreator/ui/review";
import { RecoilRoot } from "recoil";

// Create a client
const queryClient = new QueryClient();

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <RecoilRoot>
          <CommandBar>
            <TooltipProvider>{children}</TooltipProvider>
          </CommandBar>
        </RecoilRoot>
      </ThemeProvider>
    </QueryClientProvider>
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
