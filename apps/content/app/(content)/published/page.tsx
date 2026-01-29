import { PostsListComponent } from "../_components/posts/posts-list-component";

export const metadata = {
  title: "Published Posts | Content Management",
  description: "View and manage your published posts",
};

export default function PublishedPage() {
  return (
    <PostsListComponent defaultStatusFilter="PUBLISHED" pageTitle="Published" />
  );
}
