"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ratecreator/ui";

type Platform =
  | "youtube"
  | "twitter"
  | "instagram"
  | "reddit"
  | "tiktok"
  | "twitch";

const platforms: { value: Platform; label: string; placeholder: string }[] = [
  {
    value: "youtube",
    label: "YouTube",
    placeholder: "Enter channel URL or @handle",
  },
  {
    value: "twitter",
    label: "X (Twitter)",
    placeholder: "Enter profile URL or @username",
  },
  {
    value: "instagram",
    label: "Instagram",
    placeholder: "Enter profile URL or @username",
  },
  {
    value: "reddit",
    label: "Reddit",
    placeholder: "Enter profile URL or u/username",
  },
  {
    value: "tiktok",
    label: "TikTok",
    placeholder: "Enter profile URL or @username",
  },
  {
    value: "twitch",
    label: "Twitch",
    placeholder: "Enter channel URL or username",
  },
];

export default function ClaimAccountPage() {
  const router = useRouter();
  const [platform, setPlatform] = useState<Platform | "">("");
  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"search" | "verify">("search");
  const [accountData, setAccountData] = useState<{
    id: string;
    name: string;
    handle: string;
    imageUrl: string;
    followerCount: number;
  } | null>(null);

  const handleSearch = async () => {
    if (!platform || !identifier) {
      setError("Please select a platform and enter an identifier");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/accounts/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, identifier }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to find account");
      }

      setAccountData(data.account);
      setStep("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!accountData) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/accounts/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: accountData.id, platform }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to claim account");
      }

      // Redirect to verification flow or account page
      router.push(`/accounts/${accountData.id}?claim=${data.claimId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPlatform = platforms.find((p) => p.value === platform);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Claim Account</h1>
        <p className="text-muted-foreground">
          Verify ownership of your creator profile to respond to reviews and
          manage your presence
        </p>
      </div>

      {step === "search" && (
        <Card>
          <CardHeader>
            <CardTitle>Find Your Account</CardTitle>
            <CardDescription>
              Search for your creator profile on Rate Creator
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <Select
                value={platform}
                onValueChange={(value) => setPlatform(value as Platform)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="identifier">Account URL or Username</Label>
              <Input
                id="identifier"
                placeholder={
                  selectedPlatform?.placeholder || "Enter account identifier"
                }
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleSearch}
              disabled={isLoading || !platform || !identifier}
              className="w-full"
            >
              {isLoading ? "Searching..." : "Search Account"}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "verify" && accountData && (
        <Card>
          <CardHeader>
            <CardTitle>Verify Ownership</CardTitle>
            <CardDescription>
              Confirm this is your account and verify ownership
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              {accountData.imageUrl && (
                <img
                  src={accountData.imageUrl}
                  alt={accountData.name}
                  className="w-16 h-16 rounded-full"
                />
              )}
              <div>
                <p className="font-medium text-lg">{accountData.name}</p>
                <p className="text-muted-foreground">@{accountData.handle}</p>
                <p className="text-sm text-muted-foreground">
                  {accountData.followerCount?.toLocaleString()} followers
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Verification Methods</h3>
              <div className="grid gap-3">
                <button
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors text-left"
                  onClick={handleClaim}
                >
                  <div className="p-2 rounded-full bg-primary/10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-5 w-5 text-primary"
                    >
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">
                      OAuth Verification (Recommended)
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Sign in with your {selectedPlatform?.label} account to
                      instantly verify
                    </p>
                  </div>
                </button>

                <button
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors text-left opacity-50 cursor-not-allowed"
                  disabled
                >
                  <div className="p-2 rounded-full bg-muted">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-5 w-5 text-muted-foreground"
                    >
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Bio Link Verification</p>
                    <p className="text-sm text-muted-foreground">
                      Add a verification link to your profile bio (coming soon)
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("search")}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleClaim}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Processing..." : "Start Verification"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
