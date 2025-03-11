"use client";

import React from "react";
import { SignIn } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { dark } from "@clerk/themes";
import { useSearchParams } from "next/navigation";

export default function Page() {
  const { theme } = useTheme();
  const clerkTheme = theme === "dark";
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url");
  return (
    <div className='w-full mt-14 min-h-[600px] flex items-center justify-center mb-2'>
      <div className='flex items-center justify-center'>
        {clerkTheme && (
          <SignIn
            appearance={{
              baseTheme: dark,
            }}
            path='/sign-in'
            redirectUrl={redirectUrl || "/"}
          />
        )}
        {!clerkTheme && (
          <SignIn path='/sign-in' redirectUrl={redirectUrl || "/"} />
        )}
      </div>
    </div>
  );
}
