"use client";

import { cn } from "@ratecreator/ui/utils";
import Image from "next/image";
import {
  SiInstagram,
  SiYoutube,
  SiX,
  SiReddit,
  SiTiktok,
  SiTwitch,
} from "@icons-pack/react-simple-icons";

import {
  CircleSlash2,
  MessageSquareMore,
  Minus,
  PlaySquare,
  ScrollText,
  StickyNote,
  UsersRound,
  Video,
  View,
} from "lucide-react";
import Link from "next/link";

import { SearchAccount } from "@ratecreator/types/review";
import { Avatar, AvatarFallback, AvatarImage, Badge } from "@ratecreator/ui";
import {
  formatDate,
  formatValue,
  fromSlug,
  getInitials,
  truncateText,
} from "@ratecreator/db/utils";
import { truncate } from "lodash";

const getPlatformIcon = (platform: string) => {
  switch (platform.toLowerCase()) {
    case "instagram":
      return <SiInstagram className="text-rose-700" size={32} />;
    case "youtube":
      return <SiYoutube className="text-red-500" size={32} />;
    case "twitter":
      return <SiX className="dark:text-neutral-500" size={32} />;
    case "reddit":
      return <SiReddit className="text-orange-600" size={32} />;
    case "tiktok":
      return <SiTiktok className="text-neutral-500" size={32} />;
    case "twitch":
      return <SiTwitch className="text-purple-500" size={32} />;
    default:
      return null;
  }
};
let colour = "";

const StarRating = ({ rating }: { rating: number }) => {
  const roundedRating = Math.floor(rating);

  switch (roundedRating) {
    case 0:
      colour = "text-red-600";
      break;
    case 1:
      colour = "text-red-500";
      break;
    case 2:
      colour = "text-orange-500";
      break;
    case 3:
      colour = "text-yellow-600";
      break;
    case 4:
      colour = "text-green-500";
      break;
    case 5:
      colour = "text-emerald-500";
      break;
    default:
      colour = "text-yellow-500";
      break;
  }
  return (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className={cn(
            "text-sm",
            i < roundedRating ? colour : "text-gray-400",
          )}
        >
          ★
        </span>
      ))}
    </div>
  );
};
interface CreatorProps {
  creator: SearchAccount;
}

export const CardForSearchResult: React.FC<CreatorProps> = ({ creator }) => {
  const {
    name = "",
    handle = "",
    imageUrl = "",
    followerCount = 0,
    rating = 0,
    reviewCount = 0,
    videoCount = 0,
    categories = [],
    platform,
    createdDate = "",
    bannerURL = "",
    viewCount = 0,
    objectID,
  } = creator;
  const defaultBg = cn(
    "bg-gradient-to-r",
    "from-[#ffffff] via-[#f3e8de] to-[#efd4d4]",
    "dark:from-[#646161] dark:via-[#333231] dark:to-[#0a0b0b]",
  );

  const displayCategories = categories.slice(0, 5).map(fromSlug);
  const remainingCount = Math.max(0, categories.length - 5);
  return (
    <div className="max-w-xs relative group/card h-96 cursor-pointer hover:shadow-lg transition-shadow duration-200">
      <Link href={`/profile/${platform.toLowerCase()}/${objectID}`}>
        {/* Top section with creator info */}
        <div
          className={cn("rounded-t-lg p-4 border-x border-t h-1/4", defaultBg)}
        >
          <div className="absolute w-full h-full top-0 left-0 transition duration-300 dark:group-hover/card:bg-black dark:group-hover/card:opacity-60 group-hover/card:bg-gray-100 group-hover/card:opacity-40 group-hover/card:rounded-t-lg"></div>
          <div className="flex flex-col  gap-1">
            {/* Profile and stats row */}
            <div className="flex items-center z-10 justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="">
                  <AvatarImage src={imageUrl} />
                  <AvatarFallback>{getInitials(name || "")}</AvatarFallback>
                </Avatar>

                <div>
                  <p className="font-medium text-base">
                    {truncateText(name, 15)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {truncateText(handle, 15)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <UsersRound size={16} className="text-primary" />
                  <span className="text-sm">{formatValue(followerCount)}</span>
                </div>

                <div className="flex items-center gap-2">
                  {platform === "reddit" ? (
                    <>
                      <StickyNote size={16} className="text-primary" />
                      <Minus size={12} className="text-secondary-foreground" />
                      <CircleSlash2 size={12} />
                    </>
                  ) : platform === "twitter" ? (
                    <>
                      <ScrollText size={16} className="text-primary" />
                      <span className="text-sm">
                        {formatValue(Number(videoCount))}
                      </span>
                    </>
                  ) : (
                    <>
                      <Video size={16} className="text-primary" />
                      <span className="text-sm">
                        {formatValue(Number(videoCount))}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Rating and icon row */}
            <div className="flex z-10 justify-between items-center">
              <div className="flex items-center gap-2 ml-2">
                <StarRating rating={rating} />{" "}
                <span className={`font-bold ${colour}`}>{rating}</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquareMore size={16} className="text-primary" />
                <span className="text-sm">{formatValue(reviewCount)}</span>
              </div>
              <div className="flex items-center gap-2">
                <View size={16} className="text-primary" />
                <span className="text-sm">{formatValue(viewCount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom section with categories */}
        <div
          style={
            bannerURL ? { backgroundImage: `url(${bannerURL})` } : undefined
          }
          className={cn(
            "rounded-b-lg p-4 relative overflow-hidden border-x border-b bg-cover bg-center h-3/4",
            !bannerURL && defaultBg,
          )}
        >
          <div className="absolute w-full h-full top-0 left-0 transition duration-300 dark:group-hover/card:bg-black dark:group-hover/card:opacity-60 group-hover/card:bg-gray-100 group-hover/card:opacity-40 grou-hover/card:rounded-b-lg"></div>

          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex justify-between items-center">
              <Badge
                variant="secondary"
                className="bg-opacity-20 hover:bg-opacity-30 text-[10px]"
              >
                Joined {formatDate(createdDate)}
              </Badge>
              {getPlatformIcon(platform)}
            </div>
            {/* Categories at the bottom */}
            <div className="flex flex-wrap gap-2">
              {displayCategories.map((category) => (
                <Badge
                  key={category}
                  variant="secondary"
                  className="bg-opacity-20 hover:bg-opacity-30 text-[10px]"
                >
                  {category}
                </Badge>
              ))}
              {remainingCount > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-opacity-20 hover:bg-opacity-30 text-[10px]"
                >
                  +{remainingCount} more
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};
