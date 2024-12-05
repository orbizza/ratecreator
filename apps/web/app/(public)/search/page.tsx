"use client";

import { useSearchParams } from "next/navigation";
import { CentralSearchResults } from "@ratecreator/ui/review";
import React from "react";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q");
  const platform = searchParams.get("platform");

  return (
    <CentralSearchResults
      searchQuery={searchQuery || ""}
      platform={platform || undefined}
    />
  );
}
