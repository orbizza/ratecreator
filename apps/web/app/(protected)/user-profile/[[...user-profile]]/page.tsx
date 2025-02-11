"use client";

import { UserProfile } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import Image from "next/image";
import React from "react";

const Logo = () => {
  return (
    <div className='w-5 h-5 relative'>
      <Image src='/logo.svg' alt='Logo' fill className='object-contain' />
    </div>
  );
};

const UserProfilePage = () => {
  const { theme } = useTheme();
  const clerkTheme = theme === "dark";

  return (
    <div className='w-full mt-14  mb-2'>
      <div className='flex items-center justify-center'>
        {clerkTheme && (
          <UserProfile
            path='/user-profile'
            routing='path'
            appearance={{
              baseTheme: dark,
            }}
          >
            <UserProfile.Link label='Homepage' labelIcon={<Logo />} url='/' />
          </UserProfile>
        )}
        {!clerkTheme && (
          <UserProfile path='/user-profile' routing='path'>
            <UserProfile.Link label='Homepage' labelIcon={<Logo />} url='/' />
          </UserProfile>
        )}
      </div>
    </div>
  );
};

export default UserProfilePage;
