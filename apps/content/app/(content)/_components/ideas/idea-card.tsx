"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from "@ratecreator/ui";
import { Trash2, Edit, ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import type { IdeaType } from "@ratecreator/actions/content";

interface IdeaCardProps {
  idea: IdeaType;
  onDelete: (id: string) => void;
}

function getStatusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "NEW":
      return "secondary";
    case "IN_PROGRESS":
      return "default";
    case "DRAFT_CREATED":
      return "outline";
    case "ARCHIVED":
      return "destructive";
    default:
      return "secondary";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "NEW":
      return "New";
    case "IN_PROGRESS":
      return "In Progress";
    case "DRAFT_CREATED":
      return "Draft Created";
    case "ARCHIVED":
      return "Archived";
    default:
      return status;
  }
}

export function IdeaCard({ idea, onDelete }: IdeaCardProps): JSX.Element {
  const router = useRouter();

  const handleNavigateToEditor = (): void => {
    if (idea.createdPostId) {
      router.push(`/editor/${idea.createdPostId}`);
    }
  };

  const handleNavigateToIdea = (): void => {
    router.push(`/ideas/${idea.id}`);
  };

  const handleDelete = (): void => {
    onDelete(idea.id);
  };

  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold line-clamp-2">
            {idea.title}
          </CardTitle>
          <Badge variant={getStatusBadgeVariant(idea.status)}>
            {getStatusLabel(idea.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {idea.description ? (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {idea.description}
          </p>
        ) : null}
        {idea.topics.length > 0 ? (
          <div className="flex flex-wrap gap-1 mb-3">
            {idea.topics.slice(0, 3).map((topic) => (
              <Badge className="text-xs" key={topic} variant="outline">
                {topic}
              </Badge>
            ))}
            {idea.topics.length > 3 ? (
              <Badge className="text-xs" variant="outline">
                +{idea.topics.length - 3}
              </Badge>
            ) : null}
          </div>
        ) : null}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {new Date(idea.createdAt).toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
          <div className="flex items-center gap-2">
            {idea.status === "DRAFT_CREATED" && idea.createdPostId ? (
              <Button
                onClick={handleNavigateToEditor}
                size="sm"
                variant="outline"
              >
                <ArrowRight className="h-3 w-3 mr-1" />
                View Draft
              </Button>
            ) : null}
            {idea.status !== "DRAFT_CREATED" ? (
              <Button
                onClick={handleNavigateToIdea}
                size="sm"
                variant="outline"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Generate
              </Button>
            ) : null}
            <Button onClick={handleNavigateToIdea} size="sm" variant="ghost">
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              className="text-destructive hover:text-destructive"
              onClick={handleDelete}
              size="sm"
              variant="ghost"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
