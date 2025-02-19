import { Metadata } from "next";
import { currentUser } from "@clerk/nextjs/server";
import { getInitials } from "@ratecreator/db/utils";

export async function generateMetadata(): Promise<Metadata> {
  const user = await currentUser();

  const userName =
    user?.firstName ||
    user?.username ||
    getInitials(user?.emailAddresses[0]?.emailAddress || "") ||
    "User";

  const title = `${userName}'s Profile`;
  const description = `Manage your RateCreator profile settings, preferences, and account information in one place.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: "/ratecreator-dark.svg",
          width: 1200,
          height: 630,
          alt: `${userName} Profile on RateCreator`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/ratecreator-dark.svg"],
    },
  };
}

export default function UserProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
