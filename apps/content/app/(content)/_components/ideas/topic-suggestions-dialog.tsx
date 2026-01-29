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
  Input,
  Badge,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ratecreator/ui";
import { Loader2, Lightbulb, Plus, Sparkles, Star } from "lucide-react";

interface TopicSuggestion {
  topic: string;
  description: string;
  relevanceScore: number;
  relatedKeywords: string[];
}

interface TopicSuggestionsDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectTopic: (
    topic: string,
    description: string,
    keywords: string[],
  ) => void;
  existingTopics?: string[];
}

const categoryOptions = [
  { value: "all", label: "All Categories" },
  { value: "technology", label: "Technology" },
  { value: "programming", label: "Programming" },
  { value: "web-development", label: "Web Development" },
  { value: "artificial-intelligence", label: "AI & ML" },
  { value: "productivity", label: "Productivity" },
  { value: "career", label: "Career & Growth" },
  { value: "startup", label: "Startups & Business" },
];

export function TopicSuggestionsDialog({
  open,
  onClose,
  onSelectTopic,
  existingTopics = [],
}: TopicSuggestionsDialogProps): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);
  const [category, setCategory] = useState("all");
  const [customInput, setCustomInput] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const fetchSuggestions = (): void => {
    setLoading(true);
    setHasSearched(true);

    fetch("/api/ai/suggest-topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: category === "all" ? customInput || undefined : category,
        existingTopics,
        count: 10,
      }),
    })
      .then((res) => res.json())
      .then((data: { topics?: TopicSuggestion[] }) => {
        setSuggestions(data.topics ?? []);
      })
      .catch(() => {
        setSuggestions([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleSelectTopic = (suggestion: TopicSuggestion): void => {
    onSelectTopic(
      suggestion.topic,
      suggestion.description,
      suggestion.relatedKeywords,
    );
    onClose();
  };

  const handleOpenChange = (openState: boolean): void => {
    if (!openState) {
      onClose();
    }
  };

  const handleCustomInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    setCustomInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter") {
      e.preventDefault();
      fetchSuggestions();
    }
  };

  const renderStars = (score: number): JSX.Element[] => {
    const stars: JSX.Element[] = [];
    const fullStars = Math.floor(score / 2);
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          className={`h-3 w-3 ${i < fullStars ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
          key={i}
        />,
      );
    }
    return stars;
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-[650px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            AI Topic Suggestions
          </DialogTitle>
          <DialogDescription>
            Get AI-powered topic suggestions for your blog posts
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
                  {categoryOptions.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 space-y-2">
            <Label>Custom Focus (optional)</Label>
            <Input
              onChange={handleCustomInputChange}
              onKeyDown={handleKeyDown}
              placeholder="e.g., React hooks, DevOps..."
              value={customInput}
            />
          </div>

          <div className="flex items-end">
            <Button disabled={loading} onClick={fetchSuggestions}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {!hasSearched && (
            <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
              <Sparkles className="h-12 w-12 mb-4 opacity-50" />
              <p>
                Select a category and click &quot;Generate&quot; for AI-powered
                suggestions
              </p>
            </div>
          )}

          {hasSearched && !loading && suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
              <p>No suggestions generated. Try a different category.</p>
            </div>
          ) : null}

          {suggestions.length > 0 ? (
            <div className="space-y-3">
              {suggestions.map((suggestion) => (
                <button
                  className="w-full text-left p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
                  key={suggestion.topic}
                  onClick={() => {
                    handleSelectTopic(suggestion);
                  }}
                  type="button"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium group-hover:text-primary">
                          {suggestion.topic}
                        </h4>
                        <div className="flex items-center gap-0.5">
                          {renderStars(suggestion.relevanceScore)}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {suggestion.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {suggestion.relatedKeywords.map((keyword) => (
                          <Badge
                            className="text-xs"
                            key={keyword}
                            variant="secondary"
                          >
                            {keyword}
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
