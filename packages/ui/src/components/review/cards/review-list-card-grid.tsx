// components/ReviewListCardGrid.tsx
import React from "react";

import { CardForSearchResult } from "./card-search-results";
import { ReviewType } from "@ratecreator/types/review";

interface ReviewListCardGridProps {
  reviews: ReviewType[];
}

export const ReviewListCardGrid: React.FC<ReviewListCardGridProps> = ({
  reviews,
}) => {
  return (
    <div className="w-full items-center justify-center md:justify-between grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
      {reviews.map((review) => (
        // <CardForSearchResult key={review.objectID} creator={review} />
        <div key={review._id}>{review._id}</div>
      ))}
    </div>
  );
};
