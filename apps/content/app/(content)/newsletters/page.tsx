import { PostsListComponent } from "../_components/posts/posts-list-component";

export const metadata = {
  title: "Newsletters | Content Management",
  description: "View and manage your newsletters",
};

export default function NewslettersPage() {
  return (
    <PostsListComponent
      defaultContentTypeFilter="NEWSLETTER"
      pageTitle="Newsletters"
    />
  );
}
