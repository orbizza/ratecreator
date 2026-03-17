"use client";

import { AuthGateModal } from "@ratecreator/ui/review";

export default function CategoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGateModal>{children}</AuthGateModal>;
}
