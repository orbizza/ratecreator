"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { UsersRound } from "lucide-react";
import {
  SiInstagram,
  SiYoutube,
  SiX,
  SiReddit,
  SiTiktok,
  SiTwitch,
} from "@icons-pack/react-simple-icons";

import { SearchCreator } from "@ratecreator/types/review";
import { formatFloat, formatValue } from "@ratecreator/db/utils";

/**
 * CreatorCard Component
 *
 * A card component used in the command bar to display creator search results.
 * Shows creator information including profile image, name, handle, follower count,
 * rating, and platform icon. Clicking the card navigates to the creator's profile.
 *
 * @component
 * @param {SearchCreator & { setOpen: () => void }} props - Component props
 * @param {string} props.name - Creator's name
 * @param {string} props.platform - Social media platform
 * @param {string} props.accountId - Creator's account ID
 * @param {string} props.handle - Creator's handle/username
 * @param {number} props.followerCount - Number of followers
 * @param {number} props.rating - Average rating
 * @param {number} props.reviews - Number of reviews
 * @param {string} props.imageUrl - Profile image URL
 * @param {() => void} props.setOpen - Function to close the command bar
 * @returns {JSX.Element} A creator card component for the command bar
 */
export const CreatorCard: React.FC<
  SearchCreator & {
    setOpen: () => void;
  }
> = ({
  name,
  platform,
  accountId,
  handle,
  followerCount,
  rating,
  reviews,
  imageUrl,
  setOpen,
}) => {
  const router = useRouter();

  /**
   * Handles the click event on the card
   * Closes the command bar and navigates to the creator's profile
   */
  const handleClick = () => {
    setOpen();
    router.push(`/profile/${platform.toLowerCase()}/${accountId}`);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full bg-card hover:bg-accent text-card-foreground p-3 rounded-md flex items-center justify-between transition-colors duration-200"
    >
      {/* Left section: Profile image and basic info */}
      <div className="flex items-center">
        <img
          src={imageUrl}
          alt={name}
          className="w-10 h-10 rounded-full mr-3"
        />
        <div className="text-left">
          <h4 className="font-medium">{name}</h4>
          <p className="text-sm text-muted-foreground">{handle}</p>
        </div>
      </div>

      {/* Right section: Stats and platform icon */}
      <div className="flex items-center">
        {/* Stats: Follower count, rating, and review count */}
        <div className="text-right mr-5">
          <div className="flex flex-row p-1 gap-x-1">
            <UsersRound size={18} className="text-primary" />
            <p className="text-sm font-medium">{formatValue(followerCount)}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatFloat(rating || 0)} ({formatValue(reviews || 0)} reviews)
          </p>
        </div>

        {/* Platform icon based on the creator's platform */}
        {(() => {
          switch (platform) {
            case "YOUTUBE":
              return <SiYoutube size={28} />;
            case "INSTAGRAM":
              return <SiInstagram size={28} />;
            case "X":
            case "TWITTER":
              return <SiX size={28} />;
            case "REDDIT":
              return <SiReddit size={28} />;
            case "TIKTOK":
              return <SiTiktok size={28} />;
            case "TWITCH":
              return <SiTwitch size={28} />;
            default:
              return null;
          }
        })()}
      </div>
    </button>
  );
};
