"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Avatar, AvatarImage, AvatarFallback } from "@ratecreator/ui";
import { User } from "lucide-react";
import { cn } from "@ratecreator/ui/utils";
import { useAuth, useUser } from "@clerk/nextjs";
import { getInitials } from "@ratecreator/db/utils";

const getRatingColor = (rating: number) => {
  if (rating >= 4.5) return "text-emerald-500";
  if (rating >= 4.0) return "text-green-500";
  if (rating >= 3.0) return "text-yellow-500";
  if (rating >= 2.0) return "text-orange-500";
  if (rating >= 1.0) return "text-red-500";
  return "text-red-600";
};

const Star = ({ filled, color }: { filled: boolean; color: string }) => {
  return (
    <svg
      className={`sm:w-10 sm:h-10 w-6 h-6 ${filled ? color : "text-gray-400 dark:text-gray-600"}`}
      viewBox='0 0 24 24'
      fill={filled ? "currentColor" : "none"}
      stroke='currentColor'
      strokeWidth='1'
    >
      <path
        d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
};

const UserRatingCard = ({ accountId }: { accountId: string }) => {
  const router = useRouter();
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();

  const handleStarClick = (rating: number) => {
    router.push(`/review/create?stars=${rating}&accountId=${accountId}`);
  };

  const handleWriteReviewClick = () => {
    router.push(`/review/create?stars=0&accountId=${accountId}`);
  };

  return (
    <Card className='mt-10 mx-auto lg:mx-24 p-6 max-w-screen-md bg-card rounded-lg border'>
      <div className='flex flex-row items-center gap-4 md:gap-x-6'>
        <div>
          {!isSignedIn && (
            <div className='sm:w-20 sm:h-20 w-16 h-16 bg-neutral-200 dark:bg-neutral-600 rounded-full flex items-center justify-center shadow-lg'>
              <User className='w-10 h-10 text-neutral-900 dark:text-neutral-200' />
            </div>
          )}
          {isSignedIn && (
            <Avatar className='sm:w-20 sm:h-20 w-16 h-16'>
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback>
                {getInitials(
                  user?.fullName || user?.emailAddresses[0].toString() || ""
                )}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
        <div className='flex flex-col gap-2'>
          <div className='text-sm md:text-lg lg:text-xl '>
            {user?.fullName || user?.emailAddresses[0].toString() || ""}
          </div>
          <div
            onClick={handleWriteReviewClick}
            className='text-sm sm:text-lg md:text-xl lg:text-2xl text-primary hover:underline cursor-pointer'
          >
            Write a review
          </div>
        </div>

        <div
          className='flex gap-1 ml-auto'
          onMouseLeave={() => setHoveredRating(null)}
        >
          {[...Array(5)].map((_, index) => (
            <div
              key={index}
              className='cursor-pointer'
              onMouseEnter={() => setHoveredRating(index + 1)}
              onClick={() => handleStarClick(index + 1)}
            >
              <Star
                filled={hoveredRating !== null && index < hoveredRating}
                color={getRatingColor(hoveredRating || 0)}
              />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default UserRatingCard;
