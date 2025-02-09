"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "@ratecreator/ui";

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

interface ReviewFormData {
  stars: number;
  platform: string;
  accountId: string;
  content: string;
}

export default function CreateReviewPage() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<ReviewFormData>({
    stars: 0,
    platform: "",
    accountId: "",
    content: "",
  });
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  useEffect(() => {
    // Get URL parameters
    const stars = Number(searchParams.get("stars")) || 0;
    const platform = searchParams.get("platform") || "";
    const accountId = searchParams.get("accountId") || "";

    setFormData((prev) => ({
      ...prev,
      stars,
      platform,
      accountId,
    }));
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement review submission logic
    console.log("Submitting review:", formData);
  };

  return (
    <div className='container mx-auto py-8 px-4'>
      <h1 className='text-2xl font-bold mb-6'>Write a Review</h1>
      <Card className='max-w-2xl mx-auto p-6'>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div>
            <label className='block text-sm font-medium mb-2'>
              Rating: {formData.stars} stars
            </label>
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

          <div>
            <label className='block text-sm font-medium mb-2'>
              Review Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, content: e.target.value }))
              }
              className='w-full min-h-[200px] p-3 border rounded-md'
              placeholder='Write your review here...'
              required
            />
          </div>

          <div className='flex justify-end'>
            <button
              type='submit'
              className='px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90'
            >
              Submit Review
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
