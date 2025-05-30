"use client";

import { ReviewType } from "@ratecreator/types/review";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.bubble.css";
import { Card } from "../../ui/card";
import { useUser } from "@clerk/nextjs";
import { Separator, Button } from "@ratecreator/ui";
import {
  formatDate,
  convertToEmbeddedUrl,
  extractTweetId,
  extractTikTokVideoId,
  getRedditPostId,
} from "@ratecreator/db/utils";
import { getRedditPostData } from "@ratecreator/actions/review";
import {
  EllipsisVertical,
  ArrowBigDown,
  ArrowBigUp,
  MessageCircle,
  Share2,
} from "lucide-react";
import { useState, useEffect } from "react";

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

/**
 * Determines the color class for a rating based on its value
 * @param {number} rating - The rating value (1-5)
 * @returns {string} Tailwind color class
 */
const getRatingColor = (rating: number) => {
  if (rating >= 4.5) return "text-emerald-500";
  if (rating >= 4.0) return "text-green-500";
  if (rating >= 3.0) return "text-yellow-500";
  if (rating >= 2.0) return "text-orange-500";
  if (rating >= 1.0) return "text-red-500";
  return "text-red-600";
};

/**
 * Star Component
 * Renders a single star with fill state and color
 */
const Star = ({ filled, color }: { filled: boolean; color: string }) => {
  return (
    <svg
      className={`sm:w-10 sm:h-10 w-6 h-6 ${filled ? color : "text-gray-400 dark:text-gray-600"}`}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1"
    >
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/**
 * StarRating Component
 * Displays a row of 5 stars based on the rating value
 */
const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  const color = getRatingColor(rating);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} filled={star <= rating} color={color} />
      ))}
    </div>
  );
};

/**
 * Props for the ReviewCardSelf component
 */
interface ReviewCardSelfProps {
  review: ReviewType;
}

/**
 * PlatformContent Component
 * Renders embedded content from different social media platforms
 */
const PlatformContent: React.FC<{
  platform: string;
  contentUrl: string;
  review: ReviewType;
}> = ({ platform, contentUrl, review }) => {
  // Get Reddit metadata from redditMetadata field
  const redditMetadata = review.redditMetadata;

  if (!contentUrl) return null;

  /**
   * Renders the appropriate embedded content based on the platform
   */
  const renderContent = () => {
    switch (platform.toLowerCase()) {
      case "youtube":
        return (
          <iframe
            src={convertToEmbeddedUrl(contentUrl)}
            title="YouTube video player"
            className="w-full h-full rounded-md shadow-md"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope;"
            allowFullScreen
          />
        );
      case "twitter":
        return (
          <div className="flex justify-center relative aspect-video">
            <iframe
              src={`https://platform.twitter.com/embed/Tweet.html?id=${extractTweetId(contentUrl)}`}
              className="w-full h-full object-cover rounded-md shadow-md"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope;"
              allowFullScreen
            />
          </div>
        );
      case "tiktok":
        return (
          <iframe
            src={`https://www.tiktok.com/embed/${extractTikTokVideoId(contentUrl)}`}
            className="w-full h-full object-cover rounded-md shadow-md"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope;"
            allowFullScreen
          />
        );
      case "reddit":
        return (
          <div className="flex flex-col gap-3 p-4 bg-muted rounded-lg">
            {redditMetadata ? (
              <>
                <h3 className="font-medium text-secondary-foreground text-lg">
                  {redditMetadata.title}
                </h3>
                <div className="text-sm text-muted-foreground">
                  Posted by u/{redditMetadata.author} in{" "}
                </div>
                <a
                  href={contentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm mt-2"
                >
                  View on Reddit →
                </a>
              </>
            ) : (
              <a
                href={contentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                View Reddit Post
              </a>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="text-lg sm:text-xl text-primary/70 gap-4 font-semibold mt-6">
      {/* Platform-specific title */}
      {(() => {
        switch (platform.toLowerCase()) {
          case "youtube":
            return "Supporting YouTube Video";
          case "twitter":
            return "Supporting X (Twitter) Post/Article";
          case "tiktok":
            return "Supporting TikTok Video";
          case "reddit":
            return "Supporting Reddit Post";
          default:
            return "Supporting Content";
        }
      })()}
      {/* Embedded content container */}
      <div
        className={`relative w-full mt-4 ${platform.toLowerCase() === "reddit" ? "h-auto" : "aspect-video"}`}
      >
        {renderContent()}
      </div>
    </div>
  );
};

/**
 * ReviewCardSelf Component
 *
 * A review card component for displaying the user's own reviews.
 * Shows rating, content, and embedded platform content.
 *
 * @component
 * @param {ReviewCardSelfProps} props - Component props
 * @returns {JSX.Element} A self-review card component
 */
export const ReviewCardSelf: React.FC<ReviewCardSelfProps> = ({ review }) => {
  const { user } = useUser();

  return (
    <Card className="w-full h-full lg:w-3/4 lg:h-auto p-6 bg-background border dark:bg-card shadow-lg">
      {/* Rating and date section */}
      <div className="flex flex-row gap-2 items-center justify-between">
        <div>
          <StarRating rating={review.stars} />
        </div>
        <div className="text-sm sm:text-md md:text-lg lg:text-xl text-muted-foreground font-normal">
          {formatDate(new Date(review.createdAt).toISOString())}
          {review.isEdited && (
            <span className="text-sm text-muted-foreground">
              (edited {formatDate(new Date(review.updatedAt).toISOString())})
            </span>
          )}
        </div>
      </div>

      {/* Review title */}
      <h1 className="font-bold mb-8  text-2xl sm:text-3xl md:text-4xl mt-4">
        {review.title}
      </h1>

      {/* Review content */}
      <div className="prose dark:prose-invert prose-2xl max-w-none">
        {!review.content ? (
          <span className="text-lg sm:text-xl text-muted-foreground">
            You said nothing
          </span>
        ) : (
          <>
            <div className="flex flex-col gap-4">
              <div className="text-2xl sm:text-3xl text-primary/70 font-semibold">
                What you had to say
              </div>
              <div className="text-lg sm:text-xl whitespace-pre-wrap">
                {review.content}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Platform content section */}
      {review.contentUrl && (
        <PlatformContent
          platform={review.platform}
          contentUrl={review.contentUrl}
          review={review}
        />
      )}

      <Separator className="my-4" />

      {/* Interaction buttons */}
      <div className="text-sm mt-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 sm:gap-4">
          {/* Vote buttons */}
          <div className="flex flex-row items-center gap-1 rounded-full p-0 border border-gray-200 dark:border-gray-800">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowBigUp className="w-6 h-6" />
            </Button>
            <span className="text-sm">0</span>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowBigDown className="w-6 h-6" />
            </Button>
          </div>
          {/* Comment and share buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="hover:text-foreground transition-colors rounded-full p-2 gap-2 sm:ml-2"
            >
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-sm">0</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hover:text-foreground transition-colors rounded-full p-2 gap-1 sm:gap-2"
            >
              <Share2 className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-sm">Share</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
