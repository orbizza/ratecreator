"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Textarea,
} from "@ratecreator/ui";
import { Loader2, FileText, Save, Sparkles } from "lucide-react";
import { convertIdeaToDraft } from "@ratecreator/actions/content";

interface OutlineEditorProps {
  ideaId: string;
  authorId: string;
  outline: string;
  onOutlineChange: (outline: string) => void;
  onSave: () => void;
}

export function OutlineEditor({
  ideaId,
  authorId,
  outline,
  onOutlineChange,
  onSave,
}: OutlineEditorProps): JSX.Element {
  const router = useRouter();
  const [converting, setConverting] = useState(false);

  const handleConvertToDraft = (): void => {
    setConverting(true);
    convertIdeaToDraft(ideaId, outline, authorId)
      .then(({ postId }) => {
        router.push(`/editor/${postId}`);
      })
      .catch(() => {
        // Failed to convert to draft
      })
      .finally(() => {
        setConverting(false);
      });
  };

  const handleOutlineChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ): void => {
    onOutlineChange(e.target.value);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Generated Outline
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button onClick={onSave} size="sm" variant="outline">
              <Save className="h-4 w-4 mr-2" />
              Save Outline
            </Button>
            <Button
              disabled={converting}
              onClick={handleConvertToDraft}
              size="sm"
            >
              {converting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Create Draft
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          className="font-mono text-sm"
          onChange={handleOutlineChange}
          placeholder="Your generated outline will appear here..."
          rows={20}
          value={outline}
        />
        <p className="text-xs text-muted-foreground mt-2">
          You can edit the outline before converting it to a draft post.
        </p>
      </CardContent>
    </Card>
  );
}
