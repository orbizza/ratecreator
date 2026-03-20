import { getUserLists } from "@ratecreator/actions/review";
import { MyListsContent } from "./my-lists-content";

export const metadata = {
  title: "My Lists - Rate Creator",
  description: "Manage your creator lists",
};

export default async function MyListsPage() {
  const lists = await getUserLists();
  return <MyListsContent initialLists={lists} />;
}
