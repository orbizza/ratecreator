import { IdeasComponent } from "../../_components/ideas/ideas-component";

export const metadata = {
  title: "Draft Created | Content Management",
  description: "View ideas that have been converted to drafts",
};

export default function DraftCreatedIdeasPage() {
  return (
    <IdeasComponent defaultFilter="DRAFT_CREATED" pageTitle="Draft Created" />
  );
}
