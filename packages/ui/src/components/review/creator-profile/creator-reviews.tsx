"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { SwitchCamera, UserPen, Loader2 } from "lucide-react";
import { useIntersection } from "@mantine/hooks";
import { useInfiniteQuery } from "@tanstack/react-query";

import { ReviewCardSkeleton } from "../skeletons/creator-profile-skeletons";
import { ReviewListCardGridPublic } from "../cards/review-list-card-grid-public";
import { Platform, ReviewType } from "@ratecreator/types/review";

import {
  fetchReviewsAction,
  fetchSelfReviewsAction,
} from "@ratecreator/actions/review";
import { useAuth } from "@clerk/nextjs";
import { ReviewListCardGridSelf } from "../cards/review-list-card-grid-self";
import {
  Separator,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@ratecreator/ui";

export const CreatorReviews = ({
  accountId,
  platform,
}: {
  accountId: string;
  platform: string;
}) => {
  const { isSignedIn } = useAuth();
  const [loadingSelfReviews, setLoadingSelfReviews] = useState(false);
  const [selfReviews, setSelfReviews] = useState<ReviewType[]>([]);

  const reviewsPerPage = 10;

  const lastPostRef = useRef<HTMLElement>(null);
  const { ref, entry } = useIntersection({
    root: lastPostRef.current,
    threshold: 1,
  });

  const { data, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["reviews", accountId, platform],
      queryFn: async ({ pageParam = 0 }) => {
        const fetchedReviews = await fetchReviewsAction(
          accountId,
          platform.toUpperCase() as Platform,
          pageParam,
          reviewsPerPage
        );
        return fetchedReviews;
      },
      getNextPageParam: (lastPage, allPages) => {
        if (!lastPage || lastPage.length < reviewsPerPage) return undefined;
        return allPages.length;
      },
      initialPageParam: 0,
    });

  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage) {
      fetchNextPage();
    }
  }, [entry, fetchNextPage, hasNextPage]);

  useEffect(() => {
    if (isSignedIn) {
      fetchSelfReviews();
    }
  }, [isSignedIn]);

  const fetchSelfReviews = async () => {
    try {
      setLoadingSelfReviews(true);
      const selfReviews = await fetchSelfReviewsAction(
        accountId,
        platform.toUpperCase() as Platform
      );

      setSelfReviews(selfReviews);
    } catch (error) {
      console.error("Error fetching self reviews:", error);
    } finally {
      setLoadingSelfReviews(false);
    }
  };

  if (loadingSelfReviews && isSignedIn) {
    return (
      <div className='mt-5 space-y-4'>
        <ReviewCardSkeleton />
        <ReviewCardSkeleton />
      </div>
    );
  }

  const allReviews = data?.pages.flatMap((page) => page) ?? [];

  return (
    <Suspense fallback={<ReviewCardSkeleton />}>
      {/* Summary Card */}
      {/* Sorting and Filtering */}

      {/* <div className="text-2xl font-bold">Review Summary with Filters</div> */}
      {isSignedIn && selfReviews.length > 0 && (
        <>
          <Accordion type='single' collapsible defaultValue='channel-stats'>
            <AccordionItem value='channel-stats' className='border-0'>
              <AccordionTrigger className='text-lg lg:text-xl font-bold hover:no-underline lg:px-1'>
                <div className='flex flex-row gap-x-2 items-center text-primary'>
                  <SwitchCamera size={20} />
                  <span className=''>My Reviews</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ReviewListCardGridSelf reviews={selfReviews} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <Separator className='my-4' />
        </>
      )}
      {!data ? (
        <div className='mt-5 space-y-4'>
          <ReviewCardSkeleton />
          <ReviewCardSkeleton />
        </div>
      ) : allReviews.length > 0 ? (
        <>
          <div className='flex flex-row gap-x-2 items-center text-primary'>
            <UserPen size={20} />
            <span className='text-lg lg:text-xl'>User Reviews</span>
          </div>
          <ReviewListCardGridPublic reviews={allReviews} />
          <div ref={ref} className='w-full flex justify-center py-4'>
            {isFetchingNextPage && (
              <Loader2 className='w-6 h-6 text-zinc-500 animate-spin' />
            )}
            {!hasNextPage && allReviews.length > 0 && (
              <span className='text-sm text-muted-foreground'>
                No more user reviews
              </span>
            )}
          </div>
        </>
      ) : (
        <div className='text-center text-muted-foreground py-8'>
          No user reviews
        </div>
      )}
    </Suspense>
  );
};
