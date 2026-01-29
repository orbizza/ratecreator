import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { IdeaFullPageEditor } from "../../_components/ideas/idea-full-page-editor";
import { createAuthor } from "@ratecreator/actions/content";

export const metadata = {
  title: "Edit Idea | RateCreator Content",
  description: "Edit your content idea",
};

interface IdeaPageProps {
  params: {
    ideaId: string;
  };
}

export default async function IdeaPage({ params }: IdeaPageProps) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const author = await createAuthor();

  if ("error" in author) {
    redirect("/sign-in");
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      <IdeaFullPageEditor ideaId={params.ideaId} authorId={author.id} />
    </div>
  );
}
