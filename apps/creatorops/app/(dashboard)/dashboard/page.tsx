import { auth } from "@clerk/nextjs/server";
import { getPrismaClient } from "@ratecreator/db/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ratecreator/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getCreatorStats(userId: string) {
  const prisma = getPrismaClient();

  // Get user from database
  const user = await prisma.user.findFirst({
    where: { clerkId: userId },
  });

  if (!user) {
    return null;
  }

  // Get claimed accounts count
  const claimedAccountsCount = await prisma.claimedAccount.count({
    where: { userId: user.id },
  });

  // Get linked accounts count
  const linkedAccountsCount = await prisma.userLinkedAccount.count({
    where: { userId: user.id },
  });

  // Get reviews for claimed accounts
  const claimedAccounts = await prisma.claimedAccount.findMany({
    where: { userId: user.id, status: "VERIFIED" },
    select: { accountId: true },
  });

  const accountIds = claimedAccounts.map((ca) => ca.accountId);

  const reviewsCount = await prisma.review.count({
    where: {
      accountId: { in: accountIds },
      isDeleted: false,
    },
  });

  // Get organization memberships
  const organizationsCount = await prisma.organizationMember.count({
    where: { userId: user.id },
  });

  return {
    claimedAccountsCount,
    linkedAccountsCount,
    reviewsCount,
    organizationsCount,
  };
}

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const stats = await getCreatorStats(userId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your creator portal. Manage your accounts and engage with
          your community.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Claimed Accounts
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.claimedAccountsCount ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Verified creator accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Linked Accounts
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.linkedAccountsCount ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Connected social accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.reviewsCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Reviews on your accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.organizationsCount ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Team memberships</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks for managing your presence
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link
              href="/accounts/claim"
              className="flex items-center p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="mr-4 p-2 rounded-full bg-primary/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4 text-primary"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Claim an Account</p>
                <p className="text-sm text-muted-foreground">
                  Verify ownership of your creator profile
                </p>
              </div>
            </Link>
            <Link
              href="/accounts"
              className="flex items-center p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="mr-4 p-2 rounded-full bg-primary/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4 text-primary"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <p className="font-medium">View Accounts</p>
                <p className="text-sm text-muted-foreground">
                  Manage your claimed and linked accounts
                </p>
              </div>
            </Link>
            <Link
              href="/organization"
              className="flex items-center p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="mr-4 p-2 rounded-full bg-primary/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4 text-primary"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Organizations</p>
                <p className="text-sm text-muted-foreground">
                  Manage team access and permissions
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates on your accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>No recent activity</p>
              <p className="text-sm">
                Activity will appear here once you have claimed accounts
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
