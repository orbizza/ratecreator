import { getListWithItems } from "@ratecreator/actions/review";
import { ListDetailContent } from "./list-detail-content";
import { notFound } from "next/navigation";

export default async function ListDetailPage({
  params,
}: {
  params: Promise<{ listId: string }>;
}) {
  const { listId } = await params;

  try {
    const list = await getListWithItems(listId);
    return <ListDetailContent initialList={list} />;
  } catch {
    notFound();
  }
}
