"use client";

import { useState, useTransition } from "react";
import { ArrowBigUp, ArrowBigDown } from "lucide-react";
import { Button } from "@ratecreator/ui";
import { cn } from "@ratecreator/ui/utils";

export type VoteType = "UP" | "DOWN";

export interface VoteButtonsProps {
  upvotes: number;
  downvotes: number;
  userVote: VoteType | null;
  onVote: (voteType: VoteType) => Promise<{
    success: boolean;
    upvotes?: number;
    downvotes?: number;
    userVote?: VoteType | null;
    error?: string;
  }>;
  size?: "sm" | "md" | "lg";
  showScore?: boolean;
  disabled?: boolean;
}

/**
 * VoteButtons Component
 * Displays upvote/downvote buttons with Reddit-style interaction
 */
export function VoteButtons({
  upvotes: initialUpvotes,
  downvotes: initialDownvotes,
  userVote: initialUserVote,
  onVote,
  size = "md",
  showScore = true,
  disabled = false,
}: VoteButtonsProps) {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [userVote, setUserVote] = useState<VoteType | null>(initialUserVote);
  const [isPending, startTransition] = useTransition();

  const score = upvotes - downvotes;

  const handleVote = async (voteType: VoteType) => {
    if (disabled || isPending) return;

    // Optimistic update
    const previousUserVote = userVote;
    const previousUpvotes = upvotes;
    const previousDownvotes = downvotes;

    // Calculate new state optimistically
    if (userVote === voteType) {
      // Toggle off
      setUserVote(null);
      if (voteType === "UP") {
        setUpvotes((prev) => prev - 1);
      } else {
        setDownvotes((prev) => prev - 1);
      }
    } else if (userVote) {
      // Switch vote
      setUserVote(voteType);
      if (voteType === "UP") {
        setUpvotes((prev) => prev + 1);
        setDownvotes((prev) => prev - 1);
      } else {
        setUpvotes((prev) => prev - 1);
        setDownvotes((prev) => prev + 1);
      }
    } else {
      // New vote
      setUserVote(voteType);
      if (voteType === "UP") {
        setUpvotes((prev) => prev + 1);
      } else {
        setDownvotes((prev) => prev + 1);
      }
    }

    startTransition(async () => {
      const result = await onVote(voteType);

      if (!result.success) {
        // Revert on error
        setUserVote(previousUserVote);
        setUpvotes(previousUpvotes);
        setDownvotes(previousDownvotes);
        console.error("Vote failed:", result.error);
      } else if (
        result.upvotes !== undefined &&
        result.downvotes !== undefined
      ) {
        // Sync with server response
        setUpvotes(result.upvotes);
        setDownvotes(result.downvotes);
        setUserVote(result.userVote ?? null);
      }
    });
  };

  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-7 h-7",
  };

  const buttonSizeClasses = {
    sm: "h-7 w-7",
    md: "h-8 w-8",
    lg: "h-9 w-9",
  };

  return (
    <div className="flex flex-row items-center gap-1 rounded-full p-0 border border-gray-200 dark:border-gray-800">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "rounded-full transition-colors",
          buttonSizeClasses[size],
          userVote === "UP" && "text-orange-500 hover:text-orange-600",
          isPending && "opacity-50",
        )}
        onClick={() => handleVote("UP")}
        disabled={disabled || isPending}
        aria-label="Upvote"
      >
        <ArrowBigUp
          className={cn(sizeClasses[size], userVote === "UP" && "fill-current")}
        />
      </Button>
      {showScore && (
        <span
          className={cn(
            "text-sm font-medium min-w-[20px] text-center",
            score > 0 && "text-orange-500",
            score < 0 && "text-blue-500",
          )}
        >
          {score}
        </span>
      )}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "rounded-full transition-colors",
          buttonSizeClasses[size],
          userVote === "DOWN" && "text-blue-500 hover:text-blue-600",
          isPending && "opacity-50",
        )}
        onClick={() => handleVote("DOWN")}
        disabled={disabled || isPending}
        aria-label="Downvote"
      >
        <ArrowBigDown
          className={cn(
            sizeClasses[size],
            userVote === "DOWN" && "fill-current",
          )}
        />
      </Button>
    </div>
  );
}
