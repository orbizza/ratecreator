"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

import { FetchedPostType } from "@ratecreator/types/content";
import { fetchPostByslug } from "@ratecreator/actions/content";
import LegalPostSkeleton from "./skeleton-legal-post";
import { BlockNoteRenderer } from "../../common/blocknote-editor/blocknote-render";

export const PrivacyPage = () => {
  const [post, setPost] = useState<FetchedPostType | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const getPost = async () => {
    try {
      // Try to get from cache first
      setIsLoading(true);

      // If no cache, fetch fresh data
      const postData = await fetchPostByslug("privacy");

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
        <LegalPostSkeleton />
      </div>
    );
  }
  return (
    <div className="max-w-6xl mx-auto mt-20">
      <div className="flex gap-2 justify-center mb-10">
        <span className="text-sm text-neutral-600">
          Last updated:{" "}
          {post?.updatedAt
            ? format(new Date(post.updatedAt), "MMMM dd, yyyy")
            : ""}
        </span>
      </div>
      <div className="w-full px-2 sm:px-8 max-w-4xl mx-auto">
        <div className="flex flex-col gap-2">
          <div className="text-2xl sm:text-3xl md:text-5xl font-semibold mb-4">
            {post?.title}
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-y-2 sm:gap-y-0 ">
          <p className="pl-0 sm:pl-1 text-sm text-neutral-600 dark:text-neutral-400">
            {post?.publishDate
              ? format(new Date(post?.publishDate), "MMMM dd, yyyy")
              : ""}
          </p>
        </div>

        <div className="mt-10 ">
          <BlockNoteRenderer content={post?.content} />
        </div>
      </div>
    </div>
  );
};
