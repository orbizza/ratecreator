import { BlogContent } from "@ratecreator/ui/content";

export default function BlogPostPage({
  params,
}: {
  params: { postUrl: string };
}) {
  return <BlogContent params={params} />;
}
