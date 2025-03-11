export default function RateCreatorNewsletter({
  params,
}: {
  params: { slug: string };
}) {
  return <div>Rate Creator Newsletter - {params.slug}</div>;
}
