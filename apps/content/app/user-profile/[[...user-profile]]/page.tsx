"use client";

import { UserProfile } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import React from "react";
import { RateCreatorLogo } from "@ratecreator/ui/common";

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
            <UserProfile.Link
              label='Homepage'
              labelIcon={<RateCreatorLogo />}
              url='/'
            />
          </UserProfile>
        )}
        {!clerkTheme && (
          <UserProfile path='/user-profile' routing='path'>
            <UserProfile.Link
              label='Homepage'
              labelIcon={<RateCreatorLogo />}
              url='/'
            />
          </UserProfile>
        )}
      </div>
    </div>
  );
};

export default UserProfilePage;
