"use client";

import { useSearchParams } from "next/navigation";

import { CreatorRating } from "@ratecreator/ui/review";

export default function CreateReviewPage() {
  const searchParams = useSearchParams();
  const platform = searchParams.get("platform");
  const accountId = searchParams.get("accountId");
  const stars = Number(searchParams.get("stars")) || 0;

  return (
    <CreatorRating
      platform={platform || ""}
      accountId={accountId || ""}
      stars={stars}
    />
  );
}
