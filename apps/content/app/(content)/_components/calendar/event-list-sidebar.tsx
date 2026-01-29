"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
} from "@ratecreator/ui";
import {
  RefreshCw,
  ExternalLink,
  Lightbulb,
  FileText,
  Mail,
} from "lucide-react";
import type { CalendarEvent } from "@ratecreator/actions/content";

interface EventListSidebarProps {
  selectedDate: Date | null;
  events: CalendarEvent[];
  onRefresh: () => void;
}

function getEventIcon(type: string): JSX.Element {
  switch (type) {
    case "idea":
      return <Lightbulb className="h-4 w-4 text-yellow-500" />;
    case "newsletter":
      return <Mail className="h-4 w-4 text-purple-500" />;
    default:
      return <FileText className="h-4 w-4 text-blue-500" />;
  }
}

function getEventBadgeVariant(
  type: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (type) {
    case "published":
      return "default";
    case "scheduled":
      return "secondary";
    case "newsletter":
      return "outline";
    case "idea":
      return "secondary";
    default:
      return "outline";
  }
}

export function EventListSidebar({
  selectedDate,
  events,
  onRefresh,
}: EventListSidebarProps): JSX.Element {
  const router = useRouter();

  const handleEventClick = (event: CalendarEvent): void => {
    if (event.type === "idea") {
      router.push(`/ideas/${event.id}`);
    } else if (event.postUrl) {
      router.push(`/editor/${event.id}`);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {selectedDate
              ? format(selectedDate, "MMM d, yyyy")
              : "Select a date"}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!selectedDate ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Click on a date to see events
          </p>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No events on this date
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {events.map((event) => (
              <button
                key={event.id}
                className="w-full text-left p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                onClick={() => handleEventClick(event)}
                type="button"
              >
                <div className="flex items-start gap-3">
                  {getEventIcon(event.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {event.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant={getEventBadgeVariant(event.type)}
                        className="text-xs"
                      >
                        {event.type === "idea"
                          ? "Idea"
                          : event.type === "newsletter"
                            ? "Newsletter"
                            : event.type === "scheduled"
                              ? "Scheduled"
                              : "Published"}
                      </Badge>
                      {event.contentPlatform && (
                        <span className="text-xs text-muted-foreground">
                          {event.contentPlatform}
                        </span>
                      )}
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
