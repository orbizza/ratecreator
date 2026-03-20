"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { CommentWithReplies } from "@ratecreator/actions/review";

function CommentNode({
  comment,
  depth = 0,
  platform,
  accountId,
}: {
  comment: CommentWithReplies;
  depth?: number;
  platform: string;
  accountId: string;
}) {
  const authorName =
    [comment.author.firstName, comment.author.lastName]
      .filter(Boolean)
      .join(" ") ||
    comment.author.username ||
    "Anonymous";

  const contentText =
    typeof comment.content === "object" && comment.content !== null
      ? (comment.content as { text?: string }).text || ""
      : String(comment.content || "");

  return (
    <div className={depth > 0 ? "ml-6 border-l-2 border-border pl-4" : ""}>
      <div className="py-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{authorName}</span>
          <span className="text-muted-foreground">
            {new Date(comment.createdAt).toLocaleDateString()}
          </span>
          {comment.isEdited && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
        </div>
        <p className="mt-1 text-sm">{contentText}</p>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            {comment.upvotes} up &middot; {comment.downvotes} down
          </span>
          {comment.replyCount > 0 && <span>{comment.replyCount} replies</span>}
        </div>
      </div>
      {comment.replies.map((reply) => (
        <CommentNode
          key={reply.id}
          comment={reply}
          depth={depth + 1}
          platform={platform}
          accountId={accountId}
        />
      ))}
    </div>
  );
}

export function ThreadView({
  comment,
  platform,
  accountId,
}: {
  comment: CommentWithReplies;
  platform: string;
  accountId: string;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href={`/profile/${platform}/${accountId}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to profile
      </Link>

      <h1 className="mb-4 text-lg font-semibold">Thread</h1>
      <CommentNode
        comment={comment}
        platform={platform}
        accountId={accountId}
      />
    </div>
  );
}
