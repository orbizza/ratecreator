import { BlogContent } from "@ratecreator/ui/content";

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  return <BlogContent params={params} />;
}
