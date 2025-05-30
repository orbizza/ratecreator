"use client";

import * as React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Separator,
} from "@ratecreator/ui";

import { SidebarTrigger } from "@ratecreator/ui";
import { useAuth, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { fetchPostTitleById } from "@ratecreator/actions/content";

export function SidebarToggle() {
  const { isSignedIn } = useAuth();
  const user = useUser();
  const pathname = usePathname();

  const getBreadcrumbs = () => {
    if (pathname === "/")
      return (
        <h1 className="text-xl md:text-3xl">
          Welcome back,{" "}
          <span className=" font-bold">{user?.user?.firstName}</span>
        </h1>
      );

    if (pathname.startsWith("/editor/")) {
      const postId = pathname.split("/").pop() || "";
      return (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/editor">Editor</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbPage>
                <PostTitle postId={postId} />
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
    }

    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return null;

    return (
      <Breadcrumb>
        <BreadcrumbList>
          {segments.map((segment, index) => {
            const isLast = index === segments.length - 1;
            const path = `/${segments.slice(0, index + 1).join("/")}`;
            const formattedSegment = segment
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");

            return (
              <React.Fragment key={path}>
                <BreadcrumbItem className="hidden md:block">
                  {isLast ? (
                    <BreadcrumbPage>{formattedSegment}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={path}>
                      {formattedSegment}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    );
  };

  return isSignedIn ? (
    <header className="flex h-16 shrink-0 items-center gap-2">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4 bg-border/60" />
        {getBreadcrumbs()}
      </div>
    </header>
  ) : (
    <></>
  );
}

function PostTitle({ postId }: { postId: string }) {
  const [title, setTitle] = React.useState<string>("Loading...");

  React.useEffect(() => {
    const fetchTitle = async () => {
      const postTitle = await fetchPostTitleById(postId);
      setTitle(postTitle || "Untitled Post");
    };
    fetchTitle();
  }, [postId]);

  return <>{title}</>;
}
