"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Avatar, AvatarImage, AvatarFallback } from "@ratecreator/ui";
import { User } from "lucide-react";
import { cn } from "@ratecreator/ui/utils";
import { useAuth, useUser } from "@clerk/nextjs";
import { getInitials } from "@ratecreator/db/utils";

/**
 * UserRatingCard Component
 *
 * A card component that allows users to rate creators and write reviews.
 * Features include:
 * - Interactive star rating system
 * - User profile display
 * - Hover effects for ratings
 * - Platform-specific review creation
 * - Responsive design
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.accountId - The creator's account ID
 * @param {string} props.platform - The platform (youtube, twitter, tiktok, reddit)
 * @returns {JSX.Element} A rating card with user profile and star rating interface
 */

const getRatingColor = (rating: number) => {
  /**
   * Determines the color class for a rating value
   * @param {number} rating - The rating value (1-5)
   * @returns {string} CSS class name for the rating color
   */
  if (rating >= 4.5) return "text-emerald-500";
  if (rating >= 4.0) return "text-green-500";
  if (rating >= 3.0) return "text-yellow-500";
  if (rating >= 2.0) return "text-orange-500";
  if (rating >= 1.0) return "text-red-500";
  return "text-red-600";
};

const Star = ({ filled, color }: { filled: boolean; color: string }) => {
  /**
   * Star Component
   *
   * Renders a single star in the rating interface
   * @param {Object} props - Component props
   * @param {boolean} props.filled - Whether the star should be filled
   * @param {string} props.color - The color class for the star
   * @returns {JSX.Element} A star icon with appropriate styling
   */
  return (
    <svg
      className={`sm:w-10 sm:h-10 w-6 h-6 ${filled ? color : "text-gray-400 dark:text-gray-600"}`}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1"
    >
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const UserRatingCard = ({
  accountId,
  platform,
}: {
  accountId: string;
  platform: string;
}) => {
  const router = useRouter();
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();

  /**
   * Handles star click events
   * Navigates to the review creation page with the selected rating
   * @param {number} rating - The selected rating value
   */
  const handleStarClick = (rating: number) => {
    router.push(
      `/review/create?stars=${rating}&platform=${platform}&accountId=${accountId}`,
    );
  };

  /**
   * Handles the "Write a review" click event
   * Navigates to the review creation page without a pre-selected rating
   */
  const handleWriteReviewClick = () => {
    router.push(
      `/review/create?stars=0&platform=${platform}&accountId=${accountId}`,
    );
  };

  return (
    <Card className="mt-10 mx-auto lg:mx-24 p-6 max-w-screen-md bg-card rounded-lg border">
      <div className="flex flex-row items-center gap-4 md:gap-x-6">
        <div>
          {!isSignedIn && (
            <div className="sm:w-20 sm:h-20 w-16 h-16 bg-neutral-200 dark:bg-neutral-600 rounded-full flex items-center justify-center shadow-lg">
              <User className="w-10 h-10 text-neutral-900 dark:text-neutral-200" />
            </div>
          )}
          {isSignedIn && (
            <Avatar className="sm:w-20 sm:h-20 w-16 h-16">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback>
                {getInitials(
                  user?.fullName || user?.emailAddresses[0].toString() || "",
                )}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-sm md:text-lg lg:text-xl ">
            {user?.fullName || user?.emailAddresses[0].toString() || ""}
          </div>
          <div
            onClick={handleWriteReviewClick}
            className="text-sm sm:text-lg md:text-xl lg:text-2xl text-primary hover:underline cursor-pointer"
          >
            Write a review
          </div>
        </div>

        <div
          className="flex gap-1 ml-auto"
          onMouseLeave={() => setHoveredRating(null)}
        >
          {[...Array(5)].map((_, index) => (
            <div
              key={index}
              className="cursor-pointer"
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
