import { PostsListComponent } from "../_components/posts/posts-list-component";

export const metadata = {
  title: "Legal | Content Management",
  description: "View and manage legal documents",
};

export default function LegalPage() {
  return (
    <PostsListComponent defaultContentTypeFilter="LEGAL" pageTitle="Legal" />
  );
}
