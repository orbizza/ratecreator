export {
  createComment,
  getCommentsForReview,
  getNestedReplies,
  editComment,
  deleteComment,
  getCommentCount,
} from "./commentActions";

export type {
  CommentInput,
  CommentResult,
  CommentWithReplies,
  CommentSortBy,
} from "./commentActions";
