"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from "@ratecreator/ui";
import { ExternalLink, Calendar } from "lucide-react";
import { format } from "date-fns";

interface TopPost {
  id: string;
  title: string;
  postUrl: string;
  publishDate: Date | null;
  contentPlatform: string;
  contentType: string;
  author: {
    id: string;
    name: string | null;
    imageUrl: string | null;
  };
}

interface TopPostsProps {
  posts: TopPost[];
}

function getPlatformBadgeVariant(
  platform: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (platform) {
    case "RATECREATOR":
      return "default";
    case "CREATOROPS":
      return "secondary";
    case "DOCUMENTATION":
      return "outline";
    default:
      return "outline";
  }
}

export function TopPosts({ posts }: TopPostsProps): JSX.Element {
  const router = useRouter();

  if (posts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            No published posts yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Posts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 min-w-0 mr-4">
                <h3 className="font-medium truncate">{post.title}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <Badge
                    variant={getPlatformBadgeVariant(post.contentPlatform)}
                  >
                    {post.contentPlatform}
                  </Badge>
                  <Badge variant="outline">{post.contentType}</Badge>
                  {post.publishDate && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(post.publishDate), "MMM d, yyyy")}
                    </span>
                  )}
                  {post.author.name && (
                    <span className="text-xs text-muted-foreground">
                      by {post.author.name}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/editor/${post.id}`)}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
