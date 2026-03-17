"use client";

import { AuthGateModal } from "@ratecreator/ui/review";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGateModal>{children}</AuthGateModal>;
}
