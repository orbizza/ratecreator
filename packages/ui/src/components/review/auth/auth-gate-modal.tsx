"use client";

import React, { useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import { ny } from "@ratecreator/ui/utils";

export function AuthGateModal({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isDark = theme === "dark";

  // Capture the URL on first render (before any auth redirects)
  const returnUrl = useRef(
    pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ""),
  );

  if (!isLoaded) {
    return <>{children}</>;
  }

  if (isSignedIn) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="pointer-events-none select-none blur-sm brightness-75">
        {children}
      </div>

      <DialogPrimitive.Root
        open={true}
        onOpenChange={(open) => {
          if (!open) {
            router.push("/");
          }
        }}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            className={ny(
              "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            )}
          />
          <DialogPrimitive.Content
            className={ny(
              "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
              "outline-none",
            )}
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <DialogPrimitive.Title className="sr-only">
              Sign in to continue
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              Please sign in or create an account to access this page.
            </DialogPrimitive.Description>

            <div className="flex flex-col items-center gap-4">
              <SignIn
                routing="hash"
                appearance={{
                  baseTheme: isDark ? dark : undefined,
                }}
                forceRedirectUrl={returnUrl.current}
              />

              <button
                onClick={() => router.push("/")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
              >
                Back to home
              </button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
