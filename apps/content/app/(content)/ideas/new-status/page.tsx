import { IdeasComponent } from "../../_components/ideas/ideas-component";

export const metadata = {
  title: "New Ideas | Content Management",
  description: "View and manage new content ideas",
};

export default function NewIdeasPage() {
  return <IdeasComponent defaultFilter="NEW" pageTitle="New Ideas" />;
}
