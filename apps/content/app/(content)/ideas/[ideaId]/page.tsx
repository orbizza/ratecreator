import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { IdeaDetail } from "../../_components/ideas/idea-detail";
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

  return <IdeaDetail ideaId={params.ideaId} authorId={author.id} />;
}
