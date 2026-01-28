import { PostsListComponent } from "../_components/posts/posts-list-component";

export const metadata = {
  title: "Glossary | Content Management",
  description: "View and manage glossary entries",
};

export default function GlossaryPage() {
  return (
    <PostsListComponent
      defaultContentTypeFilter="GLOSSARY"
      pageTitle="Glossary"
    />
  );
}
