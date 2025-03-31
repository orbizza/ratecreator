import { fetchTagDetails } from "@ratecreator/actions/content";
import { EditTagComponent } from "@ratecreator/ui/content";
import { notFound } from "next/navigation";

export default async function TagPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const tag = await fetchTagDetails(slug);

  //Handle case where blog post is not found
  if (tag === null) {
    notFound();
  }

  return (
    <EditTagComponent
      id={tag?.id || ""}
      slug={tag?.slug || ""}
      description={tag?.description || ""}
      imageUrl={tag?.imageUrl || ""}
      posts={[]}
    />
  );
}
