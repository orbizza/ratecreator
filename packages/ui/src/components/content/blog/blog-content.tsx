"use client";

import { format } from "date-fns";
import Image from "next/image";
import { ChevronLeft, Link as LinkIcon } from "lucide-react";
import Link from "next/link";

import {
  fetchPostByPostUrl,
  fetchTagsFromTagOnPost,
} from "@ratecreator/actions/content";

import { useState, useEffect } from "react";
import { PostSkeleton } from "../content-skeletons/skeleton-blog-post";
import {
  Button,
  Label,
  ScrollProgress,
  Separator,
  toast,
} from "@ratecreator/ui";
import { FetchedPostType } from "@ratecreator/types/content";
import { Tags } from "@ratecreator/types/content";
import { capitalizeFirstLetter } from "@ratecreator/db/utils";
import { BlockNoteRenderer } from "@ratecreator/ui/common";
import { useParams } from "next/navigation";

export function BlogContent() {
  const params = useParams();
  const postUrl = params.slug as string;

  const [post, setPost] = useState<FetchedPostType | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [tags, setTags] = useState<Tags[]>([]);

  const getPost = async () => {
    try {
      // Try to get from cache first
      setIsLoading(true);

      // If no cache, fetch fresh data

      const postData = await fetchPostByPostUrl(postUrl);

      if (postData && postData.id) {
        const tagList = await fetchTagsFromTagOnPost({
          postId: postData.id,
        });
        setTags(
          tagList.map(({ tag }) => ({
            id: tag.id,
            slug: tag.slug,
            description: tag.description ?? "",
            imageUrl: tag.imageUrl ?? "",
            posts: tag.posts,
          })),
        );
      }

      setPost(postData as FetchedPostType);
    } catch (error) {
      console.error("Error fetching blog post:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getPost();
  }, []);

  if (isLoading || !post) {
    return (
      <div className="flex flex-row mt-10 items-center justify-center min-h-screen">
        <PostSkeleton />
      </div>
    );
  }
  return (
    <div className="max-w-6xl mx-auto">
      <div className="w-full px-1 sm:px-8 max-w-6xl mx-auto flex flex-row justify-between items-center py-4 mb-10 ">
        <Link
          href="/blog"
          className="flex flex-row items-center text-sm rounded-md hover:bg-neutral-300  dark:hover:bg-neutral-700 active:bg-gray-200 p-2"
        >
          <ChevronLeft className="size-4 mr-3" />
          Blog
        </Link>

        <div className="flex gap-2">
          <span className="text-sm text-neutral-600">
            Last edited:{" "}
            {post?.updatedAt
              ? format(new Date(post.updatedAt), "MMMM dd, yyyy")
              : ""}
          </span>
          {post?.author?.imageUrl && (
            <Image
              src={post.author.imageUrl}
              alt={post.author.name || ""}
              width={24}
              height={24}
              className="rounded-full"
            />
          )}
        </div>
      </div>
      <div className="w-full px-2 sm:px-8 max-w-4xl mx-auto">
        {post?.featureImage && (
          <Image
            src={post?.featureImage || ""}
            alt={post?.title || ""}
            className="mb-5 h-60 md:h-full w-full rounded-3xl object-cover "
            height={720}
            width={1024}
          />
        )}

        <div className="flex flex-col sm:flex-row gap-2 justify-between mb-2 sm:mb-4">
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 my-2 sm:my-4">
              {tags.slice(0, 4).map((tag) => (
                <span
                  key={tag.slug}
                  className="px-2 py-1 text-xs font-medium bg-neutral-200 text-neutral-800 rounded-md"
                >
                  {capitalizeFirstLetter(tag.slug)}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-2xl sm:text-3xl md:text-5xl font-semibold mb-4">
            {post?.title}
          </div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-10">
            {post?.excerpt}
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-y-2 sm:gap-y-0 ">
          <div className="flex flex-row items-center ">
            <Image
              src={post?.author?.imageUrl || ""}
              alt={post?.author?.name || ""}
              className="h-5 w-5 rounded-full"
              height={20}
              width={20}
            />
            <p className="pl-2 text-sm text-neutral-600 dark:text-neutral-400">
              {post?.author?.name || ""}
            </p>
          </div>
          <div className="hidden sm:block mx-2 h-1 w-1 rounded-full bg-neutral-200 dark:bg-neutral-700" />
          <p className="pl-0 sm:pl-1 text-sm text-neutral-600 dark:text-neutral-400">
            {post?.publishDate
              ? format(new Date(post?.publishDate), "MMMM dd, yyyy")
              : ""}
          </p>
        </div>

        <div className="mt-10 ">
          <ScrollProgress />
          <BlockNoteRenderer content={post.content} />
        </div>
        <div className="flex flex-col gap-2 items-start mb-20">
          <Label className=" dark:text-neutral-600 text-neutral-400 mb-4">
            Share
          </Label>
          <Separator className=" dark:bg-neutral-700 bg-neutral-300 mb-8" />
          <Button
            variant="outline"
            className="rounded-lg text-neutral-600 dark:text-neutral-400"
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/blog/${post?.postUrl}`,
              );
              toast({
                description: "Blog link copied to your clipboard.",
              });
            }}
          >
            <LinkIcon className="size-4 mr-2 text-neutral-600 dark:text-neutral-400" />
            Copy Link
          </Button>
        </div>
      </div>
    </div>
  );
}
