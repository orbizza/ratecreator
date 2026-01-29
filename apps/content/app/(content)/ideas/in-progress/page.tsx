import { IdeasComponent } from "../../_components/ideas/ideas-component";

export const metadata = {
  title: "In Progress | Content Management",
  description: "View and manage ideas in progress",
};

export default function InProgressIdeasPage() {
  return <IdeasComponent defaultFilter="IN_PROGRESS" pageTitle="In Progress" />;
}
