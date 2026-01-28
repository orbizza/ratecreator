"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@ratecreator/ui";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import type { PostListType } from "@ratecreator/actions/content";

interface RecentPostsProps {
  posts: PostListType[];
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  PUBLISHED:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  DELETED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export function RecentPosts({ posts }: RecentPostsProps): JSX.Element {
  if (posts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No posts yet. Create your first post to get started.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Posts</CardTitle>
        <Link
          href="/posts"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {posts.map((post) => (
            <Link
              href={`/editor/${post.id}`}
              key={post.id}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.author.imageUrl || ""} />
                <AvatarFallback>
                  {post.author.name?.charAt(0) || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{post.title}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(post.updatedAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {post.contentType}
                </Badge>
                <Badge className={statusColors[post.status]}>
                  {post.status}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
