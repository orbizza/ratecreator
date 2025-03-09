"use client";

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  User,
  SquareUser,
  SunMoon,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  SlideThemeToggle,
} from "@ratecreator/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ratecreator/ui";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@ratecreator/ui";
import { SignedOut, useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

export function NavUser() {
  const { isMobile } = useSidebar();
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
              size='lg'
              className='bg-white dark:bg-[hsl(var(--sidebar-background))] border-zinc-200 dark:border-[hsl(var(--sidebar-border))] hover:bg-zinc-50 dark:hover:bg-[hsl(var(--sidebar-accent))] data-[state=open]:bg-zinc-50 dark:data-[state=open]:bg-[hsl(var(--sidebar-accent))]'
            >
              <Avatar className='h-8 w-8 rounded-lg border-zinc-200 dark:border-[hsl(var(--sidebar-border))] bg-white dark:bg-[hsl(var(--sidebar-background))]'>
                <AvatarImage
                  src={user.user?.imageUrl}
                  alt={user.user?.fullName || "SD"}
                />
                <AvatarFallback className='rounded-lg bg-zinc-50 dark:bg-[hsl(var(--sidebar-accent))]'>
                  SD
                </AvatarFallback>
              </Avatar>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-semibold text-zinc-900 dark:text-[hsl(var(--sidebar-foreground))]'>
                  {user.user?.fullName}
                </span>
                <span className='truncate text-xs text-zinc-500 dark:text-[hsl(var(--sidebar-foreground))] dark:text-opacity-60'>
                  {user.user?.emailAddresses[0].emailAddress}
                </span>
              </div>
              <ChevronsUpDown className='ml-auto size-4 text-zinc-500 dark:text-[hsl(var(--sidebar-foreground))] dark:text-opacity-60' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg bg-white dark:bg-[hsl(var(--sidebar-background))] border-zinc-200 dark:border-[hsl(var(--sidebar-border))] shadow-lg'
            side={isMobile ? "bottom" : "right"}
            align='end'
            sideOffset={4}
          >
            <DropdownMenuLabel className='p-0 font-normal'>
              <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                <Avatar className='h-8 w-8 rounded-lg border-zinc-200 dark:border-[hsl(var(--sidebar-border))] bg-white dark:bg-[hsl(var(--sidebar-background))]'>
                  <AvatarImage
                    src={user.user?.imageUrl || ""}
                    alt={user.user?.fullName || "SD"}
                  />
                  <AvatarFallback className='rounded-lg bg-zinc-50 dark:bg-[hsl(var(--sidebar-accent))]'>
                    SD
                  </AvatarFallback>
                </Avatar>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-semibold text-zinc-900 dark:text-[hsl(var(--sidebar-foreground))]'>
                    {user.user?.fullName}
                  </span>
                  <span className='truncate text-xs text-zinc-500 dark:text-[hsl(var(--sidebar-foreground))] dark:text-opacity-60'>
                    {user.user?.emailAddresses[0].emailAddress}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className='bg-zinc-100 dark:bg-[hsl(var(--sidebar-border))]' />
            <DropdownMenuGroup>
              {/* <DropdownMenuItem className='text-zinc-700 dark:text-[hsl(var(--sidebar-foreground))] hover:bg-zinc-50 dark:hover:bg-[hsl(var(--sidebar-accent))]'>
                <Sparkles className='mr-2 size-4 text-zinc-600 dark:text-[hsl(var(--sidebar-foreground))]' />
                Upgrade to Pro
              </DropdownMenuItem> */}
              <DropdownMenuItem
                className='text-zinc-700 dark:text-[hsl(var(--sidebar-foreground))] hover:bg-zinc-50 dark:hover:bg-[hsl(var(--sidebar-accent))]'
                onClick={() => {
                  router.push("/user-profile");
                }}
              >
                <User className='mr-2 size-4 text-zinc-600 dark:text-[hsl(var(--sidebar-foreground))]' />
                Profile
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className='bg-zinc-100 dark:bg-[hsl(var(--sidebar-border))]' />
            <DropdownMenuGroup>
              <DropdownMenuItem className='text-zinc-700 dark:text-[hsl(var(--sidebar-foreground))] hover:bg-zinc-50 dark:hover:bg-[hsl(var(--sidebar-accent))]'>
                <Bell className='mr-2 size-4 text-zinc-600 dark:text-[hsl(var(--sidebar-foreground))]' />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuItem className='text-zinc-700 dark:text-[hsl(var(--sidebar-foreground))] hover:bg-zinc-50 dark:hover:bg-[hsl(var(--sidebar-accent))] justify-between'>
                <div className='flex items-center'>
                  <SunMoon className='mr-2 size-4 text-zinc-600 dark:text-[hsl(var(--sidebar-foreground))]' />
                  {isDark ? "Dark Theme" : "Light Theme"}
                </div>
                <SlideThemeToggle />
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className='bg-zinc-100 dark:bg-[hsl(var(--sidebar-border))]' />
            <DropdownMenuItem
              className='text-zinc-700 dark:text-[hsl(var(--sidebar-foreground))] hover:bg-zinc-50 dark:hover:bg-[hsl(var(--sidebar-accent))]'
              onClick={async () => {
                await signOut();
                router.push("/");
              }}
            >
              <LogOut className='mr-2 size-4 text-zinc-600 dark:text-[hsl(var(--sidebar-foreground))]' />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
