import { auth } from "@clerk/nextjs/server";
import { CreatorSidebar } from "@/components/dashboard/creator-sidebar";
import { CreatorHeader } from "@/components/dashboard/creator-header";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { LandingPage } from "@/components/landing/landing-page";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { userId } = await auth();

  // If logged in, show dashboard at /
  if (userId) {
    return (
      <div className="flex min-h-screen">
        <CreatorSidebar />
        <div className="flex-1 flex flex-col">
          <CreatorHeader />
          <main className="flex-1 p-6 bg-muted/30">
            <DashboardContent />
          </main>
        </div>
      </div>
    );
  }

  // Landing page for unauthenticated users
  return <LandingPage />;
}
