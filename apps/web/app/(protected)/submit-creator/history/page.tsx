import { getUserSubmissions } from "@ratecreator/actions";
import { Badge } from "@ratecreator/ui";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Submission History - Rate Creator",
};

const STATUS_LABELS: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  PENDING: { label: "Pending", variant: "secondary" },
  VALIDATING: { label: "Validating", variant: "secondary" },
  PROCESSING: { label: "Processing", variant: "default" },
  COMPLETED: { label: "Completed", variant: "outline" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  DUPLICATE: { label: "Duplicate", variant: "destructive" },
};

export default async function SubmissionHistoryPage() {
  const { submissions } = await getUserSubmissions();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/submit-creator"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Submit a Creator
      </Link>

      <h1 className="mb-6 text-2xl font-bold">Submission History</h1>

      {submissions.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No submissions yet.
        </p>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => {
            const statusInfo =
              STATUS_LABELS[sub.status] || STATUS_LABELS.PENDING;
            return (
              <div
                key={sub.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {sub.platform}
                    </Badge>
                    <span className="text-sm font-medium">
                      {sub.identifier}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </p>
                  {sub.rejectionReason && (
                    <p className="mt-1 text-xs text-destructive">
                      {sub.rejectionReason}
                    </p>
                  )}
                </div>
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
