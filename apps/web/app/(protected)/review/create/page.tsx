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
  let creatorName = "Creator";
  let creatorImageUrl = "";
  const platform = searchParams.platform;
  const accountId = searchParams.accountId;

  if (platform && accountId) {
    try {
      const creator = await prisma.account.findFirst({
        where: {
          platform: platform.toUpperCase() as Platform,
          accountId: accountId,
        },
        select: {
          name_en: true,
          name: true,
          imageUrl: true,
        },
      });

      if (creator) {
        creatorName = creator.name_en || creator.name || "Creator";
        creatorImageUrl = creator?.imageUrl || "";
      }
    } catch (error) {
      console.error("Error fetching creator:", error);
      // Fallback to default creator name
    }
  }

  const title = `${creatorName}'s Review`;
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
