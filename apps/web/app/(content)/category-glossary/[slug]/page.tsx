import { Metadata } from "next";
import { getPrismaClient } from "@ratecreator/db/client";

export async function generateMetadata({
  params: { slug },
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const prisma = getPrismaClient();

  // Fetch category data
  const category = await prisma.category.findFirst({
    where: {
      slug: slug,
    },
    select: {
      name: true,
      shortDescription: true,
      longDescription: true,
    },
  });

  if (!category) {
    return {
      title: "Category Not Found",
      description: "The category you're looking for could not be found.",
    };
  }

  const title = `${category.name}`;
  const description =
    category.shortDescription ||
    `Discover and review ${category.name.toLowerCase()} content creators. Find ratings, reviews, and insights from the community.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: "/ratecreator.png",
          width: 1200,
          height: 630,
          alt: `${category.name} Creators on Rate Creator`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/ratecreator.png"],
    },
  };
}

export default function CategoryGlossaryDetailPage() {
  return <div>Category Glossary Detail</div>;
}
