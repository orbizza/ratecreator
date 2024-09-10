"use client";

import React from "react";
import { SignIn } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { dark } from "@clerk/themes";
import Image from "next/image";

export default function Page() {
  const { theme } = useTheme();
  const clerkTheme = theme === "dark";
  return (
    <div className='w-full mt-14 lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px] mb-2'>
      <div className='flex items-center justify-center'>
        {clerkTheme && (
          <SignIn
            appearance={{
              baseTheme: dark,
            }}
            path='/sign-in'
          />
        )}
        {!clerkTheme && <SignIn />}
      </div>

      <div className='hidden lg:flex items-center justify-center h-full bg-[#F1EFE7] dark:bg-black'>
        {clerkTheme && (
          <Image
            src='/rc-dark.svg'
            alt='Image'
            layout='responsive' // Ensures the image is responsive
            width='1920'
            height='1080'
            className='w-full h-auto object-cover' // Makes the image responsive and cover the container area
          />
        )}
        {!clerkTheme && (
          <Image
            src='/rc-light.svg'
            alt='Image'
            layout='responsive' // Ensures the image is responsive
            width='1920'
            height='1080'
            className='w-full h-auto object-cover' // Makes the image responsive and cover the container area
          />
        )}
      </div>
    </div>
  );
}
