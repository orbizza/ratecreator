"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCreatorData } from "@ratecreator/actions/review";
import { CreatorData } from "@ratecreator/types/review";
import { creatorCache } from "@ratecreator/db/utils";
import ChannelHeader from "./youtube/header-youtube";
import UserRatingCard from "./user-rating-card";
import { ChannelDetailsSection } from "./youtube/channel-details-section";
import {
  ChannelHeaderSkeleton,
  UserRatingCardSkeleton,
  ChannelDetailsSectionSkeleton,
  ReviewCardSkeleton,
} from "../skeletons/creator-profile-skeletons";
import { CreatorReviews } from "./creator-reviews";
import { MessagesSquare } from "lucide-react";
import { Info } from "lucide-react";
import TwitterChannelHeader from "./twitter/header-twitter";
import { TwitterDetailsSection } from "./twitter/twitter-details-section";

export const CreatorProfile = ({
  accountId,
  platform,
  user,
}: {
  accountId: string;
  platform: string;
  user?: {
    name: string;
    image?: string;
  } | null;
}) => {
  const router = useRouter();
  const [data, setData] = useState<CreatorData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try to get data from IndexedDB cache
        const cachedData = await creatorCache.getCachedCreator(
          platform,
          accountId
        );

        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return;
        }

        // If no cached data, fetch from API
        const result = await getCreatorData({ accountId, platform });
        setData(result as CreatorData);

        // Cache the new data
        await creatorCache.setCachedCreator(platform, accountId, result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch creator data"
        );
        router.push("/error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [accountId, platform]);

  if (loading) {
    return (
      <main className='container mx-auto p-4 mt-10'>
        <ChannelHeaderSkeleton />
        <UserRatingCardSkeleton />
        <ChannelDetailsSectionSkeleton />
      </main>
    );
  }

  if (error) {
    return (
      <div className='container mx-auto p-4 mt-16 text-red-500'>
        Error: {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className='container mx-auto p-4 mt-10'>
        No data found for this creator
      </div>
    );
  }

  const renderPlatformContent = () => {
    switch (platform.toLowerCase()) {
      case "youtube":
        return (
          <>
            <Suspense fallback={<ChannelHeaderSkeleton />}>
              <ChannelHeader account={data.account} />
            </Suspense>
            <Suspense fallback={<UserRatingCardSkeleton />}>
              <UserRatingCard accountId={accountId} platform={platform} />
            </Suspense>
            <Suspense fallback={<ChannelDetailsSectionSkeleton />}>
              <ChannelDetailsSection
                account={data.account}
                categories={data.categories}
              />
            </Suspense>
            <Suspense fallback={<ReviewCardSkeleton />}>
              {/* Review Section */}
              <div id='reviews' className='mt-10 text-2xl font-bold'>
                <div className='flex flex-row gap-x-2 items-center text-primary'>
                  <MessagesSquare size={28} />
                  <span className=''>Reviews</span>
                  <Info size={14} className='text-muted-foreground' />
                </div>

                <CreatorReviews accountId={accountId} platform={platform} />
              </div>
            </Suspense>
          </>
        );
      case "twitter":
        return (
          <>
            <Suspense fallback={<ChannelHeaderSkeleton />}>
              <TwitterChannelHeader account={data.account} />
            </Suspense>
            <Suspense fallback={<UserRatingCardSkeleton />}>
              <UserRatingCard accountId={accountId} platform={platform} />
            </Suspense>
            <Suspense fallback={<ChannelDetailsSectionSkeleton />}>
              <TwitterDetailsSection
                account={data.account}
                categories={data.categories}
              />
            </Suspense>
            <Suspense fallback={<ReviewCardSkeleton />}>
              {/* Review Section */}
              <div id='reviews' className='mt-10 text-2xl font-bold'>
                <div className='flex flex-row gap-x-2 items-center text-primary'>
                  <MessagesSquare size={28} />
                  <span className=''>Reviews</span>
                  <Info size={14} className='text-muted-foreground' />
                </div>

                <CreatorReviews accountId={accountId} platform={platform} />
              </div>
            </Suspense>
          </>
        );
      case "reddit":
        return (
          <div className='text-center py-8'>
            Sub Reddit community view coming soon
          </div>
        );
      case "tiktok":
        return (
          <>
            <Suspense fallback={<ChannelHeaderSkeleton />}>
              TikTok profile view coming soon
            </Suspense>
            <Suspense fallback={<UserRatingCardSkeleton />}>
              {/* <UserRatingCard accountId={accountId} /> */}
            </Suspense>
            <Suspense fallback={<ChannelDetailsSectionSkeleton />}>
              {/* <ChannelDetailsSection
                account={data.account}
                categories={data.categories}
              /> */}
            </Suspense>
          </>
        );
      default:
        return (
          <div className='text-center py-8'>
            Unsupported platform: {platform}
          </div>
        );
    }
  };

  return (
    <main className='container max-w-screen-xl mx-auto p-4 mt-10'>
      {renderPlatformContent()}
    </main>
  );
};
