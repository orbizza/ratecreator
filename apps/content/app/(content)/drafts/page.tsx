import { PostsListComponent } from "../_components/posts/posts-list-component";

export const metadata = {
  title: "Drafts | Content Management",
  description: "View and manage your draft posts",
};

export default function DraftsPage() {
  return <PostsListComponent defaultStatusFilter="DRAFT" pageTitle="Drafts" />;
}
