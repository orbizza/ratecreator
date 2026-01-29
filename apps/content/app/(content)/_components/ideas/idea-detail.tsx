"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  Label,
  Textarea,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Calendar,
} from "@ratecreator/ui";
import { format } from "date-fns";
import {
  Loader2,
  Plus,
  X,
  Trash2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Lightbulb,
  FileText,
  Image as ImageIcon,
  ChevronDown,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  fetchIdeaById,
  updateIdea,
  deleteIdea,
  type IdeaType,
  type IdeaStatus,
} from "@ratecreator/actions/content";
import { AIGenerateDialog } from "./ai-generate-dialog";
import { OutlineEditor } from "./outline-editor";
import { TrendingTopicsDialog } from "./trending-topics-dialog";
import { TopicSuggestionsDialog } from "./topic-suggestions-dialog";
import { ScriptGenerationDialog } from "./script-generation-dialog";
import { ImageGenerationDialog } from "./image-generation-dialog";

interface IdeaDetailProps {
  ideaId: string;
  authorId: string;
}

const statusOptions = [
  { value: "NEW", label: "New" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "ARCHIVED", label: "Archived" },
];

export function IdeaDetail({ ideaId, authorId }: IdeaDetailProps): JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [idea, setIdea] = useState<IdeaType | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [status, setStatus] = useState<IdeaStatus>("NEW");
  const [outline, setOutline] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [showOutlineEditor, setShowOutlineEditor] = useState(false);
  const [showTrendingDialog, setShowTrendingDialog] = useState(false);
  const [showTopicSuggestionsDialog, setShowTopicSuggestionsDialog] =
    useState(false);
  const [showScriptDialog, setShowScriptDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);

  const loadIdea = useCallback(async (): Promise<void> => {
    try {
      const data = await fetchIdeaById(ideaId);
      if (data) {
        setIdea(data);
        setTitle(data.title);
        setDescription(data.description || "");
        setTopics(data.topics);
        setStatus(data.status);
        setOutline(data.generatedOutline || "");
        setTargetDate(data.targetDate ? new Date(data.targetDate) : null);
      }
    } catch {
      // Failed to fetch idea
    } finally {
      setLoading(false);
    }
  }, [ideaId]);

  useEffect(() => {
    void loadIdea();
  }, [loadIdea]);

  const addTopic = (): void => {
    if (newTopic.trim() && !topics.includes(newTopic.trim())) {
      setTopics([...topics, newTopic.trim()]);
      setNewTopic("");
    }
  };

  const removeTopic = (topic: string): void => {
    setTopics(topics.filter((t) => t !== topic));
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTopic();
    }
  };

  const handleSave = (): void => {
    setSaving(true);
    updateIdea(ideaId, {
      title,
      description,
      topics,
      status,
      generatedOutline: outline,
      targetDate,
    })
      .then(() => {
        void loadIdea();
      })
      .catch(() => {
        // Failed to update idea
      })
      .finally(() => {
        setSaving(false);
      });
  };

  const handleTargetDateSelect = (date: Date | undefined): void => {
    setTargetDate(date || null);
  };

  const handleClearTargetDate = (): void => {
    setTargetDate(null);
  };

  const handleDelete = (): void => {
    deleteIdea(ideaId)
      .then(() => {
        router.push("/ideas");
      })
      .catch(() => {
        // Failed to delete idea
      });
  };

  const handleOutlineGenerated = (generatedOutline: string): void => {
    setOutline(generatedOutline);
    setShowOutlineEditor(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setTitle(e.target.value);
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ): void => {
    setDescription(e.target.value);
  };

  const handleNewTopicChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    setNewTopic(e.target.value);
  };

  const handleStatusChange = (value: string): void => {
    setStatus(value as IdeaStatus);
  };

  const handleShowAIDialog = (): void => {
    setShowAIDialog(true);
  };

  const handleCloseAIDialog = (): void => {
    setShowAIDialog(false);
  };

  const handleShowTrendingDialog = (): void => {
    setShowTrendingDialog(true);
  };

  const handleCloseTrendingDialog = (): void => {
    setShowTrendingDialog(false);
  };

  const handleSelectTrendingTopic = (
    topic: string,
    topicDescription: string,
  ): void => {
    setTitle(topic);
    setDescription(topicDescription);
  };

  const handleShowTopicSuggestionsDialog = (): void => {
    setShowTopicSuggestionsDialog(true);
  };

  const handleCloseTopicSuggestionsDialog = (): void => {
    setShowTopicSuggestionsDialog(false);
  };

  const handleSelectSuggestedTopic = (
    topic: string,
    topicDescription: string,
    keywords: string[],
  ): void => {
    setTitle(topic);
    setDescription(topicDescription);
    setTopics((prev) => Array.from(new Set([...prev, ...keywords])));
  };

  const handleShowScriptDialog = (): void => {
    setShowScriptDialog(true);
  };

  const handleCloseScriptDialog = (): void => {
    setShowScriptDialog(false);
  };

  const handleScriptGenerated = (script: string): void => {
    setOutline(script);
    setShowOutlineEditor(true);
  };

  const handleShowImageDialog = (): void => {
    setShowImageDialog(true);
  };

  const handleCloseImageDialog = (): void => {
    setShowImageDialog(false);
  };

  const handleNavigateToIdeas = (): void => {
    router.push("/ideas");
  };

  const handleNavigateToEditor = (): void => {
    if (idea?.createdPostId) {
      router.push(`/editor/${idea.createdPostId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Idea not found</p>
      </div>
    );
  }

  if (idea.status === "DRAFT_CREATED" && idea.createdPostId) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Draft Already Created</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This idea has already been converted to a draft post.
            </p>
            <div className="flex gap-4">
              <Button onClick={handleNavigateToEditor}>
                <ArrowRight className="h-4 w-4 mr-2" />
                View Draft
              </Button>
              <Button onClick={handleNavigateToIdeas} variant="outline">
                Back to Ideas
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Edit Idea</CardTitle>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Tools
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={handleShowTrendingDialog}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Discover Trending Topics
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShowTopicSuggestionsDialog}>
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Get Topic Suggestions
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleShowAIDialog}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Outline
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShowScriptDialog}>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Full Script
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleShowImageDialog}>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Generate Blog Image
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" onChange={handleTitleChange} value={title} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select onValueChange={handleStatusChange} value={status}>
                <SelectTrigger>
                  <SelectValue />
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
            </div>
          </div>

          <div className="space-y-2">
            <Label>Target Date</Label>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    className="w-full md:w-[280px] justify-start text-left font-normal"
                    variant="outline"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {targetDate ? format(targetDate, "PPP") : "Set target date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    mode="single"
                    onSelect={handleTargetDateSelect}
                    selected={targetDate || undefined}
                  />
                </PopoverContent>
              </Popover>
              {targetDate ? (
                <Button
                  onClick={handleClearTargetDate}
                  size="icon"
                  variant="ghost"
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              Set a target date to see this idea on the calendar
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              onChange={handleDescriptionChange}
              rows={3}
              value={description}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="topics">Topics</Label>
            <div className="flex gap-2">
              <Input
                id="topics"
                onChange={handleNewTopicChange}
                onKeyDown={handleKeyDown}
                placeholder="Add a topic..."
                value={newTopic}
              />
              <Button onClick={addTopic} type="button" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {topics.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-2">
                {topics.map((topic) => (
                  <Badge className="gap-1" key={topic} variant="secondary">
                    {topic}
                    <button
                      className="ml-1 hover:text-destructive"
                      onClick={() => {
                        removeTopic(topic);
                      }}
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex gap-4 justify-end">
            <Button onClick={handleNavigateToIdeas} variant="outline">
              Cancel
            </Button>
            <Button disabled={saving} onClick={handleSave}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {showOutlineEditor && outline ? (
        <OutlineEditor
          authorId={authorId}
          ideaId={ideaId}
          onOutlineChange={setOutline}
          onSave={handleSave}
          outline={outline}
        />
      ) : null}

      <AIGenerateDialog
        ideaDescription={description}
        ideaTitle={title}
        onClose={handleCloseAIDialog}
        onOutlineGenerated={handleOutlineGenerated}
        open={showAIDialog}
        topics={topics}
      />

      <TrendingTopicsDialog
        onClose={handleCloseTrendingDialog}
        onSelectTopic={handleSelectTrendingTopic}
        open={showTrendingDialog}
      />

      <TopicSuggestionsDialog
        existingTopics={topics}
        onClose={handleCloseTopicSuggestionsDialog}
        onSelectTopic={handleSelectSuggestedTopic}
        open={showTopicSuggestionsDialog}
      />

      <ScriptGenerationDialog
        ideaDescription={description}
        ideaTitle={title}
        onClose={handleCloseScriptDialog}
        onScriptGenerated={handleScriptGenerated}
        open={showScriptDialog}
        outline={outline}
        topics={topics}
      />

      <ImageGenerationDialog
        ideaTitle={title}
        onClose={handleCloseImageDialog}
        open={showImageDialog}
        topics={topics}
      />
    </div>
  );
}
