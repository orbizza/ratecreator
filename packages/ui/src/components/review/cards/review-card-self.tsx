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
} from "@ratecreator/db/utils";
import {
  EllipsisVertical,
  ArrowBigDown,
  ArrowBigUp,
  MessageCircle,
  Share2,
} from "lucide-react";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

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

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  const color = getRatingColor(rating);
  return (
    <div className='flex gap-1'>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} filled={star <= rating} color={color} />
      ))}
    </div>
  );
};

interface ReviewCardSelfProps {
  review: ReviewType;
}

const PlatformContent: React.FC<{ platform: string; contentUrl: string }> = ({
  platform,
  contentUrl,
}) => {
  if (!contentUrl) return null;

  const renderContent = () => {
    switch (platform.toLowerCase()) {
      case "youtube":
        return (
          <iframe
            src={convertToEmbeddedUrl(contentUrl)}
            title='YouTube video player'
            className='w-full h-full rounded-md shadow-md'
            allow='accelerometer; clipboard-write; encrypted-media; gyroscope;'
            allowFullScreen
          />
        );
      case "twitter":
        return (
          <div className='flex justify-center relative aspect-video'>
            <iframe
              src={`https://platform.twitter.com/embed/Tweet.html?id=${extractTweetId(contentUrl)}`}
              className='w-full h-full object-cover rounded-md shadow-md'
              allow='accelerometer; clipboard-write; encrypted-media; gyroscope;'
              allowFullScreen
            />
          </div>
        );
      case "tiktok":
        return (
          <iframe
            src={`https://www.tiktok.com/embed/${extractTikTokVideoId(contentUrl)}`}
            className='w-full h-full object-cover rounded-md shadow-md'
            allow='accelerometer; clipboard-write; encrypted-media; gyroscope;'
            allowFullScreen
          />
        );
      // Add other platform-specific content renderers here
      default:
        return null;
    }
  };

  return (
    <div className='text-lg sm:text-xl text-primary/70 gap-4 font-semibold mt-6'>
      Supporting {platform} Content
      <div className='relative w-full aspect-video mt-4'>{renderContent()}</div>
    </div>
  );
};

export const ReviewCardSelf: React.FC<ReviewCardSelfProps> = ({ review }) => {
  const { user } = useUser();

  return (
    <Card className='w-full h-full lg:w-3/4 lg:h-auto p-6 bg-background border dark:bg-card shadow-lg'>
      <div className='flex flex-row gap-2 items-center justify-between'>
        <div>
          <StarRating rating={review.stars} />
        </div>
        <div className='text-sm sm:text-md md:text-lg lg:text-xl text-muted-foreground font-normal'>
          {formatDate(new Date(review.createdAt).toISOString())}
          {review.isEdited && (
            <span className='text-sm text-muted-foreground'>
              (edited {formatDate(new Date(review.updatedAt).toISOString())})
            </span>
          )}
        </div>
      </div>

      <h1 className='font-bold mb-8 text-primary text-2xl sm:text-3xl md:text-4xl mt-4'>
        {review.title}
      </h1>

      {typeof review.content === "object" ? (
        <div className='prose dark:prose-invert prose-2xl max-w-none'>
          {JSON.stringify(review.content) === "{}" ? (
            <span className='text-lg sm:text-xl text-muted-foreground'>
              No review content
            </span>
          ) : (
            <>
              <div className='flex flex-col gap-4'>
                <div className='text-2xl sm:text-3xl text-primary/70 font-semibold'>
                  Review Content
                </div>
                <div className='prose dark:prose-invert prose-2xl max-w-none'>
                  <ReactQuill
                    value={review.content}
                    readOnly={true}
                    theme='bubble'
                    modules={{ toolbar: false }}
                    className='[&_.ql-editor]:!text-lg sm:[&_.ql-editor]:!text-xl [&_.ql-editor]:!p-0 [&_.ql-editor_p]:!text-lg sm:[&_.ql-editor_p]:!text-xl [&_.ql-editor_img]:!max-w-full [&_.ql-editor_img]:!h-auto'
                  />
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          <div className='flex flex-col gap-4'>
            <div className='text-lg sm:text-xl text-primary/70 font-semibold'>
              Review Content
            </div>
            <div className='prose dark:prose-invert prose-2xl max-w-none'>
              <ReactQuill
                value={review.content}
                readOnly={true}
                theme='bubble'
                modules={{ toolbar: false }}
                className='[&_.ql-editor]:!text-lg sm:[&_.ql-editor]:!text-xl [&_.ql-editor]:!p-0 [&_.ql-editor_p]:!text-lg sm:[&_.ql-editor_p]:!text-xl [&_.ql-editor_img]:!max-w-full [&_.ql-editor_img]:!h-auto'
              />
            </div>
          </div>
        </>
      )}

      {review.contentUrl && (
        <PlatformContent
          platform={review.platform}
          contentUrl={review.contentUrl}
        />
      )}

      <Separator className='my-4' />

      <div className='text-sm mt-4 flex items-center justify-between gap-4'>
        <div className='flex items-center gap-1 sm:gap-4'>
          <div className='flex flex-row items-center gap-1 rounded-full p-0 border border-gray-200 dark:border-gray-800'>
            <Button variant='ghost' size='icon' className='rounded-full'>
              <ArrowBigUp className='w-6 h-6' />
            </Button>
            10
            <Button variant='ghost' size='icon' className='rounded-full'>
              <ArrowBigDown className='w-6 h-6' />
            </Button>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='sm'
              className='hover:text-foreground transition-colors rounded-full p-2 gap-2 sm:ml-2'
            >
              <MessageCircle className='w-5 h-5 sm:w-6 sm:h-6' />
              <span className='text-sm'>10</span>
            </Button>
            <Button
              variant='ghost'
              size='sm'
              className='hover:text-foreground transition-colors rounded-full p-2 gap-1 sm:gap-2'
            >
              <Share2 className='w-5 h-5 sm:w-6 sm:h-6' />
              <span className='text-sm'>Share</span>
            </Button>
          </div>
        </div>
        <Button
          variant='ghost'
          size='sm'
          className='hover:text-foreground transition-colors rounded-full p-2'
        >
          <EllipsisVertical className='w-5 h-5 sm:w-6 sm:h-6' />
        </Button>
      </div>
    </Card>
  );
};
