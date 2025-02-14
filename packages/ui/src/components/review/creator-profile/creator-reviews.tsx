"use client";

import { Suspense, useEffect, useState } from "react";
import { useRecoilState, useResetRecoilState } from "recoil";
import { ReviewCardSkeleton } from "../skeletons/creator-profile-skeletons";
import { ReviewListCardGridPublic } from "../cards/review-list-card-grid-public";
import { Platform, ReviewType } from "@ratecreator/types/review";
import { pageNumberState } from "@ratecreator/store/review";
import { PaginationBar } from "../cards/pagination-bar";
import {
  fetchReviewsAction,
  fetchSelfReviewsAction,
  fetchTotalReviewsAction,
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
import { Info, ChartColumn, SwitchCamera, UserPen } from "lucide-react";

export const ReviewsYoutube = ({
  accountId,
  platform,
}: {
  accountId: string;
  platform: string;
}) => {
  const { isSignedIn } = useAuth();
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingSelfReviews, setLoadingSelfReviews] = useState(false);
  const [reviews, setReviews] = useState<ReviewType[]>([]);
  const [selfReviews, setSelfReviews] = useState<ReviewType[]>([]);
  const [currentPage, setCurrentPage] = useRecoilState(pageNumberState);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const reviewsPerPage = 2;

  const resetPageNumber = useResetRecoilState(pageNumberState);

  useEffect(() => {
    resetPageNumber();
  }, [resetPageNumber]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const fetchTotalReviews = async () => {
    const totalReviews = await fetchTotalReviewsAction(
      accountId,
      platform.toUpperCase() as Platform,
    );
    setTotalReviews(totalReviews);
  };

  const fetchSelfReviews = async () => {
    try {
      setLoadingSelfReviews(true);
      const selfReviews = await fetchSelfReviewsAction(
        accountId,
        platform.toUpperCase() as Platform,
      );

      setSelfReviews(selfReviews);
    } catch (error) {
      console.error("Error fetching self reviews:", error);
    } finally {
      setLoadingSelfReviews(false);
    }
  };

  useEffect(() => {
    fetchTotalReviews();
    if (isSignedIn) {
      fetchSelfReviews();
    }
    setCurrentPage(0);
  }, [isSignedIn]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoadingReviews(true);

        const fetchedReviews = await fetchReviewsAction(
          accountId,
          platform.toUpperCase() as Platform,
          currentPage,
          reviewsPerPage,
        );

        setReviews(fetchedReviews);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [currentPage]);

  if (loadingReviews && (isSignedIn ? loadingSelfReviews : false)) {
    return <ReviewCardSkeleton />;
  }

  return (
    <Suspense fallback={<ReviewCardSkeleton />}>
      {/* Summary Card */}
      {/* Sorting and Filtering */}

      <div className="text-2xl font-bold">Review Summary with Filters</div>
      {isSignedIn && selfReviews.length > 0 && (
        <>
          <Accordion type="single" collapsible defaultValue="channel-stats">
            <AccordionItem value="channel-stats" className="border-0">
              <AccordionTrigger className="text-lg lg:text-xl font-bold hover:no-underline lg:px-1">
                <div className="flex flex-row gap-x-2 items-center text-primary">
                  <SwitchCamera size={20} />
                  <span className="">My Reviews</span>
                  {/* <Info size={14} className='text-muted-foreground' /> */}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ReviewListCardGridSelf reviews={selfReviews} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <Separator className="my-4" />
        </>
      )}
      {reviews && reviews.length > 0 && (
        <>
          <div className="flex flex-row gap-x-2 items-center text-primary">
            <UserPen size={20} />
            <span className="text-lg lg:text-xl">User Reviews</span>
            {/* <Info size={14} className='text-muted-foreground' /> */}
          </div>
          <ReviewListCardGridPublic reviews={reviews} />
          <PaginationBar
            currentPage={currentPage}
            totalPages={Math.ceil(
              (totalReviews - selfReviews.length) / reviewsPerPage,
            )}
            onPageChange={handlePageChange}
            totalItems={totalReviews - selfReviews.length}
            itemsPerPage={reviewsPerPage}
          />
        </>
      )}
    </Suspense>
  );
};
