// packages/auth/clerk-provider.tsx
import { ClerkProvider } from "@clerk/nextjs";
import React from "react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <ClerkProvider>{children}</ClerkProvider>;
}
