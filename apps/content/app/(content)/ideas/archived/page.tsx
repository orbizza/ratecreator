import { IdeasComponent } from "../../_components/ideas/ideas-component";

export const metadata = {
  title: "Archived Ideas | Content Management",
  description: "View archived content ideas",
};

export default function ArchivedIdeasPage() {
  return <IdeasComponent defaultFilter="ARCHIVED" pageTitle="Archived Ideas" />;
}
