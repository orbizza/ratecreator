import { GlossaryPost } from "@ratecreator/ui/content";

export default async function GlossaryPostPage({
  params: { slug },
}: {
  params: { slug: string };
}) {
  return (
    <GlossaryPost
      params={{
        slug: slug,
      }}
    />
  );
}
