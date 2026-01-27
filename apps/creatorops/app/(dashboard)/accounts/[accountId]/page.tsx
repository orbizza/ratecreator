import { auth } from "@clerk/nextjs/server";
import { getPrismaClient } from "@ratecreator/db/client";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@ratecreator/ui";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface AccountPageProps {
  params: Promise<{ accountId: string }>;
}

async function getAccountDetails(accountId: string, clerkUserId: string) {
  const prisma = getPrismaClient();

  const user = await prisma.user.findFirst({
    where: { clerkId: clerkUserId },
  });

  if (!user) {
    return null;
  }

  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: {
      reviews: {
        where: { isDeleted: false },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          author: {
            select: { firstName: true, lastName: true, username: true },
          },
        },
      },
      categories: {
        include: {
          category: true,
        },
      },
    },
  });

  if (!account) {
    return null;
  }

  // Check if user has claimed or linked this account
  const claimedAccount = await prisma.claimedAccount.findFirst({
    where: { userId: user.id, accountId },
  });

  const linkedAccount = await prisma.userLinkedAccount.findFirst({
    where: { userId: user.id, accountId },
  });

  return {
    account,
    claimedAccount,
    linkedAccount,
    hasAccess: !!claimedAccount || !!linkedAccount,
  };
}

export default async function AccountDetailPage({ params }: AccountPageProps) {
  const { accountId } = await params;
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const data = await getAccountDetails(accountId, userId);

  if (!data || !data.account) {
    notFound();
  }

  const { account, claimedAccount, linkedAccount, hasAccess } = data;

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return "N/A";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Account Header */}
      <div className="flex items-start gap-6">
        {account.imageUrl && (
          <Image
            src={account.imageUrl}
            alt={account.name || "Account"}
            width={100}
            height={100}
            className="rounded-full"
          />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {account.name || account.handle}
            </h1>
            {claimedAccount?.status === "VERIFIED" && (
              <Badge variant="default">Verified Owner</Badge>
            )}
            {claimedAccount?.status === "PENDING" && (
              <Badge variant="secondary">Verification Pending</Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            @{account.handle || account.accountId}
          </p>
          <div className="flex items-center gap-4 mt-2">
            <Badge variant="outline">{account.platform}</Badge>
            <span className="text-sm text-muted-foreground">
              {formatNumber(account.followerCount)} followers
            </span>
            {account.rating && (
              <span className="text-sm text-muted-foreground">
                {account.rating.toFixed(1)} rating ({account.reviewCount}{" "}
                reviews)
              </span>
            )}
          </div>
        </div>
        {!hasAccess && (
          <Link href={`/accounts/claim?id=${accountId}`}>
            <Button>Claim This Account</Button>
          </Link>
        )}
      </div>

      {/* Access Warning */}
      {!hasAccess && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-amber-500/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5 text-amber-500"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <p className="font-medium">
                  You don&apos;t have access to manage this account
                </p>
                <p className="text-sm text-muted-foreground">
                  Claim this account to respond to reviews and access analytics
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="reviews" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="analytics" disabled={!hasAccess}>
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" disabled={!hasAccess}>
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Reviews</CardTitle>
              <CardDescription>
                {hasAccess
                  ? "Reviews from your community - respond to engage with your audience"
                  : "Recent reviews for this account"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {account.reviews.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No reviews yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {account.reviews.map((review) => (
                    <div key={review.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {review.author.firstName} {review.author.lastName}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            @{review.author.username}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill={i < review.stars ? "currentColor" : "none"}
                              stroke="currentColor"
                              className={`h-4 w-4 ${
                                i < review.stars
                                  ? "text-yellow-500"
                                  : "text-muted"
                              }`}
                            >
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <h3 className="font-medium mb-1">{review.title}</h3>
                      {review.content && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {review.content}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                        {hasAccess && (
                          <Button variant="ghost" size="sm">
                            Reply
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>
                Performance metrics for your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Analytics coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Settings coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
