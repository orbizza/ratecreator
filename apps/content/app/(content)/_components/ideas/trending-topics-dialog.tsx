"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Label,
  Badge,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ratecreator/ui";
import {
  Loader2,
  TrendingUp,
  Plus,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

interface TrendingTopic {
  topic: string;
  trendScore: number;
  growth: string;
  category: string;
  searchVolume: string;
  relatedQueries: string[];
}

interface TrendingTopicsDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectTopic: (topic: string, description: string) => void;
}

const categories = [
  { value: "all", label: "All Categories" },
  { value: "technology", label: "Technology" },
  { value: "programming", label: "Programming" },
  { value: "web-development", label: "Web Development" },
  { value: "ai-ml", label: "AI & Machine Learning" },
  { value: "devops", label: "DevOps" },
  { value: "career", label: "Career" },
];

const timeframes = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
];

export function TrendingTopicsDialog({
  open,
  onClose,
  onSelectTopic,
}: TrendingTopicsDialogProps): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [trends, setTrends] = useState<TrendingTopic[]>([]);
  const [category, setCategory] = useState("all");
  const [timeframe, setTimeframe] = useState("week");
  const [hasSearched, setHasSearched] = useState(false);

  const fetchTrends = (): void => {
    setLoading(true);
    setHasSearched(true);

    fetch("/api/ai/trending-topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: category === "all" ? undefined : category,
        timeframe,
      }),
    })
      .then((res) => res.json())
      .then((data: { trends?: TrendingTopic[] }) => {
        setTrends(data.trends ?? []);
      })
      .catch(() => {
        setTrends([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleSelectTopic = (trend: TrendingTopic): void => {
    const description = `Trending topic with ${trend.growth} growth. Related: ${trend.relatedQueries.join(", ")}`;
    onSelectTopic(trend.topic, description);
    onClose();
  };

  const handleOpenChange = (openState: boolean): void => {
    if (!openState) {
      onClose();
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-orange-500";
  };

  const getGrowthColor = (growth: string): string => {
    if (growth.startsWith("+") && parseInt(growth) > 100)
      return "text-green-500";
    if (growth.startsWith("+")) return "text-blue-500";
    return "text-muted-foreground";
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Discover Trending Topics
          </DialogTitle>
          <DialogDescription>
            Find trending topics to inspire your next blog post
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-4 py-4">
          <div className="flex-1 space-y-2">
            <Label>Category</Label>
            <Select onValueChange={setCategory} value={category}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 space-y-2">
            <Label>Timeframe</Label>
            <Select onValueChange={setTimeframe} value={timeframe}>
              <SelectTrigger>
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {timeframes.map((tf) => (
                    <SelectItem key={tf.value} value={tf.value}>
                      {tf.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button disabled={loading} onClick={fetchTrends}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Find Trends
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {!hasSearched && (
            <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
              <TrendingUp className="h-12 w-12 mb-4 opacity-50" />
              <p>
                Select filters and click &quot;Find Trends&quot; to discover
                trending topics
              </p>
            </div>
          )}

          {hasSearched && !loading && trends.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
              <p>No trends found. Try different filters.</p>
            </div>
          ) : null}

          {trends.length > 0 ? (
            <div className="space-y-3">
              {trends.map((trend) => (
                <button
                  className="w-full text-left p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
                  key={trend.topic}
                  onClick={() => {
                    handleSelectTopic(trend);
                  }}
                  type="button"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium group-hover:text-primary">
                          {trend.topic}
                        </h4>
                        <Badge variant="outline">{trend.category}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className={getScoreColor(trend.trendScore)}>
                          Score: {trend.trendScore}
                        </span>
                        <span className={getGrowthColor(trend.growth)}>
                          <ArrowUpRight className="h-3 w-3 inline" />
                          {trend.growth}
                        </span>
                        <span className="text-muted-foreground">
                          Volume: {trend.searchVolume}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {trend.relatedQueries.map((query) => (
                          <Badge
                            className="text-xs"
                            key={query}
                            variant="secondary"
                          >
                            {query}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="h-4 w-4" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
