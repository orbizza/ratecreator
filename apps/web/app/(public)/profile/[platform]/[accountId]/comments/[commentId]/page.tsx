import { getNestedReplies } from "@ratecreator/actions/review";
import { notFound } from "next/navigation";
import { ThreadView } from "./thread-view";

export default async function CommentThreadPage({
  params,
}: {
  params: Promise<{ platform: string; accountId: string; commentId: string }>;
}) {
  const { platform, accountId, commentId } = await params;

  const result = await getNestedReplies(commentId);
  if (!result.success || !result.comment) notFound();

  return (
    <ThreadView
      comment={result.comment}
      platform={platform}
      accountId={accountId}
    />
  );
}
