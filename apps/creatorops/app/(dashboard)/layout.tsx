import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CreatorSidebar } from "@/components/dashboard/creator-sidebar";
import { CreatorHeader } from "@/components/dashboard/creator-header";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="flex min-h-screen">
      <CreatorSidebar />
      <div className="flex-1 flex flex-col">
        <CreatorHeader />
        <main className="flex-1 p-6 bg-muted/30">{children}</main>
      </div>
    </div>
  );
}
