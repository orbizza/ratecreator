// components/ReviewListCardGrid.tsx
import React from "react";

import { ReviewType } from "@ratecreator/types/review";
import { ReviewCardPublic } from "./review-card-public";
import { ReviewCardSelf } from "./review-card-self";

/**
 * Props for the ReviewListCardGridSelf component
 */
interface ReviewListCardGridProps {
  /** Array of review objects to be displayed */
  reviews: ReviewType[];
}

/**
 * ReviewListCardGridSelf Component
 *
 * A grid component that displays a list of self-review cards.
 * Renders each review using the ReviewCardSelf component in a vertical layout.
 * This component is specifically for displaying the user's own reviews.
 *
 * @component
 * @param {ReviewListCardGridProps} props - Component props
 * @param {ReviewType[]} props.reviews - Array of review objects to display
 * @returns {JSX.Element} A grid of self-review cards
 */
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
