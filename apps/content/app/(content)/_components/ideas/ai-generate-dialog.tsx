"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Textarea,
  Label,
} from "@ratecreator/ui";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";

interface AIGenerateDialogProps {
  open: boolean;
  onClose: () => void;
  ideaTitle: string;
  ideaDescription: string;
  topics: string[];
  onOutlineGenerated: (outline: string) => void;
}

export function AIGenerateDialog({
  open,
  onClose,
  ideaTitle,
  ideaDescription,
  topics,
  onOutlineGenerated,
}: AIGenerateDialogProps): JSX.Element {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [additionalContext, setAdditionalContext] = useState("");

  const handleGenerate = (): void => {
    setGenerating(true);
    setError(null);

    fetch("/api/ai/generate-outline", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: ideaTitle,
        description: ideaDescription,
        topics,
        additionalContext,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to generate outline");
        }
        return response.json();
      })
      .then((data: { outline: string }) => {
        onOutlineGenerated(data.outline);
        onClose();
      })
      .catch((err: Error) => {
        setError(err.message || "Failed to generate outline");
      })
      .finally(() => {
        setGenerating(false);
      });
  };

  const handleContextChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ): void => {
    setAdditionalContext(e.target.value);
  };

  const handleOpenChange = (openState: boolean): void => {
    if (!openState) {
      onClose();
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Generate Outline with AI
          </DialogTitle>
          <DialogDescription>
            Generate a detailed blog post outline based on your idea.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Idea Summary</Label>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">{ideaTitle}</p>
              {ideaDescription ? (
                <p className="text-sm text-muted-foreground mt-1">
                  {ideaDescription}
                </p>
              ) : null}
              {topics.length > 0 ? (
                <p className="text-xs text-muted-foreground mt-2">
                  Topics: {topics.join(", ")}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="context">Additional Context (Optional)</Label>
            <Textarea
              id="context"
              onChange={handleContextChange}
              placeholder="Add any additional details, target audience, or specific points to cover..."
              rows={3}
              value={additionalContext}
            />
          </div>

          {error ? (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button disabled={generating} onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button disabled={generating} onClick={handleGenerate}>
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
