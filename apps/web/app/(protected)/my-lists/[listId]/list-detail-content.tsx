"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Globe, Lock, Share2, Trash2, Star } from "lucide-react";
import { Button, Card, CardContent, Badge } from "@ratecreator/ui";
import { removeFromList } from "@ratecreator/actions/review";

interface ListDetail {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  isPublic: boolean;
  isDefault: boolean;
  items: Array<{
    id: string;
    addedAt: Date;
    account: {
      id: string;
      platform: string;
      accountId: string;
      handle: string | null;
      name: string | null;
      imageUrl: string | null;
      followerCount: number | null;
      rating: number | null;
      reviewCount: number | null;
    };
  }>;
  total: number;
  hasMore: boolean;
}

function formatFollowers(count: number | null): string {
  if (!count) return "0";
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

export function ListDetailContent({
  initialList,
}: {
  initialList: ListDetail;
}) {
  const [list, setList] = useState(initialList);

  const handleRemove = async (itemAccountId: string) => {
    await removeFromList(list.id, itemAccountId);
    setList((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.account.id !== itemAccountId),
      total: prev.total - 1,
    }));
  };

  const handleShare = () => {
    if (list.isPublic) {
      navigator.clipboard.writeText(
        `${window.location.origin}/lists/${list.slug}`,
      );
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link
        href="/my-lists"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Lists
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            {list.name}
            {list.isPublic ? (
              <Globe className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Lock className="h-5 w-5 text-muted-foreground" />
            )}
          </h1>
          {list.description && (
            <p className="mt-1 text-muted-foreground">{list.description}</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            {list.total} {list.total === 1 ? "creator" : "creators"}
          </p>
        </div>
        {list.isPublic && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="gap-2"
          >
            <Share2 className="h-4 w-4" />
            Copy link
          </Button>
        )}
      </div>

      {list.items.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <p>This list is empty.</p>
          <p className="mt-2 text-sm">
            Browse creators and save them to this list.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.items.map((item) => (
            <Card key={item.id} className="group relative">
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
              <button
                onClick={() => handleRemove(item.account.id)}
                className="absolute right-3 top-3 rounded-md p-1.5 opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
