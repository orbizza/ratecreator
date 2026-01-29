"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@ratecreator/ui";
import {
  FileText,
  PenSquare,
  Send,
  Clock,
  Mail,
  Users,
  Lightbulb,
  PlayCircle,
} from "lucide-react";
import Link from "next/link";
import type { DashboardStats } from "@ratecreator/actions/content";

interface StatsCardsProps {
  stats: DashboardStats;
}

const statConfig = [
  {
    key: "totalPosts" as const,
    title: "Total Posts",
    icon: FileText,
    href: "/posts",
    color: "text-blue-500",
  },
  {
    key: "drafts" as const,
    title: "Drafts",
    icon: PenSquare,
    href: "/drafts",
    color: "text-pink-500",
  },
  {
    key: "published" as const,
    title: "Published",
    icon: Send,
    href: "/published",
    color: "text-green-500",
  },
  {
    key: "scheduled" as const,
    title: "Scheduled",
    icon: Clock,
    href: "/scheduled-posts",
    color: "text-blue-400",
  },
  {
    key: "totalIdeas" as const,
    title: "Ideas",
    icon: Lightbulb,
    href: "/ideas",
    color: "text-yellow-500",
  },
  {
    key: "ideasInProgress" as const,
    title: "In Progress",
    icon: PlayCircle,
    href: "/ideas/in-progress",
    color: "text-orange-500",
  },
];

export function StatsCards({ stats }: StatsCardsProps): JSX.Element {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statConfig.map((stat) => {
        const Icon = stat.icon;
        return (
          <Link href={stat.href} key={stat.key}>
            <Card className="hover:bg-accent transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats[stat.key]}</div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
