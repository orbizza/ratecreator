"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  Label,
  Textarea,
  Badge,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Calendar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@ratecreator/ui";
import { format } from "date-fns";
import {
  Loader2,
  Plus,
  X,
  Trash2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  Lightbulb,
  FileText,
  Image as ImageIcon,
  ChevronDown,
  Calendar as CalendarIcon,
  Mail,
} from "lucide-react";
import {
  fetchIdeaById,
  updateIdea,
  deleteIdea,
  convertIdeaToDraft,
  type IdeaType,
  type IdeaStatus,
  type IdeaStage,
} from "@ratecreator/actions/content";
import { IdeaStageSidebar } from "./idea-stage-sidebar";
import { IdeaBlockNoteEditor } from "./idea-blocknote-editor";
import { AIGenerateDialog } from "./ai-generate-dialog";
import { TrendingTopicsDialog } from "./trending-topics-dialog";
import { TopicSuggestionsDialog } from "./topic-suggestions-dialog";
import { ScriptGenerationDialog } from "./script-generation-dialog";
import { ImageGenerationDialog } from "./image-generation-dialog";

interface IdeaFullPageEditorProps {
  ideaId: string;
  authorId: string;
}

export function IdeaFullPageEditor({
  ideaId,
  authorId,
}: IdeaFullPageEditorProps): JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [idea, setIdea] = useState<IdeaType | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [currentStage, setCurrentStage] = useState<IdeaStage>("ROUGH_IDEA");
  const [outlineContent, setOutlineContent] = useState<string | null>(null);
  const [scriptContent, setScriptContent] = useState<string | null>(null);
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [newTopic, setNewTopic] = useState("");

  // Version counter to force editor remount when AI generates new content
  const [editorVersion, setEditorVersion] = useState(0);

  // Dialog state
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [showTrendingDialog, setShowTrendingDialog] = useState(false);
  const [showTopicSuggestionsDialog, setShowTopicSuggestionsDialog] =
    useState(false);
  const [showScriptDialog, setShowScriptDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [postType, setPostType] = useState<"blog" | "newsletter">("blog");

  const loadIdea = useCallback(async (): Promise<void> => {
    try {
      const data = await fetchIdeaById(ideaId);
      if (data) {
        setIdea(data);
        setTitle(data.title);
        setDescription(data.description || "");
        setTopics(data.topics);
        setCurrentStage(data.currentStage);
        setOutlineContent(data.outlineContent || null);
        setScriptContent(data.scriptContent || null);
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

  const handleSaveRoughIdea = useCallback(async (): Promise<void> => {
    setSaving(true);
    try {
      await updateIdea(ideaId, {
        title,
        description,
        topics,
        targetDate,
        currentStage,
        status: "IN_PROGRESS" as IdeaStatus,
      });
      await loadIdea();
    } catch {
      // Failed to save
    } finally {
      setSaving(false);
    }
  }, [ideaId, title, description, topics, targetDate, currentStage, loadIdea]);

  const handleSaveOutline = useCallback(
    async (content: string): Promise<void> => {
      await updateIdea(ideaId, {
        outlineContent: content,
        currentStage: "OUTLINE",
        status: "IN_PROGRESS" as IdeaStatus,
      });
    },
    [ideaId],
  );

  const handleSaveScript = useCallback(
    async (content: string): Promise<void> => {
      await updateIdea(ideaId, {
        scriptContent: content,
        currentStage: "SCRIPT",
        status: "IN_PROGRESS" as IdeaStatus,
      });
    },
    [ideaId],
  );

  const handleStageChange = (stage: IdeaStage): void => {
    setCurrentStage(stage);
    void updateIdea(ideaId, { currentStage: stage });
  };

  const handleOpenConvertDialog = (): void => {
    setShowConvertDialog(true);
  };

  const handleCloseConvertDialog = (): void => {
    setShowConvertDialog(false);
  };

  const handleConvertToDraft = (): void => {
    setSaving(true);
    setShowConvertDialog(false);
    const content = scriptContent || outlineContent || "";
    const isNewsletter = postType === "newsletter";
    convertIdeaToDraft(
      ideaId,
      content,
      authorId,
      "RATECREATOR",
      isNewsletter ? "NEWSLETTER" : "BLOG",
    )
      .then((result) => {
        router.push(`/editor/${result.postId}`);
      })
      .catch(() => {
        // Failed to convert
      })
      .finally(() => {
        setSaving(false);
      });
  };

  const handleDelete = (): void => {
    deleteIdea(ideaId)
      .then(() => {
        router.push("/ideas");
      })
      .catch(() => {
        // Failed to delete
      });
  };

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

  const handleOutlineGenerated = (generatedOutline: string): void => {
    setOutlineContent(generatedOutline);
    setCurrentStage("OUTLINE");
    setEditorVersion((v) => v + 1);
    void updateIdea(ideaId, {
      outlineContent: generatedOutline,
      currentStage: "OUTLINE",
    });
  };

  const handleScriptGenerated = (script: string): void => {
    setScriptContent(script);
    setCurrentStage("SCRIPT");
    setEditorVersion((v) => v + 1);
    void updateIdea(ideaId, {
      scriptContent: script,
      currentStage: "SCRIPT",
    });
  };

  const handleSelectTrendingTopic = (
    topic: string,
    topicDescription: string,
  ): void => {
    setTitle(topic);
    setDescription(topicDescription);
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

  const handleBackToIdeas = (): void => {
    router.push("/ideas");
  };

  const handleViewDraft = (): void => {
    if (idea?.createdPostId) {
      router.push(`/editor/${idea.createdPostId}`);
    }
  };

  const handleOpenTrendingDialog = (): void => {
    setShowTrendingDialog(true);
  };

  const handleCloseTrendingDialog = (): void => {
    setShowTrendingDialog(false);
  };

  const handleOpenTopicSuggestionsDialog = (): void => {
    setShowTopicSuggestionsDialog(true);
  };

  const handleCloseTopicSuggestionsDialog = (): void => {
    setShowTopicSuggestionsDialog(false);
  };

  const handleOpenAIDialog = (): void => {
    setShowAIDialog(true);
  };

  const handleCloseAIDialog = (): void => {
    setShowAIDialog(false);
  };

  const handleOpenScriptDialog = (): void => {
    setShowScriptDialog(true);
  };

  const handleCloseScriptDialog = (): void => {
    setShowScriptDialog(false);
  };

  const handleOpenImageDialog = (): void => {
    setShowImageDialog(true);
  };

  const handleCloseImageDialog = (): void => {
    setShowImageDialog(false);
  };

  const handleTargetDateSelect = (date: Date | undefined): void => {
    setTargetDate(date || null);
  };

  const handleClearTargetDate = (): void => {
    setTargetDate(null);
  };

  const handleSaveAndContinue = (): void => {
    void handleSaveRoughIdea();
  };

  const handleSkipToOutline = (): void => {
    void handleSaveRoughIdea().then(() => {
      setCurrentStage("OUTLINE");
    });
  };

  const handleBackToScript = (): void => {
    setCurrentStage("SCRIPT");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Idea not found</p>
      </div>
    );
  }

  // If already converted to draft
  if (idea.status === "DRAFT_CREATED" && idea.createdPostId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Draft Already Created</h2>
          <p className="text-muted-foreground">
            This idea has been converted to a draft post.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={handleViewDraft}>
              <ArrowRight className="h-4 w-4 mr-2" />
              View Draft
            </Button>
            <Button onClick={handleBackToIdeas} variant="outline">
              Back to Ideas
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Stage Sidebar */}
      <IdeaStageSidebar
        currentStage={currentStage}
        disabled={saving}
        onStageChange={handleStageChange}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-4">
            <Button onClick={handleBackToIdeas} size="sm" variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-lg font-semibold truncate max-w-md">
              {title || "Untitled Idea"}
            </h1>
          </div>
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
                <DropdownMenuItem onClick={handleOpenTrendingDialog}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Discover Trending Topics
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleOpenTopicSuggestionsDialog}>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Get Topic Suggestions
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleOpenAIDialog}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Outline
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleOpenScriptDialog}>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Full Script
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleOpenImageDialog}>
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
        </header>

        {/* Stage Content */}
        <div className="flex-1 overflow-hidden">
          {currentStage === "ROUGH_IDEA" && (
            <div className="h-full overflow-auto p-6">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    onChange={(e) => {
                      setTitle(e.target.value);
                    }}
                    placeholder="What's your idea about?"
                    value={title}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    onChange={(e) => {
                      setDescription(e.target.value);
                    }}
                    placeholder="Describe your idea in more detail..."
                    rows={4}
                    value={description}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Topics / Keywords</Label>
                  <div className="flex gap-2">
                    <Input
                      onChange={(e) => {
                        setNewTopic(e.target.value);
                      }}
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
                        <Badge
                          className="gap-1"
                          key={topic}
                          variant="secondary"
                        >
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
                          {targetDate
                            ? format(targetDate, "PPP")
                            : "Set target date"}
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
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    disabled={saving || !title.trim()}
                    onClick={handleSaveAndContinue}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Save & Continue
                  </Button>
                  <Button
                    disabled={saving || !title.trim()}
                    onClick={handleSkipToOutline}
                    variant="outline"
                  >
                    Skip to Outline
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {currentStage === "OUTLINE" && (
            <IdeaBlockNoteEditor
              content={outlineContent}
              key={`outline-${editorVersion}`}
              onChange={handleSaveOutline}
              stageTitle="Outline"
            />
          )}

          {currentStage === "SCRIPT" && (
            <IdeaBlockNoteEditor
              content={scriptContent}
              key={`script-${editorVersion}`}
              onChange={handleSaveScript}
              stageTitle="Script / Draft"
            />
          )}

          {currentStage === "READY" && (
            <div className="h-full overflow-auto p-6">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                  <h2 className="text-xl font-semibold">
                    Ready to Create Draft
                  </h2>
                  <p className="text-muted-foreground">
                    Your idea is ready to be converted into a blog post draft.
                    Review the content below before proceeding.
                  </p>

                  <div className="space-y-2">
                    <Label>Title</Label>
                    <p className="font-medium">{title}</p>
                  </div>

                  {description ? (
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <p className="text-muted-foreground">{description}</p>
                    </div>
                  ) : null}

                  {topics.length > 0 ? (
                    <div className="space-y-2">
                      <Label>Topics</Label>
                      <div className="flex flex-wrap gap-2">
                        {topics.map((topic) => (
                          <Badge key={topic} variant="secondary">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <Label>Content Status</Label>
                    <div className="flex items-center gap-4">
                      <Badge variant={outlineContent ? "default" : "secondary"}>
                        Outline: {outlineContent ? "Ready" : "Empty"}
                      </Badge>
                      <Badge variant={scriptContent ? "default" : "secondary"}>
                        Script: {scriptContent ? "Ready" : "Empty"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    disabled={saving || (!outlineContent && !scriptContent)}
                    onClick={handleOpenConvertDialog}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Convert to Draft
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <Button onClick={handleBackToScript} variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Script
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Dialogs */}
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
        outline={outlineContent || ""}
        topics={topics}
      />

      <ImageGenerationDialog
        ideaTitle={title}
        onClose={handleCloseImageDialog}
        open={showImageDialog}
        topics={topics}
      />

      {/* Convert to Draft Dialog */}
      <Dialog onOpenChange={setShowConvertDialog} open={showConvertDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Create Draft
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <p className="text-muted-foreground">
              Choose what type of post you want to create from this idea.
            </p>

            <div className="space-y-3">
              <button
                className={`flex items-center gap-4 w-full p-4 rounded-lg border-2 cursor-pointer transition-all text-left ${
                  postType === "blog"
                    ? "border-green-500 bg-green-500/10"
                    : "border-border bg-muted/50 hover:border-muted-foreground/50"
                }`}
                onClick={() => {
                  setPostType("blog");
                }}
                type="button"
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    postType === "blog"
                      ? "border-green-500"
                      : "border-muted-foreground"
                  }`}
                >
                  {postType === "blog" ? (
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  ) : null}
                </div>
                <FileText
                  className={`size-5 ${postType === "blog" ? "text-green-500" : "text-muted-foreground"}`}
                />
                <div className="flex-1">
                  <div className="font-medium">Blog Post</div>
                  <div className="text-sm text-muted-foreground">
                    Publish to your blog only
                  </div>
                </div>
              </button>

              <button
                className={`flex items-center gap-4 w-full p-4 rounded-lg border-2 cursor-pointer transition-all text-left ${
                  postType === "newsletter"
                    ? "border-green-500 bg-green-500/10"
                    : "border-border bg-muted/50 hover:border-muted-foreground/50"
                }`}
                onClick={() => {
                  setPostType("newsletter");
                }}
                type="button"
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    postType === "newsletter"
                      ? "border-green-500"
                      : "border-muted-foreground"
                  }`}
                >
                  {postType === "newsletter" ? (
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  ) : null}
                </div>
                <Mail
                  className={`size-5 ${postType === "newsletter" ? "text-green-500" : "text-muted-foreground"}`}
                />
                <div className="flex-1">
                  <div className="font-medium">Newsletter</div>
                  <div className="text-sm text-muted-foreground">
                    Publish to blog and send to subscribers
                  </div>
                </div>
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                className="flex-1"
                disabled={saving}
                onClick={handleConvertToDraft}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Create {postType === "newsletter" ? "Newsletter" : "Blog"} Draft
              </Button>
              <Button onClick={handleCloseConvertDialog} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
