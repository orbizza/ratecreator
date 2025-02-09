"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Label,
  Separator,
} from "@ratecreator/ui";
import Image from "next/image";
import {
  Heart,
  Star,
  Youtube,
  Check,
  Verified,
  BadgeAlert,
  StarHalf,
} from "lucide-react";
import { cn } from "@ratecreator/ui/utils";
import type { CreatorData } from "@ratecreator/types/review";
import { getInitials, truncateText } from "@ratecreator/db/utils";

export const defaultBg = cn(
  "bg-gradient-to-r",
  "from-[#ffffff] via-[#f3e8de] to-[#efd4d4]",
  "dark:from-[#646161] dark:via-[#333231] dark:to-[#0a0b0b]",
);

const ratingOptions = [
  {
    range: [4.5, 5.0],
    color: "text-emerald-500",
  },
  {
    range: [4.0, 4.4],
    color: "text-green-500",
  },
  {
    range: [3.0, 3.9],
    color: "text-yellow-500",
  },
  {
    range: [2.0, 2.9],
    color: "text-orange-500",
  },
  {
    range: [1.0, 1.9],
    color: "text-red-500",
  },
  {
    range: [0, 0.9],
    color: "text-red-600",
  },
];
const RatingStars: React.FC<{ count: number | null }> = ({ count }) => {
  if (count === null) return null;

  const getRatingColor = (rating: number) => {
    return (
      ratingOptions.find(
        (option) => rating >= option.range[0] && rating <= option.range[1],
      )?.color || "text-muted-foreground"
    );
  };

  // Handle ratings less than 0.5
  if (count < 0.5) {
    return (
      <div className="flex items-center space-x-[1px]">
        <div className="relative w-4 h-4">
          <StarHalf
            size={16}
            className="fill-current text-muted-foreground absolute left-0"
          />
          <StarHalf
            size={16}
            className="fill-current text-muted-foreground absolute left-0 transform scale-x-[-1]"
          />
        </div>
        {Array.from({ length: 4 }).map((_, index) => (
          <Star
            key={`empty-${index}`}
            size={16}
            className="fill-current text-muted-foreground"
          />
        ))}
      </div>
    );
  }

  const roundedCount = Math.round(count * 2) / 2;
  const fullStars = Math.floor(roundedCount);
  const hasHalfStar = roundedCount % 1 === 0.5;
  const remainingStars = 5 - Math.ceil(roundedCount);
  const starColor = getRatingColor(count);

  return (
    <div className="flex items-center space-x-[1px]">
      {/* Full stars */}
      {Array.from({ length: fullStars }).map((_, index) => (
        <Star
          key={`full-${index}`}
          size={16}
          className={`fill-current ${starColor}`}
        />
      ))}

      {/* Half star */}
      {hasHalfStar && (
        <div className="relative w-4 h-4">
          <StarHalf
            size={16}
            className={`fill-current ${starColor} absolute left-0`}
          />
          <StarHalf
            size={16}
            className={`fill-current text-muted-foreground absolute left-0 transform scale-x-[-1]`}
          />
        </div>
      )}

      {/* Empty stars */}
      {Array.from({ length: remainingStars }).map((_, index) => (
        <Star
          key={`empty-${index}`}
          size={16}
          className="fill-current text-muted-foreground"
        />
      ))}
    </div>
  );
};

