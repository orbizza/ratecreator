"use client";

import { Suspense, useEffect, useState } from "react";
import { useRecoilState, useResetRecoilState } from "recoil";
import { ReviewCardSkeleton } from "../../skeletons/creator-profile-skeletons";
import { ReviewListCardGrid } from "../../cards/review-list-card-grid";
import { Platform, ReviewType } from "@ratecreator/types/review";
import { pageNumberState } from "@ratecreator/store/review";
import { PaginationBar } from "../../cards/pagination-bar";
import {
  fetchReviewsAction,
  fetchTotalReviewsAction,
} from "@ratecreator/actions/review";

export const ReviewsYoutube = ({
  accountId,
  platform,
}: {
  accountId: string;
  platform: string;
}) => {
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviews, setReviews] = useState<ReviewType[]>([]);
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
      platform.toUpperCase() as Platform
    );
    setTotalReviews(totalReviews);
  };

  useEffect(() => {
    fetchTotalReviews();
  }, []);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoadingReviews(true);

        const fetchedReviews = await fetchReviewsAction(
          accountId,
          platform.toUpperCase() as Platform,
          currentPage,
          reviewsPerPage
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

  if (loadingReviews) {
    return <ReviewCardSkeleton />;
  }

  return (
    <Suspense fallback={<ReviewCardSkeleton />}>
      <ReviewListCardGrid reviews={reviews} />
      <PaginationBar
        currentPage={currentPage}
        totalPages={Math.ceil(totalReviews / reviewsPerPage)}
        onPageChange={handlePageChange}
        totalItems={totalReviews}
        itemsPerPage={reviewsPerPage}
      />
    </Suspense>
  );
};
