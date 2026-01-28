import { PostsListComponent } from "../_components/posts/posts-list-component";

export const metadata = {
  title: "All Posts | Content Management",
  description: "View and manage all your content posts",
};

export default function PostsPage() {
  return <PostsListComponent pageTitle="All Posts" />;
}
