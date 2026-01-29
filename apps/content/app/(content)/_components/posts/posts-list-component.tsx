"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Plus, FileText } from "lucide-react";
import { format } from "date-fns";
import { useRecoilValue, useRecoilState } from "recoil";
import {
  contentPlatformAtom,
  contentTypeAtom,
  postStatusAtom,
  contentPageNumberState,
  postListTagsState,
} from "@ratecreator/store/content";
import {
  Button,
  Separator,
  Card,
  CardContent,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@ratecreator/ui";
import { PostsNavbar } from "@ratecreator/ui/content";
import {
  fetchAllPosts,
  fetchAllPostsCount,
} from "@ratecreator/actions/content";
import type { FetchedPostType } from "@ratecreator/types/content";
import { ContentType, PostStatus } from "@ratecreator/types/content";
import Link from "next/link";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  PUBLISHED:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  DELETED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

interface PostsListComponentProps {
  defaultStatusFilter?: string;
  defaultContentTypeFilter?: string;
  pageTitle?: string;
}

export function PostsListComponent({
  defaultStatusFilter = "all",
  defaultContentTypeFilter = "all",
  pageTitle = "Posts",
}: PostsListComponentProps): JSX.Element {
  const [posts, setPosts] = useState<FetchedPostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const contentPlatform = useRecoilValue(contentPlatformAtom);
  const [contentType, setContentType] = useRecoilState(contentTypeAtom);
  const [postStatus, setPostStatus] = useRecoilState(postStatusAtom);
  const [page, setPage] = useRecoilState(contentPageNumberState);
  const postListTags = useRecoilValue(postListTagsState);

  // Set defaults on mount from props (NOT resetting platform)
  useEffect(() => {
    setPostStatus(
      defaultStatusFilter === "all"
        ? null
        : (defaultStatusFilter as PostStatus),
    );
    setContentType(
      defaultContentTypeFilter === "all"
        ? null
        : (defaultContentTypeFilter as ContentType),
    );
    setPage(0);
  }, []);

  const loadPosts = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const status = postStatus ?? undefined;
      const type = contentType ?? undefined;
      const platform = contentPlatform.toLowerCase();

      const [data, count] = await Promise.all([
        fetchAllPosts("all", page, type, platform, status),
        fetchAllPostsCount("all", type, platform, status),
      ]);
      setPosts(data);
      setTotalCount(count);
    } catch {
      setPosts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [postStatus, contentType, contentPlatform, page, postListTags]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const renderContent = (): JSX.Element => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (posts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground mb-2">No posts yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Start creating content for your audience
          </p>
          <Link href="/new-post">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create your first post
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {posts.map((post) => (
          <Link href={`/editor/${post.id}`} key={post.id}>
            <Card className="hover:bg-accent transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={post.author?.imageUrl || ""} />
                    <AvatarFallback>
                      {post.author?.name?.charAt(0) || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{post.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {post.publishDate
                        ? format(new Date(post.publishDate), "MMM d, yyyy")
                        : "No publish date"}
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
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {totalCount > 10 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm text-muted-foreground">
              Page {page + 1} of {Math.ceil(totalCount / 10)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * 10 >= totalCount}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-8">
      <PostsNavbar />

      <Separator className="bg-border h-[1px] my-6" />

      <p className="text-sm text-muted-foreground mb-4">
        {totalCount} {totalCount === 1 ? "post" : "posts"} found
      </p>

      {renderContent()}
    </div>
  );
}
