"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  Users,
  Shield,
  PenTool,
  User,
  Sparkles,
  Search,
  ListFilter,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useRecoilValue } from "recoil";
import { contentPlatformAtom } from "@ratecreator/store";
import {
  Label,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Checkbox,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@ratecreator/ui";
import {
  fetchMembers,
  fetchMemberStats,
  updateMemberRoles,
  countMembers,
  type MemberInfo,
  type MemberFilters,
} from "@ratecreator/actions/content";
import {
  MemberFilterComponent,
  type Filter,
  convertFiltersToQuery,
  createInitialFilter,
} from "../_components/members/member-filter-component";

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  WRITER: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  USER: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  CREATOR:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  BRAND: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

// CreatorOps: ADMIN, WRITER, CREATOR
// Web (RateCreator): ALL roles
const CREATOROPS_ROLES = ["ADMIN", "WRITER", "CREATOR"] as const;
const ALL_ROLES = ["ADMIN", "WRITER", "USER", "CREATOR", "BRAND"] as const;

function getInitials(
  firstName: string | null,
  lastName: string | null,
  email: string,
): string {
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  if (firstName) {
    return firstName.charAt(0).toUpperCase();
  }
  return email.charAt(0).toUpperCase();
}

function getTimeSince(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days < 1) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;

  const months = Math.floor(days / 30);
  if (months === 1) return "1 month ago";
  if (months < 12) return `${months} months ago`;

  const years = Math.floor(months / 12);
  if (years === 1) return "1 year ago";
  return `${years} years ago`;
}

