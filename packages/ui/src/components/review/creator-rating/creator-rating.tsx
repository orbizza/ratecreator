"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Card,
  Input,
  Textarea,
  useToast,
} from "@ratecreator/ui";
import {
  getCreatorData,
  createReview,
  getRedditPostData,
} from "@ratecreator/actions/review";

import {
  CreatorData,
  Platform,
  ReviewFormData,
  ReviewValidator,
} from "@ratecreator/types/review";

import {
  getInitials,
  truncateText,
  convertToEmbeddedUrl,
  extractTweetId,
  extractTikTokVideoId,
  getRedditPostId,
} from "@ratecreator/db/utils";
import { Editor } from "./editor";
import { PlatformIcon } from "./platform-icons";
import { CreatorHeaderSkeleton } from "../skeletons/creator-review-header-skeleton";
import { useRouter } from "next/navigation";

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

const getLabelText = (platform: string) => {
  switch (platform) {
    case "youtube":
      return "Add Video URL (optional)";
    case "twitter":
      return "Add Tweet URL (optional)";
    case "tiktok":
      return "Add Tiktok URL (optional)";
    case "reddit":
      return "Add Reddit URL (optional)";
    default:
      return "Add URL (optional)";
  }
};

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
    platform: platform as Platform,
    accountId: accountId,
    content: "",
    title: "",
    authorId: "",
  });
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isCreatorDataLoading, setIsCreatorDataLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [disabled, setDisabled] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redditPostData, setRedditPostData] = useState<{
    title?: string;
    author?: string;
    subreddit?: string;
  } | null>(null);
  const [isLoadingRedditData, setIsLoadingRedditData] = useState(false);

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
      platform: platform.toUpperCase() as Platform,
      accountId,
    }));
  }, [searchParams]);

  useEffect(() => {
    const fetchRedditPostData = async (url: string) => {
      setIsLoadingRedditData(true);
      try {
        const data = await getRedditPostData(url);
        if (data.success) {
          setRedditPostData({
            title: data.title,
            author: data.author,
            subreddit: data.subreddit,
          });
        } else {
          setRedditPostData(null);
        }
      } catch (error) {
        console.error("Failed to fetch Reddit post data:", error);
        setRedditPostData(null);
      } finally {
        setIsLoadingRedditData(false);
      }
    };

    if (platform === "reddit" && formData.contentUrl) {
      fetchRedditPostData(formData.contentUrl);
    }
  }, [platform, formData.contentUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate form data
      const validatedData = ReviewValidator.parse({
        ...formData,
        content: {
          ...formData.content,
          redditMetadata:
            platform === "reddit" && redditPostData
              ? {
                  title: redditPostData.title,
                  author: redditPostData.author,
                  subreddit: redditPostData.subreddit,
                }
              : undefined,
        },
      });

      // Call the server action directly
      setIsSubmitting(true);
      const result = await createReview(validatedData);

      if (!result.success) {
        toast({
          title: "Error",
          description: result.error || "Failed to submit review",
          variant: "destructive",
        });
        return;
      }

      // Show success message
      toast({
        title: "Success",
        description: "Your review has been submitted successfully!",
      });

      // Redirect to the creator's page
      router.push(`/profile/${platform}/${accountId}`);
      router.refresh(); // Refresh the page to show the new review
    } catch (error) {
      console.error("Error submitting review:", error);

      // Show error message to user
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUrlChange = async (url: string) => {
    // Clean the URL if it starts with @ or has other prefixes
    const cleanUrl = url.replace(/^@/, "").trim();
    setFormData((prev) => ({ ...prev, contentUrl: cleanUrl }));
  };

  useEffect(() => {
    if (formData.title && formData.stars > 0) {
      setDisabled(false);
    } else {
      setDisabled(true);
    }
  }, [formData]);

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
                What you had to say
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
                {getLabelText(platform)}
              </label>
              <div className='space-y-4'>
                <Input
                  type='url'
                  placeholder='Enter a URL to add to your review...'
                  value={formData.contentUrl || ""}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className='w-full'
                />

                {formData.contentUrl && (
                  <div className='rounded-lg p-4'>
                    {platform === "twitter" &&
                      extractTweetId(formData.contentUrl) && (
                        <div className='flex justify-center relative aspect-video'>
                          <iframe
                            src={`https://platform.twitter.com/embed/Tweet.html?id=${extractTweetId(formData.contentUrl)}`}
                            className='w-full h-full object-cover rounded-md shadow-md'
                            allow='accelerometer; clipboard-write; encrypted-media; gyroscope;'
                            allowFullScreen
                          />
                        </div>
                      )}
                    {platform === "youtube" && (
                      <div className='flex justify-center relative aspect-video'>
                        <iframe
                          src={convertToEmbeddedUrl(formData.contentUrl)}
                          className='w-full h-full object-cover rounded-md shadow-md'
                          allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                          allowFullScreen
                        />
                      </div>
                    )}
                    {platform === "tiktok" &&
                      extractTikTokVideoId(formData.contentUrl) && (
                        <div className='flex justify-center relative aspect-video'>
                          <iframe
                            src={`https://www.tiktok.com/embed/v2/${extractTikTokVideoId(formData.contentUrl)}`}
                            className='w-full h-full object-cover rounded-md shadow-md'
                            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                            allowFullScreen
                          />
                        </div>
                      )}
                    {platform === "reddit" &&
                      getRedditPostId(formData.contentUrl) && (
                        <div className='flex flex-col gap-3 p-4 bg-muted rounded-lg'>
                          {isLoadingRedditData ? (
                            <div className='animate-pulse space-y-2'>
                              <div className='h-4 bg-muted-foreground/20 rounded w-3/4'></div>
                              <div className='h-3 bg-muted-foreground/20 rounded w-1/2'></div>
                            </div>
                          ) : redditPostData ? (
                            <>
                              <h3 className='font-medium text-lg'>
                                {redditPostData.title}
                              </h3>
                              <div className='text-sm text-muted-foreground'>
                                Posted by u/{redditPostData.author} in{" "}
                                {redditPostData.subreddit}
                              </div>
                              <a
                                href={formData.contentUrl}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-primary hover:underline text-sm mt-2'
                              >
                                View on Reddit →
                              </a>
                            </>
                          ) : (
                            <a
                              href={formData.contentUrl}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-primary hover:underline'
                            >
                              View Reddit Post
                            </a>
                          )}
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>

            <div className='flex justify-end'>
              <Button
                type='submit'
                className='w-full md:w-auto px-6 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium'
                disabled={disabled}
              >
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
};
