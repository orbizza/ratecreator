import { getMonthlySubmissionCount } from "@ratecreator/actions";
import { SubmitCreatorForm } from "./submit-creator-form";

export const metadata = {
  title: "Submit a Creator - Rate Creator",
  description: "Submit a new creator to be added to Rate Creator",
};

export default async function SubmitCreatorPage() {
  const monthlyCount = await getMonthlySubmissionCount();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">Submit a Creator</h1>
      <p className="mt-2 text-muted-foreground">
        Know a creator who isn&apos;t on Rate Creator yet? Submit them and
        we&apos;ll add their profile.
      </p>
      <SubmitCreatorForm monthlyCount={monthlyCount} monthlyLimit={5} />
    </div>
  );
}
