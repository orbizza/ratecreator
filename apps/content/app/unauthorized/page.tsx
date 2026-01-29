import Link from "next/link";
import { Button } from "@ratecreator/ui";
import { ShieldX } from "lucide-react";

export const metadata = {
  title: "Unauthorized | Content Management",
  description: "You don't have permission to access this page",
};

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="mx-auto max-w-md text-center">
        <ShieldX className="mx-auto h-16 w-16 text-destructive" />
        <h1 className="mt-6 text-3xl font-bold tracking-tight">
          Access Denied
        </h1>
        <p className="mt-4 text-muted-foreground">
          You don&apos;t have permission to access the Content Management
          System. This area is restricted to Writers and Administrators only.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          If you believe this is an error, please contact your administrator.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button asChild variant="default">
            <Link href="https://ratecreator.com">Go to Rate Creator</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/sign-in">Sign in with a different account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
