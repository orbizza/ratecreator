import { Metadata } from "next";
import { getPrismaClient } from "@ratecreator/db/client";
import { Platform } from "@ratecreator/types/review";
import { CreateReviewContent } from "./create-review-content";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { accountId?: string; platform?: string };
}): Promise<Metadata> {
  const prisma = getPrismaClient();

  if (!searchParams.accountId || !searchParams.platform) {
    return {
      title: "Create Review",
      description: "Share your experience and rate a creator.",
    };
  }

  const creator = await prisma.account.findFirst({
    where: {
      platform: searchParams.platform.toUpperCase() as Platform,
      accountId: searchParams.accountId,
    },
    select: {
      name_en: true,
      name: true,
      imageUrl: true,
    },
  });

  if (!creator) {
    return {
      title: "Creator's review page not found",
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
  const creatorName = creator.name_en || creator.name;
  const creatorImageUrl = creator.imageUrl;

  const title = `${creatorName}'s Review for ${getLabelText(searchParams.platform)}`;
  const description = `Share your experience and rate ${creatorName}. Your feedback helps the community make informed decisions.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: new URL(
            creatorImageUrl || "/ratecreator.png",
            "https://ratecreator.com",
          ).toString(),
          width: 1200,
          height: 630,
          alt: `Review ${creatorName} on RateCreator`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        new URL(
          creatorImageUrl || "/ratecreator.png",
          "https://ratecreator.com",
        ).toString(),
      ],
    },
  };
}

export default function CreateReviewPage() {
  return (
    <main className="min-h-[calc(100vh-20vh)]">
      <CreateReviewContent />
    </main>
  );
}
