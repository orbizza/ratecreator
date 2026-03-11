"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@ratecreator/ui";
import {
  getSubscriberStats,
  listSubscribers,
  unsubscribeSubscriber,
  updateSubscriberStatus,
  addSubscriberManually,
  deleteSubscriber,
  exportSubscribersCSV,
  syncSubscribersFromResend,
} from "@ratecreator/actions/content";
import {
  Users,
  UserCheck,
  Clock,
  UserX,
  Download,
  Search,
  Plus,
  Trash2,
  RefreshCw,
  MoreHorizontal,
  CloudDownload,
  Tag,
} from "lucide-react";

type SubscriberStatus = "PENDING" | "ACTIVE" | "UNSUBSCRIBED";

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  status: SubscriberStatus;
  source: string | null;
  segments: string[];
  subscribedAt: Date | null;
  createdAt: Date;
}

export default function SubscribersPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    unsubscribed: 0,
    segmentCounts: {} as Record<string, number>,
  });
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<
    SubscriberStatus | undefined
  >(undefined);
  const [segmentFilter, setSegmentFilter] = useState<string | undefined>(
    undefined,
  );
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Add subscriber dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addName, setAddName] = useState("");
  const [addError, setAddError] = useState("");

  // Actions dropdown
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsResult, listResult] = await Promise.all([
        getSubscriberStats(),
        listSubscribers({
          status: statusFilter,
          segment: segmentFilter,
          search: search || undefined,
          page,
          pageSize: 50,
        }),
      ]);
      setStats(statsResult);
      setSubscribers(listResult.subscribers as Subscriber[]);
      setTotal(listResult.total);
      setTotalPages(listResult.totalPages);
    } catch (error) {
      console.error("Error fetching subscriber data:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, segmentFilter, search, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh on window focus
  useEffect(() => {
    const handleFocus = () => fetchData();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchData]);

  const handleStatusChange = async (
    id: string,
    newStatus: SubscriberStatus,
  ) => {
    const result = await updateSubscriberStatus(id, newStatus);
    if (result.success) {
      fetchData();
    }
    setOpenActionId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this subscriber?")) return;
    const result = await deleteSubscriber(id);
    if (result.success) {
      fetchData();
    }
    setOpenActionId(null);
  };

  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    if (!addEmail) return;

    const result = await addSubscriberManually(addEmail, addName || undefined);
    if (result.success) {
      setShowAddDialog(false);
      setAddEmail("");
      setAddName("");
      fetchData();
    } else {
      setAddError(result.error || "Failed to add subscriber");
    }
  };

  const handleExport = async () => {
    const csv = await exportSubscribersCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncSubscribersFromResend();
      if (result.success) {
        fetchData();
      }
    } catch (error) {
      console.error("Error syncing from Resend:", error);
    } finally {
      setSyncing(false);
    }
  };

  const statusColor = (status: SubscriberStatus) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "PENDING":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "UNSUBSCRIBED":
        return "bg-red-500/20 text-red-400 border-red-500/30";
    }
  };

  const segmentColor = (segment: string) => {
    switch (segment) {
      case "all-users":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "security":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "creator":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Newsletter Subscribers</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            className="gap-2"
          >
            <CloudDownload className="h-4 w-4" />
            {syncing ? "Syncing..." : "Sync from Resend"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddDialog(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Subscriber
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {stats.active}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {stats.pending}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unsubscribed</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {stats.unsubscribed}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segment Stats */}
      {Object.keys(stats.segmentCounts).length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(stats.segmentCounts).map(([segment, count]) => (
            <Card key={segment}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium capitalize">
                  {segment.replace("-", " ")}
                </CardTitle>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-xs text-muted-foreground">
                  active in segment
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge
            className={`cursor-pointer px-3 py-1.5 ${!statusFilter ? "bg-green-500" : "bg-gray-700"}`}
            onClick={() => {
              setStatusFilter(undefined);
              setPage(1);
            }}
          >
            All
          </Badge>
          {(["ACTIVE", "PENDING", "UNSUBSCRIBED"] as SubscriberStatus[]).map(
            (status) => (
              <Badge
                key={status}
                className={`cursor-pointer px-3 py-1.5 ${statusFilter === status ? "bg-green-500" : "bg-gray-700"}`}
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
              >
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </Badge>
            ),
          )}
        </div>
        <div className="flex gap-2">
          <Badge
            className={`cursor-pointer px-3 py-1.5 ${!segmentFilter ? "bg-blue-500" : "bg-gray-700"}`}
            onClick={() => {
              setSegmentFilter(undefined);
              setPage(1);
            }}
          >
            All Segments
          </Badge>
          {["all-users", "security", "creator"].map((seg) => (
            <Badge
              key={seg}
              className={`cursor-pointer px-3 py-1.5 ${segmentFilter === seg ? "bg-blue-500" : "bg-gray-700"}`}
              onClick={() => {
                setSegmentFilter(seg);
                setPage(1);
              }}
            >
              {seg.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </Badge>
          ))}
        </div>
      </div>

      {/* Subscribers Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading...
            </div>
          ) : subscribers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p className="mb-2">No subscribers found</p>
              <p className="text-sm">
                Use the &quot;Add Subscriber&quot; button to manually add
                subscribers, or share your newsletter signup page.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Email
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Segments
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Source
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((sub) => (
                    <tr
                      key={sub.id}
                      className="border-b border-border last:border-0 hover:bg-accent/50 cursor-pointer"
                      onClick={() => router.push(`/subscribers/${sub.id}`)}
                    >
                      <td className="p-4 text-sm">{sub.email}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {sub.name || "\u2014"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-xs px-2 py-1 rounded-full border ${statusColor(sub.status)}`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1 flex-wrap">
                          {(sub.segments || []).map((seg) => (
                            <span
                              key={seg}
                              className={`text-xs px-2 py-0.5 rounded-full border ${segmentColor(seg)}`}
                            >
                              {seg}
                            </span>
                          ))}
                          {(!sub.segments || sub.segments.length === 0) && (
                            <span className="text-xs text-muted-foreground">
                              \u2014
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {sub.source || "\u2014"}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(
                          sub.subscribedAt || sub.createdAt,
                        ).toLocaleDateString()}
                      </td>
                      <td
                        className="p-4 text-right relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setOpenActionId(
                              openActionId === sub.id ? null : sub.id,
                            )
                          }
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        {openActionId === sub.id && (
                          <div className="absolute right-4 top-12 z-10 bg-popover border border-border rounded-md shadow-lg py-1 min-w-[160px]">
                            {sub.status !== "ACTIVE" && (
                              <button
                                className="w-full text-left px-4 py-2 text-sm hover:bg-accent text-green-400"
                                onClick={() =>
                                  handleStatusChange(sub.id, "ACTIVE")
                                }
                              >
                                Set Active
                              </button>
                            )}
                            {sub.status !== "UNSUBSCRIBED" && (
                              <button
                                className="w-full text-left px-4 py-2 text-sm hover:bg-accent text-yellow-400"
                                onClick={() =>
                                  handleStatusChange(sub.id, "UNSUBSCRIBED")
                                }
                              >
                                Unsubscribe
                              </button>
                            )}
                            {sub.status !== "PENDING" && (
                              <button
                                className="w-full text-left px-4 py-2 text-sm hover:bg-accent text-muted-foreground"
                                onClick={() =>
                                  handleStatusChange(sub.id, "PENDING")
                                }
                              >
                                Set Pending
                              </button>
                            )}
                            <button
                              className="w-full text-left px-4 py-2 text-sm hover:bg-accent text-red-400"
                              onClick={() => handleDelete(sub.id)}
                            >
                              <span className="flex items-center gap-2">
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * 50 + 1}&ndash;{Math.min(page * 50, total)} of{" "}
            {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add Subscriber Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Subscriber</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubscriber} className="space-y-4 mt-2">
            <div>
              <Input
                type="email"
                placeholder="Email address"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="text"
                placeholder="Name (optional)"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
              />
            </div>
            {addError && <p className="text-sm text-red-400">{addError}</p>}
            <p className="text-xs text-muted-foreground">
              Subscriber will be added as Active (skipping email verification)
              and synced to Resend audience.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAddDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-green-500 hover:bg-green-600">
                Add Subscriber
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
