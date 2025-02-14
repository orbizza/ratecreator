// components/ReviewListCardGrid.tsx
import React from "react";

import { ReviewType } from "@ratecreator/types/review";
import { ReviewCardPublic } from "./review-card-public";

interface ReviewListCardGridProps {
  reviews: ReviewType[];
}

export const ReviewListCardGridPublic: React.FC<ReviewListCardGridProps> = ({
  reviews,
}) => {
  return (
    <div className="w-full flex flex-col items-center justify-center gap-4 mt-10 mb-10">
      {reviews.map((review) => (
        <ReviewCardPublic key={review._id} review={review} />
      ))}
    </div>
  );
};
