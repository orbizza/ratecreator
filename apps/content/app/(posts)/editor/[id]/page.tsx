import { fetchPostById } from "@ratecreator/actions/content";
import { EditContentPost } from "@ratecreator/ui/content";
export default async function EditorPage({
  params,
}: {
  params: { id: string };
}) {
  const post = await fetchPostById(params.id);

  if (!post) {
    return <div>Post not found</div>;
  }
  return <EditContentPost initialPost={post} />;
}
