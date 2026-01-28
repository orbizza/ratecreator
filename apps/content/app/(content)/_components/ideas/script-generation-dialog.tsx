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
  Label,
  Switch,
} from "@ratecreator/ui";
import { Loader2, FileText } from "lucide-react";
import { toast } from "sonner";

interface ScriptGenerationDialogProps {
  open: boolean;
  onClose: () => void;
  onScriptGenerated: (script: string) => void;
  ideaTitle: string;
  ideaDescription: string;
  topics: string[];
  outline?: string;
}

export function ScriptGenerationDialog({
  open,
  onClose,
  onScriptGenerated,
  ideaTitle,
  ideaDescription,
  topics,
  outline,
}: ScriptGenerationDialogProps): JSX.Element {
  const [generating, setGenerating] = useState(false);
  const [tone, setTone] = useState<string>("professional");
  const [targetLength, setTargetLength] = useState<string>("medium");
  const [includeCodeExamples, setIncludeCodeExamples] = useState(false);
  const [contentPlatform, setContentPlatform] = useState<string>("RATECREATOR");
  const [contentType, setContentType] = useState<string>("BLOG");

  const handleGenerate = async (): Promise<void> => {
    if (!ideaTitle.trim()) {
      toast.error("Please add a title before generating a script");
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch("/api/ai/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: ideaTitle,
          description: ideaDescription,
          topics,
          outline,
          tone,
          targetLength,
          includeCodeExamples,
          contentPlatform,
          contentType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate script");
      }

      const data = await response.json();
      onScriptGenerated(data.script);
      toast.success("Script generated successfully!");
      onClose();
    } catch {
      toast.error("Failed to generate script. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Generate Full Script with AI
          </DialogTitle>
          <DialogDescription>
            Generate a complete, polished script for your content idea.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Target Platform</Label>
              <Select
                value={contentPlatform}
                onValueChange={setContentPlatform}
              >
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="educational">Educational</SelectItem>
                    <SelectItem value="storytelling">Storytelling</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Length</Label>
              <Select value={targetLength} onValueChange={setTargetLength}>
                <SelectTrigger>
                  <SelectValue placeholder="Select length" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="short">
                      Short (800-1000 words)
                    </SelectItem>
                    <SelectItem value="medium">
                      Medium (1500-2000 words)
                    </SelectItem>
                    <SelectItem value="long">Long (2500-3500 words)</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Include Code Examples</Label>
              <p className="text-sm text-muted-foreground">
                Add relevant code snippets where appropriate
              </p>
            </div>
            <Switch
              checked={includeCodeExamples}
              onCheckedChange={setIncludeCodeExamples}
            />
          </div>

          {outline && (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium mb-2">Using existing outline</p>
              <p className="text-sm text-muted-foreground">
                The script will follow the structure of your generated outline.
              </p>
            </div>
          )}
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
                <FileText className="h-4 w-4 mr-2" />
                Generate Script
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
