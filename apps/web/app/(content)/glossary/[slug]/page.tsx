import { GlossaryPost } from "@ratecreator/ui/content";

import { Metadata } from "next";
import { getPrismaClient } from "@ratecreator/db/client";

export async function generateMetadata({
  params: { slug },
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const prisma = getPrismaClient();

  // Fetch post data
  const post = await prisma.post.findFirst({
    where: {
      postUrl: slug,
    },
    select: {
      title: true,
      excerpt: true,
      metadataTitle: true,
      metadataDescription: true,
      metadataImageUrl: true,
      metadataKeywords: true,
    },
  });

  if (!post) {
    return {
      title: "Term Not Found",
      description: "The glossary term you're looking for could not be found.",
    };
  }

  const title = post.metadataTitle || `${post.title} - Glossary`;
  const description =
    post.metadataDescription ||
    post.excerpt ||
    `Learn about ${post.title} in our glossary.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: [
        {
          url: post.metadataImageUrl || "/ratecreator.png",
          width: 1200,
          height: 630,
          alt: `${post.title} on Rate Creator`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [post.metadataImageUrl || "/ratecreator.png"],
    },
    keywords: post.metadataKeywords,
  };
}

export default function GlossaryPostPage() {
  return <GlossaryPost />;
}
