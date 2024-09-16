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

export const CreatorCard: React.FC<SearchCreator> = ({
  name,
  platform,
  accountId,
  handle,
  followerCount,
  rating,
  reviews,
  imageUrl,
}) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/creator/${platform.toLowerCase()}/${accountId}`);
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)} M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)} K`;
    return value.toString();
  };

  return (
    <button
      onClick={handleClick}
      className='w-full bg-card hover:bg-accent text-card-foreground p-3 rounded-md flex items-center justify-between transition-colors duration-200'
    >
      <div className='flex items-center'>
        <img
          src={imageUrl}
          alt={name}
          className='w-10 h-10 rounded-full mr-3'
        />
        <div className='text-left'>
          <h4 className='font-medium'>{name}</h4>
          <p className='text-sm text-muted-foreground'>{handle}</p>
        </div>
      </div>
      <div className='flex items-center'>
        <div className='text-right mr-5'>
          <div className='flex flex-row p-1 gap-x-1'>
            <UsersRound size={18} className='text-primary' />
            <p className='text-sm font-medium'>{formatValue(followerCount)}</p>
          </div>
          <p className='text-xs text-muted-foreground'>
            {rating} ({reviews} reviews)
          </p>
        </div>
        {(() => {
          switch (platform) {
            case "YOUTUBE":
              return <SiYoutube className='text-destructive' size={28} />;
            case "INSTAGRAM":
              return <SiInstagram className='text-destructive' size={28} />;
            case "X":
              return <SiX className='text-destructive' size={28} />;
            case "REDDIT":
              return <SiReddit className='text-destructive' size={28} />;
            case "TIKTOK":
              return <SiTiktok className='text-destructive' size={28} />;
            case "TWITCH":
              return <SiTwitch className='text-destructive' size={28} />;
            default:
              return null; // Or you could return a default icon here
          }
        })()}
      </div>
    </button>
  );
};
