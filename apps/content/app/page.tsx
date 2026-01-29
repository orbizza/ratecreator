import { DashboardComponent } from "./(content)/_components/dashboard/dashboard-component";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard | Content Management",
  description: "Manage your content across all platforms",
};

export default function Page(): JSX.Element {
  return <DashboardComponent />;
}
