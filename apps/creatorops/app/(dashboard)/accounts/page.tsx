import { auth } from "@clerk/nextjs/server";
import { getPrismaClient } from "@ratecreator/db/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
} from "@ratecreator/ui";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

type Platform =
  | "YOUTUBE"
  | "TWITTER"
  | "INSTAGRAM"
  | "REDDIT"
  | "TIKTOK"
  | "TWITCH";

const platformIcons: Record<Platform, string> = {
  YOUTUBE: "/icons/youtube.svg",
  TWITTER: "/icons/twitter.svg",
  INSTAGRAM: "/icons/instagram.svg",
  REDDIT: "/icons/reddit.svg",
  TIKTOK: "/icons/tiktok.svg",
  TWITCH: "/icons/twitch.svg",
};

const platformColors: Record<Platform, string> = {
  YOUTUBE: "bg-red-500/10 text-red-500",
  TWITTER: "bg-blue-400/10 text-blue-400",
  INSTAGRAM: "bg-pink-500/10 text-pink-500",
  REDDIT: "bg-orange-500/10 text-orange-500",
  TIKTOK: "bg-black/10 text-black dark:bg-white/10 dark:text-white",
  TWITCH: "bg-purple-500/10 text-purple-500",
};

async function getLinkedAccounts(userId: string) {
  const prisma = getPrismaClient();

  const user = await prisma.user.findFirst({
    where: { clerkId: userId },
  });

  if (!user) {
    return { claimedAccounts: [], linkedAccounts: [] };
  }

  const claimedAccounts = await prisma.claimedAccount.findMany({
    where: { userId: user.id },
    include: {
      account: true,
    },
    orderBy: { claimedAt: "desc" },
  });

  const linkedAccounts = await prisma.userLinkedAccount.findMany({
    where: { userId: user.id },
    include: {
      account: true,
    },
    orderBy: { linkedAt: "desc" },
  });

  return { claimedAccounts, linkedAccounts };
}

export default async function AccountsPage() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const { claimedAccounts, linkedAccounts } = await getLinkedAccounts(userId);

  // Group accounts by platform
  const groupedClaimed = claimedAccounts.reduce(
    (acc, ca) => {
      const platform = ca.account.platform as Platform;
      if (!acc[platform]) {
        acc[platform] = [];
      }
      acc[platform].push(ca);
      return acc;
    },
    {} as Record<Platform, typeof claimedAccounts>,
  );

  const groupedLinked = linkedAccounts.reduce(
    (acc, la) => {
      const platform = la.platform.toUpperCase() as Platform;
      if (!acc[platform]) {
        acc[platform] = [];
      }
      acc[platform].push(la);
      return acc;
    },
    {} as Record<Platform, typeof linkedAccounts>,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground">
            Manage your claimed and linked social media accounts
          </p>
        </div>
        <Link href="/accounts/claim">
          <Button>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="mr-2 h-4 w-4"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Claim Account
          </Button>
        </Link>
      </div>

      {/* Claimed Accounts Section */}
      <Card>
        <CardHeader>
          <CardTitle>Claimed Accounts</CardTitle>
          <CardDescription>
            Creator profiles you have verified ownership of
          </CardDescription>
        </CardHeader>
        <CardContent>
          {claimedAccounts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No claimed accounts yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Claim your creator profile to respond to reviews and manage your
                presence
              </p>
              <Link href="/accounts/claim">
                <Button variant="outline" className="mt-4">
                  Claim Your First Account
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedClaimed).map(([platform, accounts]) => (
                <div key={platform}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-md text-xs ${platformColors[platform as Platform]}`}
                    >
                      {platform}
                    </span>
                    <span>
                      {accounts.length} account{accounts.length > 1 ? "s" : ""}
                    </span>
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {accounts.map((ca) => (
                      <Link key={ca.id} href={`/accounts/${ca.account.id}`}>
                        <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors">
                          {ca.account.imageUrl && (
                            <Image
                              src={ca.account.imageUrl}
                              alt={ca.account.name || "Account"}
                              width={48}
                              height={48}
                              className="rounded-full"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {ca.account.name || ca.account.handle}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              @{ca.account.handle || ca.account.accountId}
                            </p>
                          </div>
                          <Badge
                            variant={
                              ca.status === "VERIFIED" ? "default" : "secondary"
                            }
                          >
                            {ca.status}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Linked Accounts Section */}
      <Card>
        <CardHeader>
          <CardTitle>Linked Accounts</CardTitle>
          <CardDescription>
            Social accounts you have connected for quick access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {linkedAccounts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No linked accounts</p>
              <p className="text-sm text-muted-foreground mt-1">
                Link accounts to track their performance across platforms
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedLinked).map(([platform, accounts]) => (
                <div key={platform}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-md text-xs ${platformColors[platform as Platform]}`}
                    >
                      {platform}
                    </span>
                    <span>
                      {accounts.length} account{accounts.length > 1 ? "s" : ""}
                    </span>
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {accounts.map((la) => (
                      <Link key={la.id} href={`/accounts/${la.account.id}`}>
                        <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors">
                          {la.account.imageUrl && (
                            <Image
                              src={la.account.imageUrl}
                              alt={la.account.name || "Account"}
                              width={48}
                              height={48}
                              className="rounded-full"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {la.nickname ||
                                la.account.name ||
                                la.account.handle}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              @{la.account.handle || la.account.accountId}
                            </p>
                          </div>
                          {la.isPrimary && (
                            <Badge variant="outline">Primary</Badge>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
