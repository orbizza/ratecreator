// components/ReviewListCardGrid.tsx
import React from "react";

import { ReviewType } from "@ratecreator/types/review";
import { ReviewCardPublic } from "./review-card-public";
import { ReviewCardSelf } from "./review-card-self";

interface ReviewListCardGridProps {
  reviews: ReviewType[];
}

export const ReviewListCardGridSelf: React.FC<ReviewListCardGridProps> = ({
  reviews,
}) => {
  return (
    <div className='w-full flex flex-col items-center justify-center gap-4 mt-4 mb-10'>
      {reviews.map((review) => (
        <ReviewCardSelf key={review._id} review={review} />
      ))}
    </div>
  );
};
