import React from "react";
import { Metadata } from "next";

import { getPrismaClient } from "@ratecreator/db/client";
import { CreatorProfile } from "@ratecreator/ui/review";
import { Platform } from "@ratecreator/types/review";
import { formatFloat, formatValue } from "@ratecreator/db/utils";

const metadataBase = new URL("https://ratecreator.com");

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
  const getLabelText = (platform: string) => {
    switch (platform) {
      case "youtube":
        return "YouTube";
      case "twitter":
        return "X";
      case "tiktok":
        return "TikTok";
      case "reddit":
        return "Reddit";
      default:
        return platform;
    }
  };

  const getDescriptionText = (platform: string) => {
    switch (platform) {
      case "reddit":
        return `A Reddit community with ${formatValue(
          account.followerCount || 0,
        )} members. View their ratings and reviews on Rate Creator.`;
      case "youtube":
        return `A ${getLabelText(platform)} creator with ${formatValue(
          account.followerCount || 0,
        )} subscribers. View their ratings and reviews on Rate Creator.`;
      default:
        return `A ${getLabelText(platform)} creator with ${formatValue(
          account.followerCount || 0,
        )} followers. View their ratings and reviews on Rate Creator.`;
    }
  };

  const name = account.name_en || account.name || account.handle || "Creator";
  const description = getDescriptionText(platform);

  return {
    title: `${name} on ${getLabelText(platform)}`,
    description,
    openGraph: {
      title: `${name} on ${getLabelText(platform)}`,
      description,
      images: [
        {
          url: new URL(
            account.imageUrl || "/ratecreator.png",
            metadataBase,
          ).toString(),
          width: 1200,
          height: 630,
          alt: `${name}'s profile picture`,
        },
      ],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} on ${getLabelText(platform)}`,
      description,
      images: [
        new URL(
          account.imageUrl || "/ratecreator.png",
          metadataBase,
        ).toString(),
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
