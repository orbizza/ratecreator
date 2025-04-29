"use client";

import React from "react";
import { UsersRound } from "lucide-react";
import {
  SiInstagram,
  SiYoutube,
  SiX,
  SiReddit,
  SiTiktok,
  SiTwitch,
} from "@icons-pack/react-simple-icons";
import { ny } from "@ratecreator/ui/utils";
import { formatValue, truncateText } from "@ratecreator/db/utils";

/**
 * CardLandingHorizontal Component
 *
 * A horizontal card component used on the landing page to display creator information.
 * Shows creator details including profile image, name, handle, follower count,
 * rating, and platform icon in a compact horizontal layout.
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.imageUrl - Creator's profile image URL
 * @param {string} props.name - Creator's name
 * @param {string} props.handle - Creator's handle/username
 * @param {number} props.followerCount - Number of followers
 * @param {number} props.rating - Average rating
 * @param {number} props.reviews - Number of reviews
 * @param {string} props.platform - Social media platform
 * @returns {JSX.Element} A horizontal landing card component
 */
export function CardLandingHorizontal({
  imageUrl,
  name,
  handle,
  followerCount,
  rating,
  reviews,
  platform,
}: {
  imageUrl: string;
  name: string;
  handle: string;
  followerCount: number;
  rating: number;
  reviews: number;
  platform: string;
}) {
  /**
   * Returns the appropriate platform icon component based on the platform name
   * @param {string} platform - The name of the social media platform
   * @returns {JSX.Element | null} The platform icon component or null if platform is not supported
   */
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "instagram":
        return <SiInstagram className="text-rose-700" />;
      case "youtube":
        return <SiYoutube className="text-red-500" />;
      case "twitter":
        return <SiX />;
      case "reddit":
        return <SiReddit />;
      case "tiktok":
        return <SiTiktok />;
      case "twitch":
        return <SiTwitch />;
      default:
        return null;
    }
  };

  return (
    <figure
      className={ny(
        "relative w-64 cursor-pointer overflow-hidden rounded-xl border p-4",
        // light styles
        "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
        // dark styles
        "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
      )}
    >
      {/* Top section: Profile info and platform icon */}
      <div className="flex flex-row items-center gap-3">
        <img
          className="rounded-full"
          width="40"
          height="40"
          alt={name}
          src={imageUrl}
        />
        <div className="flex flex-col">
          <figcaption className="text-sm font-medium dark:text-white">
            {truncateText(name, 15)}
          </figcaption>
          <p className="mt-1 text-xs font-medium dark:text-white/40">
            {truncateText(handle, 20)}
          </p>
        </div>
        <div className="ml-auto">{getPlatformIcon(platform)}</div>
      </div>

      {/* Bottom section: Stats and rating */}
      <div className="flex flex-row justify-between mt-2">
        {/* Follower count */}
        <div className="flex flex-col items-center mt-2 text-muted-foreground text-sm gap-2">
          <UsersRound size={24} className="text-primary" />
          <span className="text-secondary-foreground dark:text-primary-foreground">
            {" "}
            {formatValue(followerCount)}
          </span>
        </div>

        {/* Rating and review count */}
        <div className="flex flex-col items-center mt-2 gap-2">
          {/* Star rating display */}
          <div className="flex flex-row mr-1 text-primary">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`text-sm text-${i < Math.floor(rating) ? "yellow" : "gray"}-400`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
          {/* Rating value and review count */}
          <div className="text-secondary-foreground dark:text-primary-foreground">
            {rating}{" "}
            <span className="ml-1 text-sm text-gray-600 items-center">
              ({reviews})
            </span>
          </div>
        </div>
      </div>
    </figure>
  );
}
