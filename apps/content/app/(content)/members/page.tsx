"use client";

import { useEffect, useState } from "react";
import { Loader2, Users, Mail } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  Separator,
} from "@ratecreator/ui";

export default function MembersPage(): JSX.Element {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-8 w-8 text-orange-500" />
        <Label className="text-3xl lg:text-4xl font-semibold">Members</Label>
      </div>

      <Separator className="bg-border h-[1px] mb-6" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-purple-500" />
              Newsletter Subscribers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Member management coming soon. Track your newsletter subscribers
              and engagement metrics.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-6 bg-muted/50 rounded-lg">
        <h3 className="font-semibold mb-2">Coming Soon</h3>
        <ul className="list-disc list-inside text-muted-foreground space-y-1">
          <li>View all newsletter subscribers</li>
          <li>Export subscriber lists</li>
          <li>Track subscriber engagement</li>
          <li>Manage subscriber preferences</li>
        </ul>
      </div>
    </div>
  );
}
