"use client";

import { Suspense, useEffect, useState } from "react";

import { getCreatorData } from "@ratecreator/actions/review";
import { CreatorData } from "@ratecreator/types/review";
import { creatorCache } from "@ratecreator/db/utils";
import ChannelHeader from "./header-youtube";
import UserRatingCard from "./user-rating-card";
import { ChannelDetailsSection } from "./channel-details-section";
import {
  ChannelHeaderSkeleton,
  UserRatingCardSkeleton,
  ChannelDetailsSectionSkeleton,
} from "../skeletons/creator-profile-skeletons";

export const CreatorProfileYoutube = ({
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
  const [data, setData] = useState<CreatorData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try to get data from IndexedDB cache
        const cachedData = await creatorCache.getCachedCreator(
          platform,
          accountId,
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
          err instanceof Error ? err.message : "Failed to fetch creator data",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [accountId, platform]);

  if (loading) {
    return (
      <main className="container mx-auto p-4 mt-10">
        <ChannelHeaderSkeleton />
        <UserRatingCardSkeleton />
        <ChannelDetailsSectionSkeleton />
      </main>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 mt-16 text-red-500">
        Error: {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-4 mt-10">
        No data found for this creator
      </div>
    );
  }

  return (
    <main className="container mx-auto p-4 mt-10">
      <Suspense fallback={<ChannelHeaderSkeleton />}>
        <ChannelHeader account={data.account} />
      </Suspense>
      <Suspense fallback={<UserRatingCardSkeleton />}>
        <UserRatingCard accountId={accountId} />
      </Suspense>
      <Suspense fallback={<ChannelDetailsSectionSkeleton />}>
        <ChannelDetailsSection
          account={data.account}
          categories={data.categories}
        />
      </Suspense>
      <Suspense fallback={""}>
        {/* Review Section */}
        <div id="reviews" className="mt-10 text-2xl font-bold">
          Reviews
          {/* <ReviewsSection account={data} /> */}
        </div>
      </Suspense>
    </main>
  );
};
