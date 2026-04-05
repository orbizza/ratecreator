"use client";

import React from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ThemeProvider, TooltipProvider } from "@ratecreator/ui";
import { CommandBar } from "@ratecreator/ui/review";
import { RecoilRoot } from "recoil";

const queryClient = new QueryClient();

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: "/ingest",
        ui_host: "https://us.posthog.com",
        capture_pageview: true,
        capture_pageleave: true,
        person_profiles: "always",
      });
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    if (user) {
      const email = user.emailAddresses?.[0]?.emailAddress;
      posthog.identify(user.id, {
        email: email,
        name: user.fullName || user.firstName || email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        createdAt: user.createdAt,
      });
    } else {
      posthog.reset();
    }
  }, [user, isLoaded]);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}

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
