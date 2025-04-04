"use client";

import * as React from "react";
import {
  BookOpen,
  Boxes,
  ChartColumn,
  Cog,
  Scale,
  Send,
  Settings,
  Star,
  Tag,
} from "lucide-react";

import { NavMain } from "./nav-main";
import { NavProjects } from "./nav-projects";
import { NavSecondary } from "./nav-secondary";
import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@ratecreator/ui";
import { useAuth } from "@clerk/nextjs";
import { RateCreatorLogo } from "@ratecreator/ui/common";

const data = {
  navMain: [
    {
      title: "Rate Creator",
      url: "/ratecreator",
      icon: Star,
      isActive: true,
      items: [
        {
          title: "Blog",
          url: "/ratecreator/blog",
        },
        {
          title: "Glossary",
          url: "/ratecreator/glossary",
        },
        {
          title: "Newsletter",
          url: "/ratecreator/newsletter",
        },
        {
          title: "Legal",
          url: "/ratecreator/legal",
        },
      ],
    },
    {
      title: "Creator Ops",
      url: "/todo/creator-ops",
      icon: Cog,
      items: [
        {
          title: "Blog",
          url: "/todo/creator-blog",
        },
        {
          title: "Glossary",
          url: "/todo/creator-glossary",
        },
        {
          title: "Newsletter",
          url: "/todo/creator-newsletter",
        },
      ],
    },
    {
      title: "Unity",
      url: "/todo/unity",
      icon: Boxes,
      items: [
        {
          title: "Blog",
          url: "/todo/unity-blog",
        },
        {
          title: "Glossary",
          url: "/todo/unity-glossary",
        },
        {
          title: "Newsletter",
          url: "/todo/unity-newsletter",
        },
      ],
    },
    {
      title: "Documentation",
      url: "/todo/documentation",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "/todo/documentation-introduction",
        },
        {
          title: "Get Started",
          url: "/todo/documentation-get-started",
        },
        {
          title: "Tutorials",
          url: "/todo/documentation-tutorials",
        },
        {
          title: "Changelog",
          url: "/todo/documentation-changelog",
        },
      ],
    },
    // {
    //   title: "Legal",
    //   url: "/todo/legal",
    //   icon: Scale,
    //   items: [
    //     {
    //       title: "Terms of Service",
    //       url: "/todo/legal-terms-of-service",
    //     },
    //     {
    //       title: "Privacy Policy",
    //       url: "/todo/legal-privacy-policy",
    //     },
    //     {
    //       title: "Cookie Policy",
    //       url: "/todo/legal-cookie-policy",
    //     },
    //   ],
    // },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: Settings,
    },
    // {
    //   title: "Feedback",
    //   url: "#",
    //   icon: Send,
    // },
  ],
  projects: [
    {
      name: "Tags",
      url: "/tags",
      icon: Tag,
    },
    {
      name: "Analytics",
      url: "/todo/analytics",
      icon: ChartColumn,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isSignedIn } = useAuth();
  return isSignedIn ? (
    <Sidebar variant='inset' {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size='lg' asChild>
              <a href='/'>
                <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
                  <RateCreatorLogo />
                </div>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-semibold'>Orbizza, Inc.</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
        <NavSecondary items={data.navSecondary} className='mt-auto' />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  ) : (
    <></>
  );
}
