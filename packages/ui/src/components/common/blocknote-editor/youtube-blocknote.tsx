"use client";

import { createReactBlockSpec } from "@blocknote/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Input,
} from "@ratecreator/ui";
import { YouTubeIcon } from "../../review/creator-rating/platform-icons";
import { cn } from "@ratecreator/ui/utils";

/**
 * Extract a YouTube video ID from any common URL form. Returns null if the
 * URL is not a recognised YouTube/YouTube Shorts/youtu.be link.
 *
 * Validating server-stored URLs before they reach `<iframe src>` blocks the
 * XSS / arbitrary-iframe vector where a writer (or an attacker via a
 * compromised writer account) sets `props.url` to anything other than a
 * legitimate YouTube embed.
 */
function extractYouTubeVideoId(input: string): string | null {
  if (typeof input !== "string" || input.length === 0) return null;
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.toLowerCase();
  const isYouTube =
    host === "youtube.com" ||
    host === "www.youtube.com" ||
    host === "m.youtube.com" ||
    host === "youtube-nocookie.com" ||
    host === "www.youtube-nocookie.com";
  const isShortHost = host === "youtu.be";
  if (!isYouTube && !isShortHost) return null;

  let id: string | null = null;
  if (isShortHost) {
    id = url.pathname.replace(/^\//, "").split("/")[0] || null;
  } else if (url.pathname.startsWith("/watch")) {
    id = url.searchParams.get("v");
  } else if (url.pathname.startsWith("/embed/")) {
    id = url.pathname.replace(/^\/embed\//, "").split("/")[0] || null;
  } else if (url.pathname.startsWith("/shorts/")) {
    id = url.pathname.replace(/^\/shorts\//, "").split("/")[0] || null;
  }
  if (!id) return null;
  // YouTube IDs are always 11 chars, [A-Za-z0-9_-].
  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
  return id;
}

/**
 * Build a safe embed URL from a candidate. Returns "" for invalid inputs so
 * the iframe simply doesn't render.
 */
function toSafeYouTubeEmbedUrl(candidate: string): string {
  const id = extractYouTubeVideoId(candidate);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : "";
}

/**
 * YouTube Block Component for BlockNote
 *
 * This component enables embedding YouTube videos in the BlockNote editor.
 * It provides:
 * - Video embedding functionality
 * - Responsive video player
 * - Theme-aware styling
 * - Error handling for invalid video IDs
 *
 * The component uses the YouTube iframe API to display videos
 * and maintains aspect ratio for proper display.
 */

export const Youtube = createReactBlockSpec(
  {
    type: "youtube",
    propSchema: {
      url: {
        default: "" as const,
      },
    },
    content: "none",
  },
  {
    render: (props) => {
      let url = "";
      const safeSrc = toSafeYouTubeEmbedUrl(props.block.props.url);
      return (
        <div
          className={cn(
            !safeSrc
              ? "rounded-md w-full justify-center bg-background border border-border"
              : "relative w-full aspect-video",
          )}
        >
          {safeSrc ? (
            <iframe
              src={safeSrc}
              title="YouTube video player"
              className="absolute top-0 left-0 w-full h-full rounded-md shadow-md border border-border"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope;"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
            />
          ) : (
            <AlertDialog>
              <AlertDialogTrigger className="w-full">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full justify-start gap-x-2 hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                >
                  <YouTubeIcon size={18} />
                  Add Video
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className=" backdrop-blur-md shadow-lg border border-border bg-neutral-50/90 dark:bg-neutral-900/95">
                <AlertDialogHeader className="relative z-10">
                  <AlertDialogTitle className="text-foreground font-semibold">
                    Place YouTube video URL here:
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    <Input
                      type="text"
                      placeholder="Paste YouTube URL here..."
                      className="bg-background/80 backdrop-blur-sm border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-colors duration-200"
                      onChange={(e) => {
                        url = e.currentTarget.value;
                      }}
                    />
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="relative z-10">
                  <AlertDialogCancel className="bg-background/80 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground transition-colors duration-200">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      props.editor.updateBlock(props.block, {
                        type: "youtube",
                        props: {
                          // Store only the canonical safe embed URL.
                          url: toSafeYouTubeEmbedUrl(url),
                        },
                      })
                    }
                    className="bg-primary-foreground text-green-700 dark:text-green-500 hover:bg-primary-foreground/90 transition-colors duration-200"
                  >
                    Embed
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      );
    },
  },
);
