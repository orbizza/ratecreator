"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@ratecreator/ui";
import {
  FileText,
  Users,
  Lightbulb,
  CheckCircle,
  Clock,
  Archive,
} from "lucide-react";

interface PostsByStatus {
  status: string;
  count: number;
}

interface StatsOverviewProps {
  postsByStatus: PostsByStatus[];
  totalSubscribers: number;
  activeSubscribers: number;
  totalIdeas: number;
  ideasInProgress: number;
}

export function StatsOverview({
  postsByStatus,
  totalSubscribers,
  activeSubscribers,
  totalIdeas,
  ideasInProgress,
}: StatsOverviewProps): JSX.Element {
  const getStatusCount = (status: string): number => {
    const item = postsByStatus.find((p) => p.status === status);
    return item?.count || 0;
  };

  const totalPosts = postsByStatus.reduce((acc, curr) => acc + curr.count, 0);
  const publishedPosts = getStatusCount("PUBLISHED");
  const draftPosts = getStatusCount("DRAFT");
  const scheduledPosts = getStatusCount("SCHEDULED");

  const stats = [
    {
      title: "Total Posts",
      value: totalPosts,
      icon: FileText,
      description: "All content pieces",
      color: "text-blue-500",
    },
    {
      title: "Published",
      value: publishedPosts,
      icon: CheckCircle,
      description: "Live content",
      color: "text-green-500",
    },
    {
      title: "Drafts",
      value: draftPosts,
      icon: Archive,
      description: "Work in progress",
      color: "text-yellow-500",
    },
    {
      title: "Scheduled",
      value: scheduledPosts,
      icon: Clock,
      description: "Upcoming content",
      color: "text-purple-500",
    },
    {
      title: "Active Subscribers",
      value: activeSubscribers,
      icon: Users,
      description: `of ${totalSubscribers} total`,
      color: "text-indigo-500",
    },
    {
      title: "Ideas",
      value: totalIdeas,
      icon: Lightbulb,
      description: `${ideasInProgress} in progress`,
      color: "text-amber-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
