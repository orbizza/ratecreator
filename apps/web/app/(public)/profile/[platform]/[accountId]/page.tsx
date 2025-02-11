"use client";

import React from "react";

import { CreatorProfile } from "@ratecreator/ui/review";

export default function ReviewProfile({
  params: { accountId, platform },
}: {
  params: { accountId: string; platform: string };
}) {
  return (
    <main className="min-h-[calc(100vh-20vh)]">
      <CreatorProfile accountId={accountId} platform={platform} />
    </main>
  );
}
