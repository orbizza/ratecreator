"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Label,
} from "@ratecreator/ui";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface AIGenerateDialogProps {
  open: boolean;
  onClose: () => void;
  onOutlineGenerated: (outline: string) => void;
  ideaTitle: string;
  ideaDescription: string;
  topics: string[];
}

export function AIGenerateDialog({
  open,
  onClose,
  onOutlineGenerated,
  ideaTitle,
  ideaDescription,
  topics,
}: AIGenerateDialogProps): JSX.Element {
  const [generating, setGenerating] = useState(false);
  const [additionalContext, setAdditionalContext] = useState("");
  const [contentPlatform, setContentPlatform] = useState<string>("RATECREATOR");
  const [contentType, setContentType] = useState<string>("BLOG");

  const handleGenerate = async (): Promise<void> => {
    if (!ideaTitle.trim()) {
      toast.error("Please add a title before generating an outline");
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch("/api/ai/generate-outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: ideaTitle,
          description: ideaDescription,
          topics,
          additionalContext,
          contentPlatform,
          contentType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate outline");
      }

      const data = await response.json();
      onOutlineGenerated(data.outline);
      toast.success("Outline generated successfully!");
      onClose();
    } catch {
      toast.error("Failed to generate outline. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Generate Outline with AI
          </DialogTitle>
          <DialogDescription>
            Generate a structured outline for your content idea using AI.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Target Platform</Label>
            <Select value={contentPlatform} onValueChange={setContentPlatform}>
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="RATECREATOR">RateCreator</SelectItem>
                  <SelectItem value="CREATOROPS">CreatorOps</SelectItem>
                  <SelectItem value="DOCUMENTATION">Documentation</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Content Type</Label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="BLOG">Blog Post</SelectItem>
                  <SelectItem value="GLOSSARY">Glossary Entry</SelectItem>
                  <SelectItem value="NEWSLETTER">Newsletter</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additional-context">
              Additional Context (Optional)
            </Label>
            <Textarea
              id="additional-context"
              placeholder="Add any specific requirements, target audience, or key points to include..."
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              rows={3}
            />
          </div>

          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-medium mb-2">
              Will generate outline for:
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Title:</strong> {ideaTitle || "No title yet"}
            </p>
            {ideaDescription && (
              <p className="text-sm text-muted-foreground mt-1">
                <strong>Description:</strong>{" "}
                {ideaDescription.substring(0, 100)}
                {ideaDescription.length > 100 ? "..." : ""}
              </p>
            )}
            {topics.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                <strong>Topics:</strong> {topics.join(", ")}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={generating}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={generating || !ideaTitle.trim()}
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Outline
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
