"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Globe, Lock, Trash2 } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@ratecreator/ui";
import { createList, deleteList } from "@ratecreator/actions/review";

interface ListSummary {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  isPublic: boolean;
  isDefault: boolean;
  itemCount: number;
  coverImages: Array<{
    imageUrl: string | null;
    name: string | null;
    platform: string;
  }>;
  updatedAt: Date;
}

export function MyListsContent({
  initialLists,
}: {
  initialLists: ListSummary[];
}) {
  const [lists, setLists] = useState(initialLists);

  const handleDelete = async (listId: string) => {
    try {
      await deleteList(listId);
      setLists((prev) => prev.filter((l) => l.id !== listId));
    } catch (err) {
      console.error("Failed to delete list:", err);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Lists</h1>
        <Button
          onClick={async () => {
            const result = await createList({
              name: `New List ${lists.length + 1}`,
            });
            if (result.success) {
              window.location.reload();
            }
          }}
          size="sm"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          New List
        </Button>
      </div>

      {lists.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-lg">No lists yet</p>
          <p className="mt-2 text-sm">
            Save creators to lists to organize and track your favorites.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <Card key={list.id} className="group relative overflow-hidden">
              <Link href={`/my-lists/${list.id}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {list.name}
                    {list.isPublic ? (
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </CardTitle>
                  {list.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {list.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex -space-x-2">
                    {list.coverImages.slice(0, 4).map((img, i) => (
                      <div
                        key={i}
                        className="h-10 w-10 overflow-hidden rounded-full border-2 border-background"
                      >
                        {img.imageUrl ? (
                          <Image
                            src={img.imageUrl}
                            alt={img.name || "Creator"}
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted text-xs">
                            {(img.name || "?")[0]}
                          </div>
                        )}
                      </div>
                    ))}
                    {list.itemCount > 4 && (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                        +{list.itemCount - 4}
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {list.itemCount}{" "}
                    {list.itemCount === 1 ? "creator" : "creators"}
                  </p>
                </CardContent>
              </Link>
              {!list.isDefault && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(list.id);
                  }}
                  className="absolute right-3 top-3 rounded-md p-1.5 opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
