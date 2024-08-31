"use client";

import React from "react";

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
