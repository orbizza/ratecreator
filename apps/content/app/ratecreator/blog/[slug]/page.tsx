export default function RateCreatorBlog({
  params,
}: {
  params: { slug: string };
}) {
  return <div>Rate Creator Blog List - {params.slug}</div>;
}
