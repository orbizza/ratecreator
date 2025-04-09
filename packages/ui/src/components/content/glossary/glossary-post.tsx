"use client";

import { format } from "date-fns";
import { ChevronLeft, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

import {
  fetchPostBySlug,
  fetchTagsFromTagOnPost,
} from "@ratecreator/actions/content";
import { BlockNoteRenderer } from "@ratecreator/ui/common";
import { FetchedPostType } from "@ratecreator/types/content";
import { Tags } from "@ratecreator/types/content";
import { Button, Label, Separator, toast } from "@ratecreator/ui";
import { GlossaryPostSkeleton } from "../content-skeletons/glossary-post-skeleton";
import { useParams } from "next/navigation";

export function GlossaryPost() {
  const params = useParams();
  const slug = params?.slug as string;
  const [post, setPost] = useState<FetchedPostType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tags, setTags] = useState<Tags[]>([]);

  const getPost = async () => {
    try {
      setIsLoading(true);
      const postData = await fetchPostBySlug(slug);

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
      console.error("Error fetching glossary term:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getPost();
  }, []);

  if (isLoading || !post) {
    return (
      <div className="flex flex-row items-center justify-center min-h-screen">
        <GlossaryPostSkeleton />
      </div>
    );
  }

  return (
    <div className="relative max-w-6xl mx-auto px-4 py-8">
      {/* Back button */}
      <Link
        href="/glossary"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 mb-6"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to Glossary
      </Link>
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Title */}
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-10">{post.excerpt}</p>

        {/* Content */}
        <div className="prose dark:prose-invert max-w-none">
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
                `${window.location.origin}/glossary/${post?.slug}`,
              );
              toast({
                description: "Glossary link copied to your clipboard.",
              });
            }}
          >
            <LinkIcon className="size-4 mr-2 text-neutral-600 dark:text-neutral-400" />
            Copy Link
          </Button>
        </div>
      </article>
    </div>
  );
}
