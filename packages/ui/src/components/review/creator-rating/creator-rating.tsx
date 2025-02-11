"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Card,
  Input,
  Textarea,
} from "@ratecreator/ui";
import { getCreatorData } from "@ratecreator/actions/review";
import { CreatorData } from "@ratecreator/types/review";
import { getInitials, truncateText } from "@ratecreator/db/utils";
import { Loader2 } from "lucide-react";
import { Editor } from "./editor";
import { TweetCard } from "@ratecreator/ui";
import { PlatformIcon } from "./platform-icons";
import { CreatorHeaderSkeleton } from "../skeletons/creator-review-header-skeleton";

const extractTweetId = (url: string) => {
  const regex = /\/status\/(\d+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const getRatingColor = (rating: number) => {
  if (rating >= 4.5) return "text-emerald-500";
  if (rating >= 4.0) return "text-green-500";
  if (rating >= 3.0) return "text-yellow-500";
  if (rating >= 2.0) return "text-orange-500";
  if (rating >= 1.0) return "text-red-500";
  return "text-red-600";
};

const Star = ({ filled, color }: { filled: boolean; color: string }) => {
  return (
    <svg
      className={`sm:w-10 sm:h-10 w-6 h-6 ${filled ? color : "text-gray-400 dark:text-gray-600"}`}
      viewBox='0 0 24 24'
      fill={filled ? "currentColor" : "none"}
      stroke='currentColor'
      strokeWidth='1'
    >
      <path
        d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
};

// const PlatformIcon = ({ platform }: { platform: string }) => {
//   switch (platform.toLowerCase()) {
//     case "twitter":
//     case "x":
//       return (
//         <svg
//           className='w-6 h-6 md:w-7 md:h-7'
//           viewBox='0 0 24 24'
//           fill='currentColor'
//           aria-label='Twitter/X Logo'
//         >
//           <path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' />
//         </svg>
//       );
//     case "youtube":
//       return (
//         <svg
//           className='w-6 h-6 md:w-7 md:h-7 text-red-600'
//           viewBox='0 0 24 24'
//           fill='currentColor'
//         >
//           <path d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' />
//         </svg>
//       );
//     case "instagram":
//       return (
//         <svg
//           className='w-6 h-6 md:w-7 md:h-7 text-pink-600'
//           viewBox='0 0 24 24'
//           fill='currentColor'
//         >
//           <path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' />
//         </svg>
//       );
//     case "tiktok":
//       return (
//         <svg
//           className='w-6 h-6 md:w-7 md:h-7'
//           viewBox='0 0 24 24'
//           fill='currentColor'
//         >
//           <path d='M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z' />
//         </svg>
//       );
//     case "reddit":
//       return (
//         <svg
//           className='w-6 h-6 md:w-7 md:h-7 text-orange-600'
//           viewBox='0 0 24 24'
//           fill='currentColor'
//         >
//           <path d='M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z' />
//         </svg>
//       );
//     default:
//       return null;
//   }
// };

interface ReviewFormData {
  stars: number;
  platform: string;
  accountId: string;
  content: string;
  title: string;
  contentUrl?: string;
  authorId: string;
  status?: "PUBLISHED" | "DRAFT";
  verificationStatus?: "IN_PROGRESS";
}

export const CreatorRating = ({
  accountId,
  platform,
  stars = 0,
}: {
  accountId: string;
  platform: string;
  stars?: number;
}) => {
  const searchParams = useSearchParams();
  const [creatorData, setCreatorData] = useState<CreatorData | null>(null);
  const [formData, setFormData] = useState<ReviewFormData>({
    stars: stars,
    platform: platform,
    accountId: accountId,
    content: "",
    title: "",
    authorId: "",
  });
  const [urlMetadata, setUrlMetadata] = useState<{
    title?: string;
    description?: string;
    image?: string;
  }>();
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isCreatorDataLoading, setIsCreatorDataLoading] = useState(false);

  useEffect(() => {
    const fetchCreatorData = async () => {
      setIsCreatorDataLoading(true);
      try {
        const data = await getCreatorData({ accountId, platform });
        setCreatorData(data);
      } catch (error) {
        console.error("Failed to fetch creator data:", error);
      } finally {
        setIsCreatorDataLoading(false);
      }
    };

    if (accountId && platform) {
      fetchCreatorData();
    }
  }, [accountId, platform]);

  useEffect(() => {
    // Get URL parameters
    const stars = Number(searchParams.get("stars")) || 0;
    const platform = searchParams.get("platform") || "";
    const accountId = searchParams.get("accountId") || "";

    setFormData((prev) => ({
      ...prev,
      stars,
      platform,
      accountId,
    }));
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement review submission logic
    console.log("Submitting review:", formData);
  };

  const handleUrlChange = async (url: string) => {
    // Clean the URL if it starts with @ or has other prefixes
    const cleanUrl = url.replace(/^@/, "").trim();
    setFormData((prev) => ({ ...prev, contentUrl: cleanUrl }));

    if (!cleanUrl) {
      setUrlMetadata(undefined);
      return;
    }

    // Check if it's a Twitter/X URL
    if (
      platform.toLowerCase() === "twitter" ||
      cleanUrl.includes("twitter.com") ||
      cleanUrl.includes("x.com")
    ) {
      const tweetId = extractTweetId(cleanUrl);
      if (tweetId) {
        setUrlMetadata({
          title: `Tweet ID: ${tweetId}`,
          description: cleanUrl,
        });
        return;
      }
    }

    try {
      setIsLoadingMetadata(true);

      const response = await fetch(
        `/api/metadata?url=${encodeURIComponent(cleanUrl)}`
      );

      const metadata = await response.json();

      if (response.ok) {
        setUrlMetadata({
          title: metadata.title,
          description: metadata.description,
          image: metadata.image,
        });
      }
    } catch (error) {
      console.error("Failed to fetch metadata:", error);
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  return (
    <>
      <div className='sticky top-16 z-10 bg-background border-b-[1px] dark:border-neutral-600 shadow-md'>
        <div className='container max-w-4xl mx-auto px-4'>
          {isCreatorDataLoading ? (
            <CreatorHeaderSkeleton />
          ) : (
            <div className='flex items-center justify-between py-4'>
              <div className='flex items-center gap-4'>
                <Avatar className='w-10 h-10 md:w-12 md:h-12 rounded-lg border border-border'>
                  <AvatarImage
                    src={
                      creatorData?.account.ytData?.snippet?.thumbnails?.high
                        ?.url || creatorData?.account.imageUrl
                    }
                  />
                  <AvatarFallback className='bg-primary/10 text-primary rounded-lg'>
                    {getInitials(
                      creatorData?.account.name_en ||
                        creatorData?.account.name ||
                        ""
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className='flex flex-col'>
                  <span className='font-medium text-base md:text-lg'>
                    {truncateText(
                      creatorData?.account.name_en ||
                        creatorData?.account.name ||
                        "",
                      20
                    )}
                  </span>
                  <span className='text-sm text-muted-foreground'>
                    {truncateText(creatorData?.account.handle || "", 20)}
                  </span>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <PlatformIcon platform={platform} />
                <span className='font-medium text-base md:text-lg capitalize'>
                  {platform}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className='container max-w-4xl mx-auto py-12 px-4 mt-2 sm:mt-6 md:mt-8 lg:mt-12'>
        <Card className='mx-auto p-4 md:p-6'>
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div>
              <h1 className='block text-xl md:text-2xl font-medium mb-2'>
                Rate your experience
              </h1>
              <div
                className='flex gap-1'
                onMouseLeave={() => setHoveredRating(null)}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <div
                    key={star}
                    className='cursor-pointer'
                    onMouseEnter={() => setHoveredRating(star)}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, stars: star }))
                    }
                  >
                    <Star
                      filled={
                        hoveredRating !== null
                          ? star <= hoveredRating
                          : star <= formData.stars
                      }
                      color={getRatingColor(hoveredRating || formData.stars)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className='mt-6'>
              <h1 className='block text-xl font-medium mb-2'>Title</h1>
              <Textarea
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder='Give your review a title...'
                className='resize-none min-h-0'
                rows={1}
                required
              />
            </div>

            <div>
              <label className='block text-xl font-medium mb-2'>
                Review Content
              </label>
              <Editor
                value={formData.content}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, content: value }))
                }
                placeholder='Write your review here...'
              />
            </div>

            <div>
              <label className='block text-xl font-medium mb-2'>
                Add URL (optional)
              </label>
              <div className='space-y-4'>
                <Input
                  type='url'
                  placeholder='Enter a URL to add to your review...'
                  value={formData.contentUrl || ""}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className='w-full'
                />

                {isLoadingMetadata && (
                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <Loader2 className='w-4 h-4 animate-spin' />
                    <span>Loading URL preview...</span>
                  </div>
                )}

                {urlMetadata && (
                  <div className='border rounded-lg p-4 space-y-2'>
                    {platform === "twitter" && formData.contentUrl && (
                      <TweetCard
                        id={extractTweetId(formData.contentUrl) || ""}
                      />
                    )}
                    {platform !== "twitter" && (
                      <>
                        {urlMetadata.image && (
                          <div className='relative w-full aspect-video rounded-lg overflow-hidden bg-muted'>
                            <img
                              src={urlMetadata.image}
                              alt={urlMetadata.title || "URL preview"}
                              className='object-cover'
                            />
                          </div>
                        )}
                        {urlMetadata.title && (
                          <h3 className='font-medium'>{urlMetadata.title}</h3>
                        )}
                        {urlMetadata.description && (
                          <p className='text-sm text-muted-foreground line-clamp-2'>
                            {urlMetadata.description}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className='flex justify-end'>
              <button
                type='submit'
                className='w-full md:w-auto px-6 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium'
              >
                Submit Review
              </button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
};
