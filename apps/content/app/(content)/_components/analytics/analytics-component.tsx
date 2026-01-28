"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useRecoilValue } from "recoil";
import { contentPlatformAtom } from "@ratecreator/store";
import {
  fetchAnalyticsData,
  type AnalyticsData,
} from "@ratecreator/actions/content";
import { StatsOverview } from "./stats-overview";
import { SubscriberGrowthChart } from "./subscriber-growth-chart";
import { TopPosts } from "./top-posts";
import { PostsByPlatformChart } from "./posts-by-platform-chart";

export function AnalyticsComponent(): JSX.Element {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const contentPlatform = useRecoilValue(contentPlatformAtom);

  useEffect(() => {
    const loadAnalytics = async (): Promise<void> => {
      setLoading(true);
      try {
        const platform = contentPlatform as
          | "RATECREATOR"
          | "CREATOROPS"
          | "DOCUMENTATION";
        const analyticsData = await fetchAnalyticsData(platform);
        setData(analyticsData);
      } catch {
        // Failed to load analytics
      } finally {
        setLoading(false);
      }
    };

    void loadAnalytics();
  }, [contentPlatform]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Failed to load analytics</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your content and subscriber metrics
        </p>
      </div>

      <StatsOverview
        activeSubscribers={data.activeSubscribers}
        postsByStatus={data.postsByStatus}
        totalSubscribers={data.totalSubscribers}
        totalIdeas={data.totalIdeas}
        ideasInProgress={data.ideasInProgress}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SubscriberGrowthChart data={data.subscribersByMonth} />
        <PostsByPlatformChart data={data.postsByPlatform} />
      </div>

      <TopPosts posts={data.topPosts} />
    </div>
  );
}
