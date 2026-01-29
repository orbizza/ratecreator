"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Plus, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useRecoilValue } from "recoil";
import { contentPlatformAtom } from "@ratecreator/store";
import {
  Button,
  Label,
  Separator,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  CardContent,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@ratecreator/ui";
import {
  fetchAllPosts,
  fetchAllPostsCount,
} from "@ratecreator/actions/content";
import type { FetchedPostType } from "@ratecreator/types/content";
import Link from "next/link";

type PostStatusFilter = "all" | "DRAFT" | "PUBLISHED" | "SCHEDULED" | "DELETED";
type ContentTypeFilter = "all" | "BLOG" | "GLOSSARY" | "NEWSLETTER" | "LEGAL";

const statusOptions = [
  { value: "all", label: "All Posts" },
  { value: "DRAFT", label: "Drafts" },
  { value: "PUBLISHED", label: "Published" },
  { value: "SCHEDULED", label: "Scheduled" },
];

const contentTypeOptions = [
  { value: "all", label: "All Types" },
  { value: "BLOG", label: "Blog" },
  { value: "GLOSSARY", label: "Glossary" },
  { value: "NEWSLETTER", label: "Newsletter" },
  { value: "LEGAL", label: "Legal" },
];

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  PUBLISHED:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  DELETED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

interface PostsListComponentProps {
  defaultStatusFilter?: PostStatusFilter;
  defaultContentTypeFilter?: ContentTypeFilter;
  pageTitle?: string;
}

export function PostsListComponent({
  defaultStatusFilter = "all",
  defaultContentTypeFilter = "all",
  pageTitle = "Posts",
}: PostsListComponentProps): JSX.Element {
  const router = useRouter();
  const [posts, setPosts] = useState<FetchedPostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] =
    useState<PostStatusFilter>(defaultStatusFilter);
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentTypeFilter>(
    defaultContentTypeFilter,
  );
  const contentPlatform = useRecoilValue(contentPlatformAtom);

  useEffect(() => {
    setStatusFilter(defaultStatusFilter);
  }, [defaultStatusFilter]);

  useEffect(() => {
    setContentTypeFilter(defaultContentTypeFilter);
  }, [defaultContentTypeFilter]);

  const loadPosts = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const status = statusFilter === "all" ? undefined : statusFilter;
      const contentType =
        contentTypeFilter === "all" ? undefined : contentTypeFilter;
      const platform = contentPlatform.toLowerCase();

      const [data, count] = await Promise.all([
        fetchAllPosts("all", page, contentType, platform, status),
        fetchAllPostsCount("all", contentType, platform, status),
      ]);
      setPosts(data);
      setTotalCount(count);
    } catch {
      setPosts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, contentTypeFilter, contentPlatform, page]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const handleStatusFilterChange = (value: string): void => {
    setStatusFilter(value as PostStatusFilter);
    setPage(0);
  };

  const handleContentTypeFilterChange = (value: string): void => {
    setContentTypeFilter(value as ContentTypeFilter);
    setPage(0);
  };

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
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6">
        <div className="flex items-center gap-3 mb-4 lg:mb-0">
          <FileText className="h-8 w-8 text-blue-500" />
          <Label className="text-3xl lg:text-4xl font-semibold">
            {pageTitle}
          </Label>
        </div>

        <div className="flex items-center gap-4">
          <Select
            onValueChange={handleContentTypeFilterChange}
            value={contentTypeFilter}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Content type" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {contentTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select onValueChange={handleStatusFilterChange} value={statusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Link href="/new-post">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </Link>
        </div>
      </div>

      <Separator className="bg-border h-[1px] mb-6" />

      <p className="text-sm text-muted-foreground mb-4">
        {totalCount} {totalCount === 1 ? "post" : "posts"} found
      </p>

      {renderContent()}
    </div>
  );
}
