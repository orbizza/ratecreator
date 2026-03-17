"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button, Input, Card, CardContent } from "@ratecreator/ui";
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Mail,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import {
  fetchPublishedPostsPaginated,
  fetchPublishedPostsCount,
} from "@ratecreator/actions/content";

interface NewsletterPost {
  id: string;
  title: string;
  postUrl: string;
  excerpt: string;
  featureImage: string | null;
  publishDate: Date | null;
  author: {
    name: string | null;
    imageUrl: string | null;
  };
}

export default function NewsletterPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Archive state
  const [newsletters, setNewsletters] = useState<NewsletterPost[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [archiveLoading, setArchiveLoading] = useState(true);
  const pageSize = 10;
  const totalPages = Math.ceil(totalCount / pageSize);

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      setSuccess(true);
      setMessage("Your email has been verified! Welcome to the newsletter.");
    }
    if (searchParams.get("error")) {
      const errorType = searchParams.get("error");
      switch (errorType) {
        case "missing-token":
          setError("Verification link is missing a token.");
          break;
        case "invalid-token":
          setError(
            "This verification link is invalid or has expired. Please subscribe again.",
          );
          break;
        case "server-error":
          setError("Something went wrong. Please try again.");
          break;
        default:
          setError("An error occurred.");
      }
    }
  }, [searchParams]);

  const fetchArchive = useCallback(async () => {
    setArchiveLoading(true);
    try {
      const [posts, count] = await Promise.all([
        fetchPublishedPostsPaginated("newsletters", page),
        fetchPublishedPostsCount("newsletters"),
      ]);
      setNewsletters(posts as unknown as NewsletterPost[]);
      setTotalCount(count);
    } catch (err) {
      console.error("Error fetching newsletters:", err);
    } finally {
      setArchiveLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchArchive();
  }, [fetchArchive]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setMessage(data.message);
        setSuccess(true);
        setEmail("");
        setName("");
      }
    } catch {
      setError("Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero / Subscribe Section */}
      <div className="px-4 py-16 flex flex-col items-center">
        <div className="w-full max-w-lg text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-6">
            <Mail className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Rate Creator Newsletter
          </h1>
          <p className="text-muted-foreground text-lg">
            Get creator economy insights, platform updates, and community
            highlights delivered to your inbox.
          </p>
        </div>

        {success ? (
          <Card className="w-full max-w-lg">
            <CardContent className="p-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg text-foreground">{message}</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full max-w-lg">
            <CardContent className="p-6">
              <form onSubmit={handleSubscribe} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>
                <div>
                  <Input
                    type="text"
                    placeholder="Your name (optional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {message && !success && (
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    <span>{message}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    "Subscribing..."
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Subscribe
                    </span>
                  )}
                </Button>
              </form>

              <p className="text-xs text-muted-foreground text-center mt-4">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Newsletter Archive */}
      <div className="px-4 pb-16 max-w-4xl mx-auto">
        <div className="border-t border-border pt-12 mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Newsletter Archive
          </h2>
          <p className="text-muted-foreground">
            Browse past issues of the Rate Creator newsletter.
          </p>
        </div>

        {archiveLoading ? (
          <div className="text-center text-muted-foreground py-12">
            Loading newsletters...
          </div>
        ) : newsletters.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No newsletters published yet. Check back soon!</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              {newsletters.map((post) => (
                <Link
                  key={post.id}
                  href={`/newsletter/${post.postUrl}`}
                  className="group"
                >
                  <Card className="overflow-hidden transition-colors hover:border-green-500/50">
                    {post.featureImage && (
                      <div className="relative aspect-video overflow-hidden">
                        <Image
                          src={post.featureImage}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                    )}
                    <CardContent className="p-5">
                      <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-green-500 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {post.publishDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(post.publishDate).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </span>
                        )}
                        {post.author?.name && (
                          <span>by {post.author.name}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page >= totalPages - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
