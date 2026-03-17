"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Input,
  Textarea,
} from "@ratecreator/ui";
import {
  getSubscriberById,
  updateSubscriber,
  toggleSubscription,
  updateSubscriberSegments,
  deleteSubscriber,
  getSubscriberTimeline,
} from "@ratecreator/actions/content";
import {
  ArrowLeft,
  Save,
  Trash2,
  Mail,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Send,
} from "lucide-react";

type SubscriberStatus = "PENDING" | "ACTIVE" | "UNSUBSCRIBED";

const SEGMENTS = [
  { id: "all-users", label: "All Users" },
  { id: "security", label: "Security" },
  { id: "creator", label: "Creator" },
] as const;

interface TimelineEntry {
  id: string;
  to: string;
  subject: string;
  template: string;
  status: string;
  resendId: string | null;
  error: string | null;
  metadata: any;
  createdAt: Date;
}

export default function SubscriberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const subscriberId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subscriber, setSubscriber] = useState<any>(null);
  const [emailActivity, setEmailActivity] = useState({
    sent: 0,
    failed: 0,
    bounced: 0,
  });
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [timelinePage, setTimelinePage] = useState(1);
  const [timelineTotalPages, setTimelineTotalPages] = useState(0);

  // Editable fields
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [location, setLocation] = useState("");
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);

  const fetchSubscriber = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getSubscriberById(subscriberId);
      if (result.success && result.subscriber) {
        setSubscriber(result.subscriber);
        setName(result.subscriber.name || "");
        setNote(result.subscriber.note || "");
        setLocation(result.subscriber.location || "");
        setSelectedSegments(result.subscriber.segments || []);
        setEmailActivity(
          result.emailActivity || { sent: 0, failed: 0, bounced: 0 },
        );
      }
    } catch (error) {
      console.error("Error fetching subscriber:", error);
    } finally {
      setLoading(false);
    }
  }, [subscriberId]);

  const fetchTimeline = useCallback(async () => {
    try {
      const result = await getSubscriberTimeline(subscriberId, {
        page: timelinePage,
        pageSize: 20,
      });
      if (result.success) {
        setTimeline(result.timeline as TimelineEntry[]);
        setTimelineTotalPages(result.totalPages || 0);
      }
    } catch (error) {
      console.error("Error fetching timeline:", error);
    }
  }, [subscriberId, timelinePage]);

  useEffect(() => {
    fetchSubscriber();
  }, [fetchSubscriber]);

  useEffect(() => {
    if (subscriber) {
      fetchTimeline();
    }
  }, [subscriber, fetchTimeline]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSubscriber(subscriberId, { name, note, location });

      // Update segments if changed
      const currentSegments = subscriber?.segments || [];
      const segmentsChanged =
        JSON.stringify([...selectedSegments].sort()) !==
        JSON.stringify([...currentSegments].sort());

      if (segmentsChanged) {
        await updateSubscriberSegments(subscriberId, selectedSegments);
      }

      await fetchSubscriber();
    } catch (error) {
      console.error("Error saving subscriber:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      await toggleSubscription(subscriberId);
      await fetchSubscriber();
    } catch (error) {
      console.error("Error toggling subscription:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Permanently delete this subscriber?")) return;
    try {
      const result = await deleteSubscriber(subscriberId);
      if (result.success) {
        router.push("/subscribers");
      }
    } catch (error) {
      console.error("Error deleting subscriber:", error);
    }
  };

  const toggleSegment = (segmentId: string) => {
    setSelectedSegments((prev) => {
      if (prev.includes(segmentId)) {
        return prev.filter((s) => s !== segmentId);
      }
      return [...prev, segmentId];
    });
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

  const timelineStatusIcon = (status: string) => {
    switch (status) {
      case "SENT":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "FAILED":
        return <XCircle className="h-4 w-4 text-red-400" />;
      case "BOUNCED":
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center text-muted-foreground py-12">
          Loading...
        </div>
      </div>
    );
  }

  if (!subscriber) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center text-muted-foreground py-12">
          Subscriber not found
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/subscribers")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-xl font-bold">{subscriber.email}</h1>
          <span
            className={`text-xs px-2 py-1 rounded-full border ${statusColor(subscriber.status)}`}
          >
            {subscriber.status}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleToggleStatus}>
            {subscriber.status === "ACTIVE" ? "Unsubscribe" : "Reactivate"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="text-red-400 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subscriber Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subscriber Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Email
              </label>
              <p className="text-sm font-medium">{subscriber.email}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Subscriber name"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Location
              </label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Note
              </label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Internal notes about this subscriber..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Segments & Activity */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Segments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {SEGMENTS.map((seg) => (
                  <Badge
                    key={seg.id}
                    className={`cursor-pointer text-sm py-1.5 px-3 rounded-md ${
                      selectedSegments.includes(seg.id)
                        ? "bg-green-500"
                        : "bg-gray-700"
                    }`}
                    onClick={() => toggleSegment(seg.id)}
                  >
                    {seg.label}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Click to toggle segments. Save to apply changes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Email Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {emailActivity.sent}
                  </div>
                  <p className="text-xs text-muted-foreground">Sent</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {emailActivity.failed}
                  </div>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {emailActivity.bounced}
                  </div>
                  <p className="text-xs text-muted-foreground">Bounced</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source</span>
                <span>{subscriber.source || "\u2014"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subscribed</span>
                <span>
                  {subscriber.subscribedAt
                    ? new Date(subscriber.subscribedAt).toLocaleDateString()
                    : "\u2014"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>
                  {new Date(subscriber.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>
                  {new Date(subscriber.updatedAt).toLocaleDateString()}
                </span>
              </div>
              {subscriber.unsubscribedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unsubscribed</span>
                  <span>
                    {new Date(subscriber.unsubscribedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="h-4 w-4" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No email activity yet
            </p>
          ) : (
            <div className="space-y-3">
              {timeline.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 p-3 rounded-md bg-accent/30"
                >
                  {timelineStatusIcon(entry.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {entry.subject}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {entry.template}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        &middot;
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {entry.error && (
                      <p className="text-xs text-red-400 mt-1">{entry.error}</p>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      entry.status === "SENT"
                        ? "bg-green-500/20 text-green-400"
                        : entry.status === "FAILED"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {entry.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {timelineTotalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTimelinePage((p) => Math.max(1, p - 1))}
                disabled={timelinePage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground self-center">
                Page {timelinePage} of {timelineTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setTimelinePage((p) => Math.min(timelineTotalPages, p + 1))
                }
                disabled={timelinePage === timelineTotalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
