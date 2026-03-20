"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Badge,
} from "@ratecreator/ui";
import { submitAccount, confirmSubmission } from "@ratecreator/actions";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const PLATFORMS = [
  {
    value: "youtube",
    label: "YouTube",
    placeholder: "https://youtube.com/@channelname",
  },
  {
    value: "twitter",
    label: "X / Twitter",
    placeholder: "https://x.com/username",
  },
  {
    value: "instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/username",
  },
  {
    value: "reddit",
    label: "Reddit",
    placeholder: "https://reddit.com/u/username",
  },
  {
    value: "tiktok",
    label: "TikTok",
    placeholder: "https://tiktok.com/@username",
  },
  {
    value: "twitch",
    label: "Twitch",
    placeholder: "https://twitch.tv/username",
  },
] as const;

type PlatformValue = (typeof PLATFORMS)[number]["value"];

export function SubmitCreatorForm({
  monthlyCount,
  monthlyLimit,
}: {
  monthlyCount: number;
  monthlyLimit: number;
}) {
  const [step, setStep] = useState<"platform" | "url" | "confirm" | "done">(
    "platform",
  );
  const [platform, setPlatform] = useState<PlatformValue | null>(null);
  const [url, setUrl] = useState("");
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const remaining = monthlyLimit - monthlyCount;
  const selectedPlatform = PLATFORMS.find((p) => p.value === platform);

  const handleSubmit = async () => {
    if (!platform || !url.trim()) return;
    setLoading(true);
    setError(null);

    const result = await submitAccount(platform, url.trim());
    setLoading(false);

    if (!result.success) {
      setError(result.error || "Failed to submit");
      return;
    }

    setSubmissionId(result.submissionId!);
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (!submissionId) return;
    setLoading(true);
    setError(null);

    const result = await confirmSubmission(submissionId);
    setLoading(false);

    if (!result.success) {
      setError(result.error || "Failed to confirm");
      return;
    }

    setStep("done");
  };

  if (step === "done") {
    return (
      <Card className="mt-8">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <CheckCircle className="mb-4 h-12 w-12 text-green-500" />
          <h2 className="text-xl font-semibold">Creator Submitted!</h2>
          <p className="mt-2 text-muted-foreground">
            The creator is being processed. You&apos;ll be notified when their
            profile is ready.
          </p>
          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setStep("platform");
                setPlatform(null);
                setUrl("");
                setSubmissionId(null);
                setError(null);
              }}
            >
              Submit another
            </Button>
            <Button asChild>
              <Link href="/submit-creator/history">View submissions</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between">
        <Badge variant={remaining > 0 ? "secondary" : "destructive"}>
          {remaining} of {monthlyLimit} submissions remaining this month
        </Badge>
        <Link
          href="/submit-creator/history"
          className="text-sm text-muted-foreground hover:underline"
        >
          View history
        </Link>
      </div>

      {/* Step 1: Platform */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Select Platform</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PLATFORMS.map((p) => (
              <Button
                key={p.value}
                variant={platform === p.value ? "default" : "outline"}
                className="w-full"
                onClick={() => {
                  setPlatform(p.value);
                  if (step === "platform") setStep("url");
                  setError(null);
                }}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 2: URL */}
      {step !== "platform" && selectedPlatform && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              2. Enter {selectedPlatform.label} URL or Handle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder={selectedPlatform.placeholder}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            {step === "url" && (
              <Button
                onClick={handleSubmit}
                disabled={!url.trim() || loading || remaining <= 0}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirm */}
      {step === "confirm" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. Confirm Submission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ready to submit this {selectedPlatform?.label} creator? The
              profile will be created and data will be fetched automatically.
            </p>
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("url")}>
                Back
              </Button>
              <Button onClick={handleConfirm} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm & Submit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
