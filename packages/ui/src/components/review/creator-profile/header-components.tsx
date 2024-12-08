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
} from "@ratecreator/ui";
import Image from "next/image";

import { Heart, Star, Youtube, Check } from "lucide-react";
import { cn } from "@ratecreator/ui/utils";
import type { CreatorData } from "@ratecreator/types/review";
import { getInitials } from "@ratecreator/db/utils";

const defaultBg = cn(
  "bg-gradient-to-r",
  "from-[#ffffff] via-[#f3e8de] to-[#efd4d4]",
  "dark:from-[#646161] dark:via-[#333231] dark:to-[#0a0b0b]"
);

// Stats Display Component
const StatsDisplay = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className='flex flex-col space-y-1'>
    <span className='text-sm text-muted-foreground'>{label}</span>
    <span className='font-medium'>{value}</span>
  </div>
);

// Channel Navigation Component
const ChannelNavigation = ({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) => {
  const tabs = [
    "About",
    "Channel Details",
    "Reviews",
    "Categories",
    "Alternatives",
  ];

  return (
    <nav className='flex gap-4  py-2'>
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={cn(
            "px-4 py-2 text-sm transition-colors hover:text-primary",
            activeTab === tab
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          )}
        >
          {tab}
        </button>
      ))}
    </nav>
  );
};

// Main Channel Header Component
export const ChannelHeader = ({
  account,
}: {
  account: CreatorData["account"];
}) => {
  const [isSticky, setIsSticky] = useState(false);
  const [activeTab, setActiveTab] = useState("About");
  const navigationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // When the navigation is not intersecting (out of view), show sticky nav
        setIsSticky(!entry.isIntersecting);
      },
      {
        // Adjust threshold and rootMargin as needed
        threshold: 0,
        rootMargin: "-1px 0px 0px 0px",
      }
    );

    if (navigationRef.current) {
      observer.observe(navigationRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className='relative max-w-screen-2xl mx-auto'>
      {/* Banner Section */}
      <div className='relative w-full h-[250px] md:h-[300px] lg:h-[400px] bg-muted rounded-lg'>
        {account.ytData?.brandingSettings?.image?.bannerExternalUrl ? (
          <Image
            src={
              account.ytData.brandingSettings.image.bannerExternalUrl +
              "=w1707-fcrop64=1"
            }
            alt={`${account.name_en}'s banner`}
            fill
            priority
            className='object-cover rounded-lg'
            sizes='100vw'
          />
        ) : (
          <div className={cn("w-full h-full rounded-lg", defaultBg)} />
        )}

        {/* Overlapping Avatar - moved inside banner */}
        <div className='absolute -bottom-32 left-6'>
          <Avatar className='w-36 h-36 rounded-lg border-2 border-border shadow-lg'>
            <AvatarImage
              src={
                account.ytData.snippet?.thumbnails?.high?.url ||
                account.imageUrl
              }
            />
            <AvatarFallback>{getInitials(account.name_en)}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <Card className='w-full border-none rounded-none bg-background'>
        <CardHeader className='pt-4 pl-48 space-y-6'>
          <div className='flex flex-col space-y-6 lg:flex-row lg:justify-between lg:items-start'>
            {/* Channel Info */}
            <div className='space-y-2'>
              <h1 className='text-2xl font-bold'>{account.name_en}</h1>
              <p className='text-muted-foreground'>{account.handle}</p>

              <div className='flex flex-wrap gap-4 mt-2'>
                <StatsDisplay
                  label='Subscribers'
                  value={`${(account.followerCount || 0).toLocaleString()}M`}
                />
                <StatsDisplay
                  label='Country & language'
                  value={`${account.country} - ${account.language_code}`}
                />
              </div>
            </div>

            {/* Actions */}
            <div className='flex gap-4'>
              <Link href='/review/write'>
                <Button variant='outline' className='gap-2'>
                  Write a Review
                </Button>
              </Link>

              <Link
                href={`https://youtube.com/channel/${account.accountId}`}
                target='_blank'
              >
                <Button variant='default' className='gap-2'>
                  <Youtube className='w-6 h-6' />
                  View Channel
                </Button>
              </Link>
            </div>
          </div>

          {/* Rating & Actions */}
          <div className='flex items-center justify-between border-t border-border pt-4'>
            <div className='flex items-center space-x-4'>
              <Button variant='ghost' className='gap-2 text-primary'>
                <Heart className='w-4 h-4' />
                Save to My Lists
              </Button>
            </div>

            <div className='flex items-center space-x-4 text-muted-foreground'>
              <span>{account.reviewCount?.toLocaleString()} reviews</span>
            </div>
          </div>

          {/* Navigation */}
          <div ref={navigationRef} className='border-t border-border'>
            <ChannelNavigation
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
        </CardHeader>

        {/* Mobile Actions */}
        <div className='flex md:hidden flex-row w-full items-center justify-between gap-2 px-4 pb-4'>
          <Link href='/review/write' className='flex-1'>
            <Button variant='outline' className='w-full gap-2'>
              Write a Review
            </Button>
          </Link>

          <Link
            href={`https://youtube.com/channel/${account.accountId}`}
            target='_blank'
            className='flex-1'
          >
            <Button variant='default' className='w-full gap-2'>
              <Youtube className='w-6 h-6' />
              View Channel
            </Button>
          </Link>
        </div>

        {/* Sticky navigation */}
        <div
          className={cn(
            "transition-all duration-200",
            isSticky ? "fixed top-16 left-0 right-0 z-40" : "hidden"
          )}
        >
          <div className='w-full bg-background/60 backdrop-blur-lg '>
            <div className='max-w-screen-xl mx-auto border-b border-border'>
              <div className='flex items-center justify-between px-4'>
                <div className='flex items-center gap-4'>
                  <Avatar className='w-10 h-10 rounded-lg border border-border'>
                    <AvatarImage
                      src={
                        account.ytData.snippet?.thumbnails?.default?.url ||
                        account.ytData.snippet?.thumbnails?.high?.url
                      }
                    />
                    <AvatarFallback>
                      {account.name_en?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className='flex flex-col'>
                    <span className='font-medium'>{account.name_en}</span>
                    <span className='text-sm text-muted-foreground'>
                      {account.handle}
                    </span>
                  </div>
                  <div className='flex items-center'>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-3 h-3",
                          i < 4
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-yellow-400"
                        )}
                      />
                    ))}
                  </div>
                </div>

                <ChannelNavigation
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                />

                <Link
                  href={`https://youtube.com/channel/${account.accountId}`}
                  target='_blank'
                >
                  <Button variant='default' size='sm' className='gap-2'>
                    <Youtube className='w-6 h-6' />
                    View Channel
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ChannelHeader;