export default function MembersPage(): JSX.Element {
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [stats, setStats] = useState({
    totalMembers: 0,
    admins: 0,
    writers: 0,
    creators: 0,
    brands: 0,
    users: 0,
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [pendingRoles, setPendingRoles] = useState<Record<string, string[]>>(
    {},
  );
  const contentPlatform = useRecoilValue(contentPlatformAtom);

  // Search and filter state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Filter[]>([createInitialFilter()]);
  const [appliedFilters, setAppliedFilters] = useState<
    MemberFilters | undefined
  >(undefined);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Get available roles based on platform
  const availableRoles =
    contentPlatform === "CREATOROPS" ? CREATOROPS_ROLES : ALL_ROLES;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [debouncedSearch, appliedFilters]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const queryFilters: MemberFilters = {
        ...appliedFilters,
        pageNumber: currentPage,
        pageSize,
      };

      if (debouncedSearch.trim()) {
        queryFilters.search = debouncedSearch.trim();
      }

      const [membersData, statsData, count] = await Promise.all([
        fetchMembers(queryFilters, contentPlatform ?? undefined),
        fetchMemberStats(),
        countMembers(queryFilters, contentPlatform ?? undefined),
      ]);
      setMembers(membersData ?? []);
      setStats(statsData);
      setTotalCount(count);
    } catch (error) {
      console.error("Error loading members:", error);
      toast.error("Failed to load members");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, appliedFilters, currentPage, contentPlatform]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleApplyFilters = (): void => {
    const queryFilters = convertFiltersToQuery(filters);
    const activeCount = filters.filter((f) => f.value).length;
    setActiveFilterCount(activeCount);
    setAppliedFilters(
      Object.keys(queryFilters).length > 0 ? queryFilters : undefined,
    );
    setIsFilterOpen(false);
  };

  const handleResetFilters = (): void => {
    setFilters([createInitialFilter()]);
    setAppliedFilters(undefined);
    setActiveFilterCount(0);
  };

  // Get the current roles for a member (pending changes or actual)
  const getMemberRoles = (member: MemberInfo): string[] => {
    return pendingRoles[member.id] ?? member.role;
  };

  // Toggle a role in the pending state
  const handleRoleChange = (
    memberId: string,
    role: string,
    checked: boolean,
  ) => {
    setPendingRoles((prev) => {
      const currentRoles =
        prev[memberId] ?? members.find((m) => m.id === memberId)?.role ?? [];
      let newRoles: string[];

      if (checked) {
        newRoles = [...currentRoles, role];
      } else {
        newRoles = currentRoles.filter((r) => r !== role);
        if (newRoles.length === 0) {
          newRoles = contentPlatform === "CREATOROPS" ? ["CREATOR"] : ["USER"];
        }
      }

      return { ...prev, [memberId]: newRoles };
    });
  };

  // Save pending role changes
  const handleSaveRoles = async (memberId: string) => {
    const newRoles = pendingRoles[memberId];
    if (!newRoles) return;

    setUpdating(memberId);
    try {
      const result = await updateMemberRoles(
        memberId,
        newRoles as ("USER" | "ADMIN" | "WRITER" | "CREATOR" | "BRAND")[],
      );

      if (result.success) {
        toast.success("Roles updated successfully");
        setPendingRoles((prev) => {
          const updated = { ...prev };
          delete updated[memberId];
          return updated;
        });
        void loadData();
      } else {
        toast.error(result.error || "Failed to update roles");
      }
    } catch {
      toast.error("Failed to update roles");
    } finally {
      setUpdating(null);
    }
  };

  // Cancel pending changes
  const handleCancelChanges = (memberId: string) => {
    setPendingRoles((prev) => {
      const updated = { ...prev };
      delete updated[memberId];
      return updated;
    });
  };

  // Check if member has pending changes
  const hasPendingChanges = (memberId: string): boolean => {
    return memberId in pendingRoles;
  };

  return (
    <div className="p-8">
      {/* Header with search and filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div className="flex items-center gap-3 mb-4 lg:mb-0">
          <Users className="h-8 w-8 text-orange-500" />
          <Label className="text-3xl lg:text-4xl font-semibold">Members</Label>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="flex items-center bg-background border border-input rounded-md focus-within:border-primary transition-colors">
            <Search className="text-muted-foreground ml-3 h-4 w-4" />
            <input
              className="flex h-10 w-full sm:w-[250px] rounded-md bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members..."
              type="text"
              value={search}
            />
          </div>

          {/* Filter Button */}
          <Popover onOpenChange={setIsFilterOpen} open={isFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative">
                <ListFilter className="mr-2 h-4 w-4" />
                Filter
                {activeFilterCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center shadow-sm">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[600px]" align="end">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Filter Members</h4>
                  <p className="text-sm text-muted-foreground">
                    Add filters to narrow down your member list
                  </p>
                </div>
                <MemberFilterComponent
                  filters={filters}
                  onApply={handleApplyFilters}
                  onFiltersChange={setFilters}
                  onReset={handleResetFilters}
                />
              </div>
            </PopoverContent>
          </Popover>

          {/* Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => toast.info("Export coming soon")}
              >
                Export all members
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Members Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Users className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground mb-2">No members found</p>
          <p className="text-sm text-muted-foreground">
            {activeFilterCount > 0 || debouncedSearch
              ? "Try adjusting your filters or search"
              : "Members will appear here once users sign up"}
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-medium">
                  {totalCount} MEMBERS
                </TableHead>
                <TableHead className="text-xs font-medium">ROLES</TableHead>
                <TableHead className="text-xs font-medium">CREATED</TableHead>
                <TableHead className="text-xs font-medium text-right">
                  ACTIONS
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.imageUrl || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(
                            member.firstName,
                            member.lastName,
                            member.email,
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {member.firstName && member.lastName
                            ? `${member.firstName} ${member.lastName}`
                            : member.username || member.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {getMemberRoles(member).map((role) => (
                        <Badge
                          key={role}
                          className={roleColors[role] || ""}
                          variant="secondary"
                        >
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">
                        {format(new Date(member.createdAt), "dd MMM yyyy")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ({getTimeSince(member.createdAt)})
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={updating === member.id}
                        >
                          {updating === member.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Edit Roles"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-56">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">
                              Manage Roles
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {contentPlatform === "CREATOROPS"
                                ? "CreatorOps roles"
                                : "All available roles"}
                            </p>
                          </div>
                          <Separator />
                          <div className="space-y-3">
                            {availableRoles.map((role) => {
                              const currentRoles = getMemberRoles(member);
                              const isChecked = currentRoles.includes(role);
                              // Only disable ADMIN checkbox for protected admin emails (hi@deepshaswat.com, deepshaswat@gmail.com)
                              const isDisabled =
                                member.isProtectedAdmin && role === "ADMIN";

                              return (
                                <div
                                  key={role}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`${member.id}-${role}`}
                                    checked={isChecked}
                                    disabled={isDisabled}
                                    onCheckedChange={(checked) =>
                                      handleRoleChange(
                                        member.id,
                                        role,
                                        checked as boolean,
                                      )
                                    }
                                  />
                                  <label
                                    htmlFor={`${member.id}-${role}`}
                                    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 ${
                                      isDisabled ? "opacity-50" : ""
                                    }`}
                                  >
                                    {role === "ADMIN" && (
                                      <Shield className="h-3 w-3 text-red-500" />
                                    )}
                                    {role === "WRITER" && (
                                      <PenTool className="h-3 w-3 text-blue-500" />
                                    )}
                                    {role === "USER" && (
                                      <User className="h-3 w-3 text-gray-500" />
                                    )}
                                    {role === "CREATOR" && (
                                      <Sparkles className="h-3 w-3 text-purple-500" />
                                    )}
                                    {role === "BRAND" && (
                                      <Users className="h-3 w-3 text-green-500" />
                                    )}
                                    {role}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                          {hasPendingChanges(member.id) && (
                            <>
                              <Separator />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => handleCancelChanges(member.id)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => handleSaveRoles(member.id)}
                                  disabled={updating === member.id}
                                >
                                  {updating === member.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    "Save"
                                  )}
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {currentPage * pageSize + 1} to{" "}
                {Math.min((currentPage + 1) * pageSize, totalCount)} of{" "}
                {totalCount} members
              </p>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 0) setCurrentPage(currentPage - 1);
                      }}
                      className={
                        currentPage === 0
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  {/* First page */}
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(0);
                        }}
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>
                  )}

                  {/* Ellipsis before current */}
                  {currentPage > 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}

                  {/* Previous page */}
                  {currentPage > 0 && (
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(currentPage - 1);
                        }}
                      >
                        {currentPage}
                      </PaginationLink>
                    </PaginationItem>
                  )}

                  {/* Current page */}
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      isActive
                      className="bg-primary text-primary-foreground"
                    >
                      {currentPage + 1}
                    </PaginationLink>
                  </PaginationItem>

                  {/* Next page */}
                  {currentPage < totalPages - 1 && (
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(currentPage + 1);
                        }}
                      >
                        {currentPage + 2}
                      </PaginationLink>
                    </PaginationItem>
                  )}

                  {/* Ellipsis after current */}
                  {currentPage < totalPages - 3 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}

                  {/* Last page */}
                  {currentPage < totalPages - 2 && (
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(totalPages - 1);
                        }}
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages - 1)
                          setCurrentPage(currentPage + 1);
                      }}
                      className={
                        currentPage >= totalPages - 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
