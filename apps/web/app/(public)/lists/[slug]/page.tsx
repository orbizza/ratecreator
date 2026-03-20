import { getPublicList } from "@ratecreator/actions/review";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { Card, CardContent, Badge } from "@ratecreator/ui";
import type { Metadata } from "next";

function formatFollowers(count: number | null): string {
  if (!count) return "0";
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const list = await getPublicList(slug);
  if (!list) return { title: "List Not Found" };

  const ownerName =
    [list.owner.firstName, list.owner.lastName].filter(Boolean).join(" ") ||
    list.owner.username ||
    "Anonymous";

  return {
    title: `${list.name} by ${ownerName} - Rate Creator`,
    description:
      list.description || `A curated list of ${list.itemCount} creators`,
  };
}

export default async function PublicListPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const list = await getPublicList(slug);

  if (!list) notFound();

  const ownerName =
    [list.owner.firstName, list.owner.lastName].filter(Boolean).join(" ") ||
    list.owner.username ||
    "Anonymous";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{list.name}</h1>
        {list.description && (
          <p className="mt-1 text-muted-foreground">{list.description}</p>
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          By {ownerName} &middot; {list.itemCount}{" "}
          {list.itemCount === 1 ? "creator" : "creators"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.items.map((item) => (
          <Card key={item.id}>
            <Link
              href={`/profile/${item.account.platform.toLowerCase()}/${item.account.accountId}`}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full">
                  {item.account.imageUrl ? (
                    <Image
                      src={item.account.imageUrl}
                      alt={item.account.name || "Creator"}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted text-lg">
                      {(item.account.name || "?")[0]}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {item.account.name || item.account.handle}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {item.account.platform}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatFollowers(item.account.followerCount)} followers
                    </span>
                  </div>
                  {item.account.rating != null && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {item.account.rating.toFixed(1)}
                      {item.account.reviewCount != null && (
                        <span>({item.account.reviewCount})</span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
