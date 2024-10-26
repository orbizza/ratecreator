"use client";

import { useSearchParams } from "next/navigation";

import React from "react";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q");
  const platform = searchParams.get("platform");

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">
        Search Results for {searchQuery}
        {platform && platform !== "All" && ` in ${platform}`}
      </h1>
    </div>
  );
}
