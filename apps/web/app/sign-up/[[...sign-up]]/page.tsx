"use client";

import { SignUp } from "@clerk/nextjs";
import React from "react";

import { useTheme } from "next-themes";
import { dark } from "@clerk/themes";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

export default function Page() {
  const { theme } = useTheme();
  const clerkTheme = theme === "dark";
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url");
  return (
    <div className="w-full mt-14 lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px] mb-10">
      <div className="flex items-center justify-center">
        {clerkTheme && (
          <SignUp
            appearance={{
              baseTheme: dark,
            }}
            path="/sign-up"
            redirectUrl={redirectUrl || "/"}
          />
        )}
        {!clerkTheme && (
          <SignUp path="/sign-up" redirectUrl={redirectUrl || "/"} />
        )}
      </div>
      <div className="hidden lg:flex items-center justify-center h-full bg-[#F1EFE7] dark:bg-black">
        {clerkTheme && (
          <Image
            src="/rc-dark.svg"
            alt="Image"
            layout="responsive" // Ensures the image is responsive
            width="1920"
            height="1080"
            className="w-full h-auto object-cover" // Makes the image responsive and cover the container area
          />
        )}
        {!clerkTheme && (
          <Image
            src="/rc-light.svg"
            alt="Image"
            layout="responsive" // Ensures the image is responsive
            width="1920"
            height="1080"
            className="w-full h-auto object-cover" // Makes the image responsive and cover the container area
          />
        )}
      </div>
    </div>
  );
}
