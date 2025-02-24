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
import { PopularAccount } from "@ratecreator/types/review";
import { formatValue, truncateText } from "@ratecreator/db/utils";

export function CardLandingVertical({
  imageUrl,
  name,
  handle,
  followerCount,
  rating,
  reviewCount,
  platform,
}: PopularAccount) {
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "instagram":
        return <SiInstagram className="text-rose-700" />;
      case "youtube":
        return <SiYoutube className="text-red-500" />;
      case "twitter":
        return <SiX className="text-black" />;
      case "reddit":
        return <SiReddit className="text-orange-500" />;
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
        "relative w-full  cursor-pointer overflow-hidden rounded-xl border p-4",
        "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
        "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
      )}
    >
      <div className="flex flex-row items-center gap-3">
        <img
          className="rounded-full"
          width="40"
          height="40"
          alt={truncateText(name, 5)}
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
      <div className="flex flex-row justify-between mt-2">
        <div className="flex flex-col items-center mt-2 text-muted-foreground text-sm gap-2">
          <UsersRound size={24} className="text-primary" />
          <span className="text-secondary-foreground dark:text-primary-foreground">
            {" "}
            {formatValue(followerCount)}
          </span>
        </div>
        <div className="flex flex-col items-center mt-2 gap-2">
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
          <div className="text-secondary-foreground dark:text-primary-foreground">
            {rating.toFixed(2)}{" "}
            <span className="ml-1 text-sm text-gray-600 items-center">
              ({formatValue(reviewCount)})
            </span>
          </div>
        </div>
      </div>
    </figure>
  );
}
