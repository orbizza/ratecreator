"use client";

import { RecoilRoot } from "recoil";
import { ThemeProvider, TooltipProvider } from "@ratecreator/ui";

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <RecoilRoot>
        <TooltipProvider>{children}</TooltipProvider>
      </RecoilRoot>
    </ThemeProvider>
  );
}
