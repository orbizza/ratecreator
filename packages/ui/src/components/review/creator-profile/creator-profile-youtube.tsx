"use client";

import { Suspense, useEffect, useState } from "react";

import { getCreatorData } from "@ratecreator/actions/review";
import { CreatorData } from "@ratecreator/types/review";
import { creatorCache } from "@ratecreator/db/utils";
import ChannelHeader from "./header-youtube";
import UserRatingCard from "./user-rating-card";

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
    return <div className="container mx-auto p-4 mt-16">Loading...</div>;
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
      <Suspense fallback={""}>
        <ChannelHeader
          account={{
            id: data.account.id || "",
            platform: data.account.platform || "",
            accountId: data.account.accountId || "",
            handle: data.account.handle || "",
            name_en: data.account.name_en || "",
            description_en: data.account.description_en || "",
            keywords_en: data.account.keywords_en || "",
            followerCount: data.account.followerCount || 0,
            imageUrl: data.account.imageUrl || "",
            country: data.account.country,
            language_code: data.account.language_code || "",
            rating: data.account.rating || 0,
            reviewCount: data.account.reviewCount || 0,
            ytData: data.account.ytData || {},
          }}
        />
      </Suspense>
      <Suspense fallback={""}>
        <UserRatingCard accountId={accountId} />
      </Suspense>
      <div className="container mx-auto p-4 mt-16">
        <h2 className="text-2xl font-bold mb-4">Creator Data</h2>
        <pre className="p-4 rounded-lg overflow-auto max-h-[80vh]">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>

      {/* <div className='container mx-auto px-4 py-6'>
        <Suspense fallback={""}>
          <div className='space-y-8'>
            <AboutSection account={data} />
            <ReviewsSection account={data} />
            <ChannelDetailsSection account={data} />
            <CategoriesSection account={data} />
            <AlternativesSection account={data} />
          </div>
        </Suspense>
      </div> */}
    </main>
  );
};
