"use client";

import { useState, useTransition } from "react";
import {
  MessageCircle,
  Reply,
  MoreVertical,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  Button,
  Textarea,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@ratecreator/ui";
import { cn } from "@ratecreator/ui/utils";
import { VoteButtons, VoteType } from "./vote-buttons";
import { formatDate, getInitials } from "@ratecreator/db/utils";

export interface CommentAuthor {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  imageUrl: string | null;
}

export interface Comment {
  id: string;
  content: { text?: string } | string;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  author: CommentAuthor;
  upvotes: number;
  downvotes: number;
  score: number;
  userVote: VoteType | null;
  replies: Comment[];
  replyCount: number;
}

export interface CommentSectionProps {
  reviewId: string;
  comments: Comment[];
  totalComments: number;
  currentUserId?: string | null;
  onCreateComment: (
    content: string,
    replyToId?: string,
  ) => Promise<{ success: boolean; data?: Comment; error?: string }>;
  onVoteComment: (
    commentId: string,
    voteType: VoteType,
  ) => Promise<{
    success: boolean;
    upvotes?: number;
    downvotes?: number;
    userVote?: VoteType | null;
    error?: string;
  }>;
  onEditComment?: (
    commentId: string,
    content: string,
  ) => Promise<{ success: boolean; error?: string }>;
  onDeleteComment?: (
    commentId: string,
  ) => Promise<{ success: boolean; error?: string }>;
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
  isLoading?: boolean;
}

/**
 * Single Comment Component
 */
function CommentItem({
  comment,
  currentUserId,
  depth = 0,
  onReply,
  onVote,
  onEdit,
  onDelete,
}: {
  comment: Comment;
  currentUserId?: string | null;
  depth?: number;
  onReply: (commentId: string, content: string) => Promise<void>;
  onVote: (
    commentId: string,
    voteType: VoteType,
  ) => Promise<{
    success: boolean;
    upvotes?: number;
    downvotes?: number;
    userVote?: VoteType | null;
    error?: string;
  }>;
  onEdit?: (
    commentId: string,
    content: string,
  ) => Promise<{ success: boolean; error?: string }>;
  onDelete?: (
    commentId: string,
  ) => Promise<{ success: boolean; error?: string }>;
}) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [editContent, setEditContent] = useState(
    typeof comment.content === "string"
      ? comment.content
      : comment.content?.text || "",
  );
  const [showReplies, setShowReplies] = useState(depth < 2);
  const [isPending, startTransition] = useTransition();

  const isOwner = currentUserId === comment.author.id;
  const maxDepth = 4;
  const commentText =
    typeof comment.content === "string"
      ? comment.content
      : comment.content?.text || "";

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return;

    startTransition(async () => {
      await onReply(comment.id, replyContent);
      setReplyContent("");
      setIsReplying(false);
    });
  };

  const handleSubmitEdit = async () => {
    if (!editContent.trim() || !onEdit) return;

    startTransition(async () => {
      const result = await onEdit(comment.id, editContent);
      if (result.success) {
        setIsEditing(false);
      }
    });
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    startTransition(async () => {
      await onDelete(comment.id);
    });
  };

  const authorName =
    comment.author.firstName && comment.author.lastName
      ? `${comment.author.firstName} ${comment.author.lastName}`
      : comment.author.username || "Anonymous";

  return (
    <div
      className={cn(
        "flex gap-3",
        depth > 0 && "ml-6 pt-3 border-l-2 border-muted pl-4",
      )}
    >
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarImage src={comment.author.imageUrl || undefined} />
        <AvatarFallback className="text-xs">
          {getInitials(authorName)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{authorName}</span>
          <span className="text-xs text-muted-foreground">
            {formatDate(new Date(comment.createdAt).toISOString())}
          </span>
          {comment.isEdited && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="mt-2 space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Edit your comment..."
              className="min-h-[80px] text-sm"
              disabled={isPending}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSubmitEdit}
                disabled={isPending || !editContent.trim()}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(commentText);
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm mt-1 whitespace-pre-wrap break-words">
            {commentText}
          </p>
        )}

        {/* Actions */}
        {!isEditing && (
          <div className="flex items-center gap-2 mt-2">
            <VoteButtons
              upvotes={comment.upvotes}
              downvotes={comment.downvotes}
              userVote={comment.userVote}
              onVote={(voteType) => onVote(comment.id, voteType)}
              size="sm"
            />

            {depth < maxDepth && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setIsReplying(!isReplying)}
              >
                <Reply className="w-3 h-3 mr-1" />
                Reply
              </Button>
            )}

            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}

        {/* Reply input */}
        {isReplying && (
          <div className="mt-3 space-y-2">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="min-h-[80px] text-sm"
              disabled={isPending}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSubmitReply}
                disabled={isPending || !replyContent.trim()}
              >
                Reply
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsReplying(false);
                  setReplyContent("");
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Nested replies */}
        {comment.replies.length > 0 && (
          <div className="mt-2">
            {!showReplies ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => setShowReplies(true)}
              >
                <ChevronDown className="w-3 h-3 mr-1" />
                Show {comment.replies.length}{" "}
                {comment.replies.length === 1 ? "reply" : "replies"}
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground mb-2"
                  onClick={() => setShowReplies(false)}
                >
                  <ChevronUp className="w-3 h-3 mr-1" />
                  Hide replies
                </Button>
                <div className="space-y-3">
                  {comment.replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      currentUserId={currentUserId}
                      depth={depth + 1}
                      onReply={onReply}
                      onVote={onVote}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * CommentSection Component
 * Displays a list of comments with nested replies and voting
 */
export function CommentSection({
  reviewId,
  comments,
  totalComments,
  currentUserId,
  onCreateComment,
  onVoteComment,
  onEditComment,
  onDeleteComment,
  onLoadMore,
  hasMore = false,
  isLoading = false,
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [localComments, setLocalComments] = useState(comments);
  const [isPending, startTransition] = useTransition();

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    startTransition(async () => {
      const result = await onCreateComment(newComment);
      if (result.success && result.data) {
        setLocalComments((prev) => [result.data!, ...prev]);
        setNewComment("");
      }
    });
  };

  const handleReply = async (parentId: string, content: string) => {
    const result = await onCreateComment(content, parentId);
    if (result.success && result.data) {
      // Update local state to add the reply
      setLocalComments((prev) => {
        const updateReplies = (comments: Comment[]): Comment[] => {
          return comments.map((comment) => {
            if (comment.id === parentId) {
              return {
                ...comment,
                replies: [...comment.replies, result.data!],
                replyCount: comment.replyCount + 1,
              };
            }
            if (comment.replies.length > 0) {
              return {
                ...comment,
                replies: updateReplies(comment.replies),
              };
            }
            return comment;
          });
        };
        return updateReplies(prev);
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />
        <span className="font-medium">
          {totalComments} {totalComments === 1 ? "Comment" : "Comments"}
        </span>
      </div>

      {/* New comment form */}
      <div className="space-y-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="min-h-[100px]"
          disabled={isPending}
        />
        <div className="flex justify-end">
          <Button
            onClick={handleSubmitComment}
            disabled={isPending || !newComment.trim()}
          >
            Comment
          </Button>
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-4">
        {localComments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            currentUserId={currentUserId}
            onReply={handleReply}
            onVote={onVoteComment}
            onEdit={onEditComment}
            onDelete={onDeleteComment}
          />
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={onLoadMore} disabled={isLoading}>
            {isLoading ? "Loading..." : "Load more comments"}
          </Button>
        </div>
      )}

      {/* Empty state */}
      {localComments.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No comments yet. Be the first to comment!
        </div>
      )}
    </div>
  );
}