const ChannelNavigation = ({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) => {
  const tabs = [
    { name: "About", id: "channel-header" },
    { name: "Channel Details", id: "channel-details" },
    { name: "Reviews", id: "reviews" },
    { name: "Categories", id: "categories" },
    // "Videos",
    // "Alternatives",
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = id === "channel-header" ? 80 : 125; // Adjust this value based on your header height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <nav className="flex justify-center lg:justify-start gap-1 md:gap-3 lg:gap-4 py-2">
      {tabs.map((tab) => (
        <button
          key={tab.name}
          onClick={() => {
            onTabChange(tab.name);
            scrollToSection(tab.id);
          }}
          className={cn(
            "px-4 py-2 text-sm transition-colors hover:text-primary",
            activeTab === tab.name
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground",
          )}
        >
          {tab.name}
        </button>
      ))}
    </nav>
  );
};

const ChannelHeader = ({ account }: { account: CreatorData["account"] }) => {
  const [isSticky, setIsSticky] = useState(false);
  const [activeTab, setActiveTab] = useState("About");
  const navigationRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (navigationRef.current && headerRef.current) {
        const headerBottom = headerRef.current.getBoundingClientRect().bottom;
        const navTop = navigationRef.current.getBoundingClientRect().top;

        setIsSticky(headerBottom < 0 && navTop <= 60);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      id="channel-header"
      className="relative max-w-screen-2xl mx-auto"
      ref={headerRef}
    >
      {/* Banner Section */}
      <div className="relative w-full h-[250px] md:h-[300px] lg:h-[400px] bg-muted rounded-lg ">
        {account.ytData?.brandingSettings?.image?.bannerExternalUrl ? (
          <Image
            src={
              account.ytData.brandingSettings.image.bannerExternalUrl +
              "=w1707-fcrop64=1"
            }
            alt={`${account.name_en}'s banner`}
            fill
            priority
            className="object-cover rounded-lg drop-shadow-2xl"
            sizes="100vw"
          />
        ) : (
          <div className={cn("w-full h-full rounded-lg", defaultBg)} />
        )}

        <div className="absolute -bottom-32 left-6">
          <Avatar className="w-36 h-36 rounded-lg border-2 border-border drop-shadow-lg">
            <AvatarImage
              src={
                account.ytData?.snippet?.thumbnails?.high?.url ||
                account.imageUrl
              }
            />
            <AvatarFallback className="w-36 h-36 text-primary text-5xl rounded-lg border-2 border-border drop-shadow-lg">
              {getInitials(account.name_en)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <Card className="w-full border-none rounded-none bg-background">
        <CardHeader className="pt-4 pl-48 space-y-6">
          <div className="flex flex-col space-y-4 md:space-y-6 md:flex-row justify-between lg:items-start">
            <div className="items-center">
              <h1 className="text-xl sm:text-2xl font-bold ml-4">
                {account.name_en}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground ml-4 mb-2">
                {account.handle}
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center sm:gap-2 ml-4">
                <div className="flex items-center gap-x-1 mb-1 sm:mb-0">
                  <RatingStars count={account.rating || 0} />
                  <span className="text-md text-primary">
                    ({account.rating || 0})
                  </span>
                  <Separator
                    orientation="vertical"
                    className="hidden sm:block h-5 mr-2 bg-secondary-foreground"
                  />
                </div>
                <div className="flex items-center text-md text-green-500">
                  {account.reviewCount > 1
                    ? `${account.reviewCount} reviews`
                    : `${account.reviewCount} review`}
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-start sm:items-center sm:gap-2 ">
                <div className="flex items-center gap-x-1 mb-1 sm:mb-0 ">
                  <Link href="#">
                    <Button
                      variant="link"
                      className="flex items-center gap-2 text-primary"
                    >
                      <Heart className="w-4 h-4" />
                      Save to My Lists
                    </Button>
                  </Link>
                  <Separator
                    orientation="vertical"
                    className="hidden sm:block h-5 mr-4 bg-secondary-foreground"
                  />
                </div>
                <div className="flex items-center gap-2 ml-3 sm:ml-0 mt-1">
                  {/* ToDo: Add verified badge when we have a way to check if the channel is claimed */}
                  {/* <Verified className='w-5 h-5 fill-green-500 dark:fill-green-700 text-secondary-foreground' />
                  <span className='text-sm text-secondary-foreground'>
                    Claimed
                  </span> */}
                  <BadgeAlert className="w-5 h-5 fill-orange-500  text-secondary-foreground" />
                  <span className="text-sm text-secondary-foreground">
                    Unclaimed
                  </span>
                </div>
              </div>
            </div>
            <div className="hidden md:flex flex-col lg:flex-row items-center space-x-4 space-y-5 lg:space-y-0">
              <Link
                href={`/review/create?stars=0&accountId=${account.accountId}`}
              >
                <button className="block text-left py-2 px-5 md:ml-3 rounded border border-primary bg-background text-primary hover:bg-primary hover:text-primary-foreground">
                  Write a Review
                </button>
              </Link>
              <Link
                href={`https://youtube.com/channel/${account.accountId}`}
                target="_blank"
              >
                <Button variant="default" className="gap-2">
                  <Youtube className="w-6 h-6" />
                  View Channel
                </Button>
              </Link>
            </div>
          </div>

          <div
            ref={navigationRef}
            className="hidden lg:block h-10 border-t border-border"
          >
            <ChannelNavigation
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
        </CardHeader>

        <div className="grid grid-cols-2 md:hidden w-full items-center justify-center gap-2 mb-2">
          <Link href={`/review/create?stars=0&accountId=${account.accountId}`}>
            <button className="block w-full text-center py-2 px-2 rounded border border-primary bg-background text-primary hover:bg-primary hover:text-primary-foreground">
              Write a Review
            </button>
          </Link>
          <Link
            href={`https://youtube.com/channel/${account.accountId}`}
            target="_blank"
          >
            <Button variant="default" size="default" className="gap-2 w-full">
              <Youtube className="w-6 h-6" />
              View Channel
            </Button>
          </Link>
        </div>

        <div
          ref={navigationRef}
          className="block lg:hidden border-t border-border"
        >
          <ChannelNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Sticky navigation */}
        <div
          className={cn(
            "transition-all duration-200",
            isSticky
              ? "fixed top-[58px] lg:top-16 left-0 right-0 z-40"
              : "hidden",
          )}
        >
          <div className="w-full bg-background/60 backdrop-blur-lg">
            <div className="max-w-screen-xl mx-auto border-b border-border">
              <div className="flex items-center justify-between md:px-4">
                <div className="flex flex-col md:flex-row items-center lg:gap-4">
                  <div className="hidden lg:flex lg:flex-row items-center gap-2 lg:gap-x-6">
                    <Avatar className="w-12 h-12 rounded-lg border border-border">
                      <AvatarImage
                        src={
                          account.ytData?.snippet?.thumbnails?.high?.url ||
                          account.imageUrl
                        }
                      />
                      <AvatarFallback className="bg-primary/10 text-primary rounded-lg w-12 h-12">
                        {getInitials(account.name_en)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {truncateText(account.name_en, 20)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {truncateText(account.handle, 20)}
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center">
                        <RatingStars count={account.rating || 0} />
                      </div>
                      <div className="flex flex-row items-center">
                        <span className="text-sm">
                          {account.reviewCount > 1
                            ? `${account.reviewCount} reviews`
                            : `${account.reviewCount} review`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-auto flex justify-center items-center gap-2">
                  <ChannelNavigation
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                  />
                </div>

                <div className="hidden md:flex md:flex-row items-center md:gap-2">
                  <Link
                    href={`/review/create?stars=0&accountId=${account.accountId}`}
                  >
                    <button className="hidden md:block text-left py-2 px-2 rounded border border-primary bg-background text-primary hover:bg-primary hover:text-primary-foreground">
                      Write a Review
                    </button>
                  </Link>
                  <Link
                    href={`https://youtube.com/channel/${account.accountId}`}
                    target="_blank"
                  >
                    <Button
                      variant="default"
                      size="default"
                      className="hidden lg:flex gap-2"
                    >
                      <Youtube className="w-6 h-6" />
                      View Channel
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ChannelHeader;
