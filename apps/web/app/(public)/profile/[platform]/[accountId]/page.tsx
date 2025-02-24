import React from "react";
import { Metadata } from "next";
import { getPrismaClient } from "@ratecreator/db/client";
import { CreatorProfile } from "@ratecreator/ui/review";
import { Platform } from "@ratecreator/types/review";
import { formatFloat, formatValue } from "@ratecreator/db/utils";
// Generate dynamic metadata for creator profiles
export async function generateMetadata({
  params: { accountId, platform },
}: {
  params: { accountId: string; platform: string };
}): Promise<Metadata> {
  const prisma = getPrismaClient();

  // Fetch creator data
  const account = await prisma.account.findFirst({
    where: {
      accountId: accountId,
      platform: platform.toUpperCase() as Platform,
      isSuspended: false,
    },
    select: {
      name: true,
      name_en: true,
      description: true,
      description_en: true,
      imageUrl: true,
      followerCount: true,
      rating: true,
      reviewCount: true,
      platform: true,
      handle: true,
    },
  });

  if (!account) {
    return {
      title: "Creator Not Found",
      description: "The creator profile you're looking for could not be found.",
    };
  }

  const name = account.name_en || account.name || account.handle || "Creator";
  const description = `${name} is a creator on ${platform}. View their ratings and reviews on Rate Creator.`;

  return {
    title: `${name} on ${platform}`,
    description,
    openGraph: {
      title: `${name} on ${platform}`,
      description,
      images: [
        {
          url:
            account.imageUrl || "https://ratecreator.com/ratecreator-dark.svg",
          width: 1200,
          height: 630,
          alt: `${name}'s profile picture`,
        },
      ],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} on ${platform}`,
      description,
      images: [
        account.imageUrl || "https://ratecreator.com/ratecreator-dark.svg",
      ],
      creator: "@ratecreator",
    },
    other: {
      "profile:username": account.handle || "",
      "profile:platform": platform,
      "profile:rating": formatFloat(account.rating || 0),
      "profile:reviews": formatValue(account.reviewCount || 0),
    },
  };
}

export default function ReviewProfile({
  params: { accountId, platform },
}: {
  params: { accountId: string; platform: string };
}) {
  return (
    <main className="min-h-[calc(100vh-20vh)]">
      <CreatorProfile accountId={accountId} platform={platform} />
    </main>
  );
}
