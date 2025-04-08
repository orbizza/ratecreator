import React from "react";
import { Skeleton, Card, CardContent } from "@ratecreator/ui";

const ArticlesListingSkeleton = () => {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 sm:space-y-12 p-2 sm:p-4 bg-background">
      {/* Featured Articles Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Featured Blogs</h2>
        {/* First row - 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {[1, 2].map((i) => (
            <Card key={i} className="w-full bg-card/50 border-none">
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  <Skeleton className="h-52 w-full rounded-lg dark:bg-neutral-800/50 bg-neutral-200/50" />
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-5 w-5 rounded-full dark:bg-neutral-800/50 bg-neutral-200/50" />
                    <Skeleton className="h-4 w-32 dark:bg-neutral-800/50 bg-neutral-200/50" />
                  </div>
                  <Skeleton className="h-6 w-3/4 dark:bg-neutral-800/50 bg-neutral-200/50" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Second row - 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="w-full bg-card/50 border-none">
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  <Skeleton className="h-52 w-full rounded-lg dark:bg-neutral-800/50 bg-neutral-200/50" />
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-5 w-5 rounded-full dark:bg-neutral-800/50 bg-neutral-200/50" />
                    <Skeleton className="h-4 w-32 dark:bg-neutral-800/50 bg-neutral-200/50" />
                  </div>
                  <Skeleton className="h-6 w-3/4 dark:bg-neutral-800/50 bg-neutral-200/50" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* All Articles Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">All Blogs</h2>
          <Skeleton className="h-10 w-64 dark:bg-neutral-800/50 bg-neutral-200/50 rounded-md" />
        </div>

        {/* Article List */}
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 p-4 rounded-lg hover:bg-card/20"
            >
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-3/4 dark:bg-neutral-800/50 bg-neutral-200/50" />
                <Skeleton className="h-4 w-full dark:bg-neutral-800/50 bg-neutral-200/50" />
                <div className="flex items-center space-x-4 pt-2">
                  <Skeleton className="h-4 w-24 dark:bg-neutral-800/50 bg-neutral-200/50" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-6 w-16 dark:bg-neutral-800/50 bg-neutral-200/50 rounded-full" />
                    <Skeleton className="h-6 w-20 dark:bg-neutral-800/50 bg-neutral-200/50 rounded-full" />
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-8 rounded-full dark:bg-neutral-800/50 bg-neutral-200/50" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ArticlesListingSkeleton;
