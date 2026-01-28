"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Plus, Lightbulb } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useRecoilValue } from "recoil";
import { contentPlatformAtom } from "@ratecreator/store";
import {
  Button,
  Label,
  Separator,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ratecreator/ui";
import {
  fetchIdeas,
  deleteIdea,
  createIdea,
  createAuthor,
  type IdeaType,
  type IdeaStatus,
  type ContentPlatformType,
} from "@ratecreator/actions/content";
import { IdeaCard } from "./idea-card";

const statusOptions = [
  { value: "all", label: "All Ideas" },
  { value: "NEW", label: "New" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DRAFT_CREATED", label: "Draft Created" },
  { value: "ARCHIVED", label: "Archived" },
];

interface IdeasComponentProps {
  defaultFilter?: IdeaStatus | "all";
  pageTitle?: string;
}

export function IdeasComponent({
  defaultFilter = "all",
  pageTitle = "Ideas",
}: IdeasComponentProps): JSX.Element {
  const router = useRouter();
  const [ideas, setIdeas] = useState<IdeaType[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | "all">(
    defaultFilter,
  );
  const contentPlatform = useRecoilValue(contentPlatformAtom);

  useEffect(() => {
    setStatusFilter(defaultFilter);
  }, [defaultFilter]);

  const loadIdeas = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const status = statusFilter === "all" ? undefined : statusFilter;
      const platform = contentPlatform as ContentPlatformType;
      const data = await fetchIdeas(status, platform);
      setIdeas(data);
    } catch {
      setIdeas([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, contentPlatform]);

  useEffect(() => {
    void loadIdeas();
  }, [loadIdeas]);

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await deleteIdea(id);
      toast.success("Idea deleted");
      void loadIdeas();
    } catch {
      toast.error("Failed to delete idea");
    }
  };

  const handleCreateNewIdea = (): void => {
    setCreating(true);
    toast.loading("Creating new idea...", { id: "create-idea" });
    createAuthor()
      .then((author) => {
        if ("error" in author) {
          throw new Error("Failed to get author");
        }
        return createIdea({
          title: "Untitled Idea",
          authorId: author.id,
          contentPlatform: contentPlatform as ContentPlatformType,
        });
      })
      .then((newIdea) => {
        toast.success("Idea created!", { id: "create-idea" });
        router.push(`/ideas/${newIdea.id}`);
      })
      .catch(() => {
        toast.error("Failed to create idea. Please try again.", {
          id: "create-idea",
        });
      })
      .finally(() => {
        setCreating(false);
      });
  };

  const handleStatusFilterChange = (value: string): void => {
    setStatusFilter(value as IdeaStatus | "all");
  };

  const renderContent = (): JSX.Element => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (ideas.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Lightbulb className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground mb-2">No ideas yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Start capturing your content ideas
          </p>
          <Button disabled={creating} onClick={handleCreateNewIdea}>
            {creating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Create your first idea
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ideas.map((idea) => (
          <IdeaCard
            idea={idea}
            key={idea.id}
            onDelete={(id) => {
              void handleDelete(id);
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="p-8">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6">
        <div className="flex items-center gap-3 mb-4 lg:mb-0">
          <Lightbulb className="h-8 w-8 text-yellow-500" />
          <Label className="text-3xl lg:text-4xl font-semibold">
            {pageTitle}
          </Label>
        </div>

        <div className="flex items-center gap-4">
          <Select onValueChange={handleStatusFilterChange} value={statusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Button disabled={creating} onClick={handleCreateNewIdea}>
            {creating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            New Idea
          </Button>
        </div>
      </div>

      <Separator className="bg-border h-[1px] mb-6" />

      {renderContent()}
    </div>
  );
}
