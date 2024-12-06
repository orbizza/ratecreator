"use client";

import { useEffect, useState } from "react";

import { getCreatorData } from "@ratecreator/actions/review";
import { CreatorData } from "@ratecreator/types/review";
import { creatorCache } from "@ratecreator/db/utils";

export const CreatorProfileYoutube = ({
  accountId,
  platform,
}: {
  accountId: string;
  platform: string;
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
          accountId
        );

        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return;
        }

        // If no cached data, fetch from API
        const result = await getCreatorData({ accountId, platform });
        setData(result);

        // Cache the new data
        await creatorCache.setCachedCreator(platform, accountId, result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch creator data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [accountId, platform]);

  if (loading) {
    return <div className='container mx-auto p-4 mt-16'>Loading...</div>;
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
      <div className='container mx-auto p-4 mt-16'>
        No data found for this creator
      </div>
    );
  }

  return (
    <div className='container mx-auto p-4 mt-16'>
      <h2 className='text-2xl font-bold mb-4'>Creator Data</h2>
      <pre className='p-4 rounded-lg overflow-auto max-h-[80vh]'>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};
