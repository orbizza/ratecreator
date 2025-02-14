import { ReviewType } from "@ratecreator/types/review";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.bubble.css";

import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  Separator,
  Button,
  Card,
} from "@ratecreator/ui";
import {
  getInitials,
  truncateText,
  formatDate,
  convertToEmbeddedUrl,
} from "@ratecreator/db/utils";
import {
  EllipsisVertical,
  ArrowBigDown,
  ArrowBigUp,
  MessageCircle,
  Share2,
  Flag,
  FlagOff,
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

interface ReviewCardPublicProps {
  review: ReviewType;
}

const YoutubeCard: React.FC<ReviewCardPublicProps> = ({ review }) => {
  return (
    <Card className='w-full h-full lg:w-3/4 lg:h-auto p-6 bg-background border dark:bg-card shadow-lg'>
      <div className='flex flex-row gap-4 justify-between'>
        <div className='flex items-center gap-3 mb-4'>
          {review.author?.imageUrl && (
            <Avatar className='sm:w-16 sm:h-16 w-12 h-12'>
              <AvatarImage src={review.author?.imageUrl} />
              <AvatarFallback>
                {getInitials(
                  review.author?.firstName + " " + review.author?.lastName ||
                    review.author?.email ||
                    ""
                )}
              </AvatarFallback>
            </Avatar>
          )}

          <div>
            <div className='font-medium'>{`${truncateText(
              review.author?.firstName + " " + review.author?.lastName ||
                review.author?.email ||
                "",
              20
            )}`}</div>
            <div className='text-sm text-muted-foreground flex items-center gap-2'>
              <span>{review.author?.username}</span>
            </div>
          </div>
        </div>
        <div>
          <Button variant='ghost' size='icon' className='rounded-full'>
            <EllipsisVertical className='w-4 h-4 sm:w-6 sm:h-6 ' />
            {/* ToDo: Add show history options */}
          </Button>
        </div>
      </div>
      <Separator className='my-4' />

      <div className='flex flex-row gap-2 items-center justify-between'>
        <div>
          <StarRating rating={review.stars} />
          {/* <span className='text-sm text-muted-foreground'>
            {review.stars} out of 5
          </span> */}
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
                    // className='[&_.ql-editor]:!text-lg sm:[&_.ql-editor]:!text-xl [&_.ql-editor]:!p-0 [&_.ql-editor_p]:!text-lg sm:[&_.ql-editor_p]:!text-xl [&_.ql-editor_img]:!max-w-full [&_.ql-editor_img]:!h-auto'
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
                // className='[&_.ql-editor]:!text-lg sm:[&_.ql-editor]:!text-xl [&_.ql-editor]:!p-0 [&_.ql-editor_p]:!text-lg sm:[&_.ql-editor_p]:!text-xl [&_.ql-editor_img]:!max-w-full [&_.ql-editor_img]:!h-auto'
              />
            </div>
          </div>
        </>
      )}

      {review.contentUrl && (
        <div className='text-lg sm:text-xl text-primary/70 gap-4 font-semibold mt-6'>
          Supporting Video
          <div className='relative w-full aspect-video mt-4'>
            <iframe
              src={convertToEmbeddedUrl(review.contentUrl)}
              title='YouTube video player'
              className='w-full h-full rounded-md shadow-md'
              allow='accelerometer; clipboard-write; encrypted-media; gyroscope;'
              allowFullScreen
            />
          </div>
        </div>
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
          <FlagOff className='w-5 h-5 sm:w-6 sm:h-6' />
        </Button>
      </div>
    </Card>
  );
};

const TwitterCard: React.FC<ReviewCardPublicProps> = ({ review }) => {
  return (
    <Card className='p-4 border-purple-200 hover:border-purple-300 transition-colors'>
      <div className='flex items-center gap-2 text-purple-600 mb-2'>
        <span className='font-semibold'>{review.title}</span>
      </div>
      <div className='mb-2'>
        <StarRating rating={review.stars} />
      </div>
      <div className='prose prose-sm max-w-none'>
        {typeof review.content === "object" ? (
          JSON.stringify(review.content)
        ) : (
          <ReactQuill
            value={review.content}
            readOnly={true}
            theme='bubble'
            modules={{ toolbar: false }}
          />
        )}
      </div>
    </Card>
  );
};

const TikTokCard: React.FC<ReviewCardPublicProps> = ({ review }) => {
  return (
    <Card className='p-4 border-pink-200 hover:border-pink-300 transition-colors'>
      <div className='flex items-center gap-2 text-pink-600 mb-2'>
        <span className='font-semibold'>{review.title}</span>
      </div>
      <div className='mb-2'>
        <StarRating rating={review.stars} />
      </div>
      <div className='prose prose-sm max-w-none'>
        {typeof review.content === "object" ? (
          JSON.stringify(review.content)
        ) : (
          <ReactQuill
            value={review.content}
            readOnly={true}
            theme='bubble'
            modules={{ toolbar: false }}
          />
        )}
      </div>
    </Card>
  );
};

const RedditCard: React.FC<ReviewCardPublicProps> = ({ review }) => {
  return (
    <Card className='p-4 border-pink-200 hover:border-pink-300 transition-colors'>
      <div className='flex items-center gap-2 text-pink-600 mb-2'>
        <span className='font-semibold'>{review.title}</span>
      </div>
      <div className='mb-2'>
        <StarRating rating={review.stars} />
      </div>
      <div className='prose prose-sm max-w-none'>
        {typeof review.content === "object" ? (
          JSON.stringify(review.content)
        ) : (
          <ReactQuill
            value={review.content}
            readOnly={true}
            theme='bubble'
            modules={{ toolbar: false }}
          />
        )}
      </div>
    </Card>
  );
};

const DefaultCard: React.FC<ReviewCardPublicProps> = ({ review }) => {
  return (
    <Card className='p-4'>
      <div className='font-semibold mb-2'>{review.title}</div>
      <div className='mb-2'>
        <StarRating rating={review.stars} />
      </div>

      <div className='prose prose-sm max-w-none'>
        {typeof review.content === "object" ? (
          JSON.stringify(review.content)
        ) : (
          <ReactQuill
            value={review.content}
            readOnly={true}
            theme='bubble'
            modules={{ toolbar: false }}
          />
        )}
      </div>
    </Card>
  );
};

export const ReviewCardPublic: React.FC<ReviewCardPublicProps> = ({
  review,
}) => {
  switch (review.platform.toLowerCase()) {
    case "youtube":
      return <YoutubeCard review={review} />;
    case "twitter":
      return <TwitterCard review={review} />;
    case "tiktok":
      return <TikTokCard review={review} />;
    case "reddit":
      return <RedditCard review={review} />;
    default:
      return <DefaultCard review={review} />;
  }
};
