"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";

import { FetchedPostType } from "@ratecreator/types/content";
import { fetchPostByPostUrl } from "@ratecreator/actions/content";

import { BlockNoteRenderer } from "@ratecreator/ui/common";
import { LegalPostSkeleton } from "../content-skeletons/skeleton-legal-post";
import { useParams } from "next/navigation";

export const LegalPost = () => {
  const params = useParams();
  const postUrl = params.slug as string;
  const [post, setPost] = useState<FetchedPostType>();

  const [isLoading, setIsLoading] = useState(true);

  const getPost = async () => {
    try {
      // Try to get from cache first
      setIsLoading(true);

      // If no cache, fetch fresh data
      const postData = await fetchPostByPostUrl(postUrl);

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

  if (!post || isLoading) {
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
          <BlockNoteRenderer content={post.content} />
        </div>

        {postUrl === "terms" && (
          <div className="mt-12 p-6 border rounded-lg bg-muted/50">
            <h3 className="text-lg font-semibold mb-3">
              YouTube Terms of Service
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              By using Rate Creator, you are agreeing to be bound by the{" "}
              <a
                href="https://www.youtube.com/t/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                YouTube Terms of Service
              </a>
              .
            </p>
          </div>
        )}

        {postUrl === "privacy" && (
          <div className="mt-12 p-6 border rounded-lg bg-muted/50">
            <h3 className="text-lg font-semibold mb-3">
              YouTube API Services &amp; Google Privacy Policy
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Rate Creator uses YouTube API Services to display channel
              information, statistics, and other publicly available data from
              YouTube.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-2">
              By using Rate Creator, you acknowledge that your use is also
              subject to the{" "}
              <a
                href="http://www.google.com/policies/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Google Privacy Policy
              </a>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
