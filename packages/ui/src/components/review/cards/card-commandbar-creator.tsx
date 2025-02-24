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

  const handleClick = () => {
    setOpen();
    router.push(`/profile/${platform.toLowerCase()}/${accountId}`);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full bg-card hover:bg-accent text-card-foreground p-3 rounded-md flex items-center justify-between transition-colors duration-200"
    >
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
      <div className="flex items-center">
        <div className="text-right mr-5">
          <div className="flex flex-row p-1 gap-x-1">
            <UsersRound size={18} className="text-primary" />
            <p className="text-sm font-medium">{formatValue(followerCount)}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatFloat(rating || 0)} ({formatValue(reviews || 0)} reviews)
          </p>
        </div>
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
              return null; // Or you could return a default icon here
          }
        })()}
      </div>
    </button>
  );
};
