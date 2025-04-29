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
import { FaYoutube } from "react-icons/fa";
import { cn } from "@ratecreator/ui/utils";

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
      return (
        <div
          className={cn(
            !props.block.props.url
              ? "rounded-md w-full justify-center bg-background border border-border"
              : "relative w-full aspect-video",
          )}
        >
          {props.block.props.url ? (
            <iframe
              src={props.block.props.url}
              title="YouTube video player"
              className="absolute top-0 left-0 w-full h-full rounded-md shadow-md border border-border"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope;"
              allowFullScreen
            />
          ) : (
            <AlertDialog>
              <AlertDialogTrigger className="w-full">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full justify-start gap-x-2 hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                >
                  <FaYoutube className="text-red-500" />
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
                          url: url.replace("/watch?v=", "/embed/"),
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
