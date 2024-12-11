import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@ratecreator/ui";
import { Skeleton } from "@ratecreator/ui";
import { cn } from "@ratecreator/ui/utils";

export const WIPPage = () => {
  return (
    <main className='flex min-h-screen flex-col items-center justify-center p-6'>
      <Card className='max-w-md w-full'>
        <CardHeader>
          <CardTitle>Work In Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-center mb-4'>
            This page is currently under construction. Please check back later!
          </p>
          <Skeleton className='h-4 w-3/4 mx-auto' />
          <Skeleton className='h-4 w-1/2 mx-auto mt-2' />
        </CardContent>
      </Card>
    </main>
  );
};
import { Construction } from "lucide-react";

interface WIPProps {
  title?: string;
  message?: string;
}

const defaultBg = cn(
  "bg-gradient-to-r",
  "from-[#ffffff] via-[#f3e8de] to-[#efd4d4]",
  "dark:from-[#646161] dark:via-[#333231] dark:to-[#0a0b0b]"
);

export const WIP = ({
  title = "Work in Progress",
  message = "This section is currently under construction. Please check back later.",
}: WIPProps) => {
  return (
    <div
      className={cn(
        "mt-14 min-h-[calc(100vh-30vh)] flex flex-col items-center justify-center w-full px-4 py-8 sm:px-6 lg:px-8",
        defaultBg
      )}
    >
      <div className='max-w-3xl w-full space-y-8 text-center'>
        <Construction className='w-16 h-16 mx-auto text-yellow-600 dark:text-yellow-300 animate-bounce' />
        <h2 className='text-2xl sm:text-3xl md:text-4xl font-extrabold'>
          {title}
        </h2>
        <p className='text-base sm:text-lg md:text-xl max-w-md mx-auto'>
          {message}
        </p>
      </div>
    </div>
  );
};
