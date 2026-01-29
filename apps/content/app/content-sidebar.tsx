"use client";

import "@ratecreator/ui/styles.css";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuAction,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  Separator,
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@ratecreator/ui";
import {
  BarChart3,
  Calendar,
  Check,
  ChevronRight,
  ChevronsUpDown,
  Cog,
  FileText,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Star,
  SunMoon,
  Tag,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { useRecoilState } from "recoil";
import { contentPlatformAtom } from "@ratecreator/store";
import { ContentPlatform } from "@ratecreator/types/content";

const platforms = [
  {
    value: ContentPlatform.RATECREATOR,
    label: "Rate Creator",
    icon: Star,
    description: "ratecreator.com",
  },
  {
    value: ContentPlatform.CREATOROPS,
    label: "Creator Ops",
    icon: Cog,
    description: "creatorops.com",
  },
];

const navMainItems = [
  {
    title: "Ideas",
    url: "/ideas",
    icon: Lightbulb,
    items: [
      { title: "All Ideas", url: "/ideas" },
      { title: "New Ideas", url: "/ideas/new-status" },
      { title: "In Progress", url: "/ideas/in-progress" },
      { title: "Draft Created", url: "/ideas/draft-created" },
      { title: "Archived", url: "/ideas/archived" },
    ],
  },
  {
    title: "Posts",
    url: "/posts",
    icon: FileText,
    items: [
      { title: "All Posts", url: "/posts" },
      { title: "New Post", url: "/new-post" },
      { title: "Drafts", url: "/drafts" },
      { title: "Scheduled", url: "/scheduled-posts" },
      { title: "Published", url: "/published" },
      { title: "Newsletters", url: "/newsletters" },
      { title: "Glossary", url: "/glossary" },
      { title: "Legal", url: "/legal" },
    ],
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: Calendar,
  },
];

const navProjectItems = [
  { name: "Tags", url: "/tags", icon: Tag },
  { name: "Members", url: "/members", icon: Users },
  { name: "Analytics", url: "/analytics", icon: BarChart3 },
];

function ProductSwitcher() {
  const [contentPlatform, setContentPlatform] =
    useRecoilState(contentPlatformAtom);
  const currentPlatform =
    platforms.find((p) => p.value === contentPlatform) || platforms[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <currentPlatform.icon className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">
              {currentPlatform.label}
            </span>
            <span className="truncate text-xs">
              {currentPlatform.description}
            </span>
          </div>
          <ChevronsUpDown className="ml-auto" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Products
        </DropdownMenuLabel>
        {platforms.map((platform) => (
          <DropdownMenuItem
            key={platform.value}
            onClick={() => setContentPlatform(platform.value)}
            className="gap-2 p-2"
          >
            <div className="flex size-6 items-center justify-center rounded-sm border">
              <platform.icon className="size-4 shrink-0" />
            </div>
            <span className="flex-1">{platform.label}</span>
            {contentPlatform === platform.value && (
              <Check className="size-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    items?: { title: string; url: string }[];
  }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Content</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = pathname.startsWith(item.url);
          const hasSubItems = item.items && item.items.length > 0;

          if (!hasSubItems) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.title}
                >
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          return (
            <Collapsible key={item.title} asChild defaultOpen={isActive}>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
                <CollapsibleTrigger asChild>
                  <SidebarMenuAction className="data-[state=open]:rotate-90">
                    <ChevronRight />
                    <span className="sr-only">Toggle</span>
                  </SidebarMenuAction>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={pathname === subItem.url}
                        >
                          <Link href={subItem.url}>
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function NavProjects({
  projects,
}: {
  projects: { name: string; url: string; icon: LucideIcon }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Settings</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild isActive={pathname.startsWith(item.url)}>
              <Link href={item.url}>
                <item.icon />
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function NavUser() {
  const user = useUser();
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { signOut } = useAuth();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={user.user?.imageUrl}
                  alt={user.user?.fullName || "User"}
                />
                <AvatarFallback className="rounded-lg">
                  {user.user?.firstName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {user.user?.fullName}
                </span>
                <span className="truncate text-xs">
                  {user.user?.emailAddresses[0]?.emailAddress}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side="bottom"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={user.user?.imageUrl || ""}
                    alt={user.user?.fullName || "User"}
                  />
                  <AvatarFallback className="rounded-lg">
                    {user.user?.firstName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user.user?.fullName}
                  </span>
                  <span className="truncate text-xs">
                    {user.user?.emailAddresses[0]?.emailAddress}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push("/user-profile")}>
                <User className="mr-2 size-4" />
                Profile
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="justify-between">
                <div className="flex items-center">
                  <SunMoon className="mr-2 size-4" />
                  {isDark ? "Dark Theme" : "Light Theme"}
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await signOut();
                router.push("/");
              }}
            >
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function getPageTitle(pathname: string): string {
  const routes: Record<string, string> = {
    "/": "Dashboard",
    "/ideas": "Ideas",
    "/ideas/new-status": "New Ideas",
    "/ideas/in-progress": "In Progress",
    "/ideas/draft-created": "Draft Created",
    "/ideas/archived": "Archived Ideas",
    "/posts": "Posts",
    "/new-post": "New Post",
    "/drafts": "Drafts",
    "/scheduled-posts": "Scheduled",
    "/published": "Published",
    "/newsletters": "Newsletters",
    "/glossary": "Glossary",
    "/legal": "Legal",
    "/calendar": "Calendar",
    "/tags": "Tags",
    "/members": "Members",
    "/analytics": "Analytics",
  };

  if (routes[pathname]) return routes[pathname];
  if (pathname.startsWith("/ideas/") && pathname.split("/").length === 3) {
    return "Edit Idea";
  }
  if (pathname.startsWith("/editor/")) return "Edit Post";
  if (pathname.startsWith("/tags/")) return "Edit Tag";
  if (pathname.startsWith("/members/")) return "Member Details";
  return "Content";
}

export function ContentSidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const pageTitle = getPageTitle(pathname);

  // Don't show sidebar for sign-in/sign-up routes
  if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) {
    return <>{children}</>;
  }

  // Don't show sidebar if not signed in
  if (!isSignedIn) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <ProductSwitcher />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/"}
                  tooltip="Dashboard"
                >
                  <Link href="/">
                    <LayoutDashboard className="size-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <NavMain items={navMainItems} />
          <NavProjects projects={navProjectItems} />
        </SidebarContent>
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b border-border">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator className="mr-2 h-4" orientation="vertical" />
            <span className="text-sm font-medium">{pageTitle}</span>
          </div>
        </header>
        <div className="flex-1 h-full overflow-y-auto bg-background">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
