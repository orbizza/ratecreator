import { Users } from "lucide-react";
import { YouTubeIcon } from "./platform-icons";

interface DataSourceBadgeProps {
  source: "youtube" | "community";
}

export const DataSourceBadge = ({ source }: DataSourceBadgeProps) => {
  if (source === "youtube") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-medium">
        <YouTubeIcon size={12} />
        Data from YouTube
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-medium">
      <Users className="w-3 h-3" />
      Rate Creator Community
    </span>
  );
};
