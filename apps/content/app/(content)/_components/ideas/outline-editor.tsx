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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
} from "@ratecreator/ui";
import { Loader2, FileText, ArrowRight, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { convertIdeaToDraft } from "@ratecreator/actions/content";

interface OutlineEditorProps {
  outline: string;
  onOutlineChange: (outline: string) => void;
  onSave: () => void;
  ideaId: string;
  authorId: string;
}

export function OutlineEditor({
  outline,
  onOutlineChange,
  onSave,
  ideaId,
  authorId,
}: OutlineEditorProps): JSX.Element {
  const router = useRouter();
  const [converting, setConverting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contentPlatform, setContentPlatform] = useState<
    "RATECREATOR" | "CREATOROPS" | "DOCUMENTATION"
  >("RATECREATOR");
  const [contentType, setContentType] = useState<
    "BLOG" | "GLOSSARY" | "NEWSLETTER"
  >("BLOG");

  const handleCopyOutline = (): void => {
    navigator.clipboard.writeText(outline);
    setCopied(true);
    toast.success("Outline copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConvertToDraft = async (): Promise<void> => {
    setConverting(true);
    try {
      const result = await convertIdeaToDraft(
        ideaId,
        outline,
        authorId,
        contentPlatform,
        contentType,
      );
      toast.success("Draft created successfully!");
      router.push(`/editor/${result.postId}`);
    } catch {
      toast.error("Failed to create draft. Please try again.");
    } finally {
      setConverting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generated Content
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyOutline}
            className="gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={outline}
          onChange={(e) => onOutlineChange(e.target.value)}
          rows={15}
          className="font-mono text-sm"
          placeholder="Generated outline will appear here..."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Target Platform</Label>
            <Select
              value={contentPlatform}
              onValueChange={(value) =>
                setContentPlatform(
                  value as "RATECREATOR" | "CREATOROPS" | "DOCUMENTATION",
                )
              }
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
            <Select
              value={contentType}
              onValueChange={(value) =>
                setContentType(value as "BLOG" | "GLOSSARY" | "NEWSLETTER")
              }
            >
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

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onSave}>
            Save Outline
          </Button>
          <Button onClick={handleConvertToDraft} disabled={converting}>
            {converting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Draft...
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4 mr-2" />
                Convert to Draft
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
