"use client";

import { useState } from "react";
import Image from "next/image";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
} from "@ratecreator/ui";
import {
  Loader2,
  Image as ImageIcon,
  Sparkles,
  Copy,
  Check,
  AlertCircle,
  Upload,
} from "lucide-react";

interface ImageGenerationDialogProps {
  open: boolean;
  onClose: () => void;
  ideaTitle: string;
  topics: string[];
  onImageGenerated?: (imageData: { base64?: string; url?: string }) => void;
}

interface ImageSuggestion {
  enhancedPrompt: string;
  stockPhotoKeywords: string[];
  colorPalette: string[];
}

const styleOptions = [
  { value: "photorealistic", label: "Photorealistic" },
  { value: "digital-art", label: "Digital Art" },
  { value: "illustration", label: "Illustration" },
  { value: "minimalist", label: "Minimalist" },
  { value: "abstract", label: "Abstract" },
];

const aspectRatioOptions = [
  { value: "16:9", label: "16:9 (Landscape)" },
  { value: "1:1", label: "1:1 (Square)" },
  { value: "4:3", label: "4:3 (Standard)" },
  { value: "9:16", label: "9:16 (Portrait)" },
];

export function ImageGenerationDialog({
  open,
  onClose,
  ideaTitle,
  topics,
  onImageGenerated,
}: ImageGenerationDialogProps): JSX.Element {
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("photorealistic");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedBase64, setGeneratedBase64] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<ImageSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const getDefaultPrompt = (): string => {
    const topicsStr =
      topics.length > 0
        ? `, featuring ${topics.slice(0, 2).join(" and ")}`
        : "";
    return `Blog header image for "${ideaTitle}"${topicsStr}`;
  };

  const handleGenerate = (): void => {
    setGenerating(true);
    setError(null);
    setSuggestion(null);
    setUploadedUrl(null);
    setGeneratedBase64(null);

    const imagePrompt = prompt || getDefaultPrompt();

    fetch("/api/ai/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: imagePrompt,
        style,
        aspectRatio,
      }),
    })
      .then((res) => res.json())
      .then(
        (data: {
          imageBase64?: string;
          imageUrl?: string;
          error?: string;
          fallback?: boolean;
          suggestion?: ImageSuggestion;
        }) => {
          if (data.imageBase64) {
            setGeneratedImage(`data:image/png;base64,${data.imageBase64}`);
            setGeneratedBase64(data.imageBase64);
          } else if (data.imageUrl) {
            setGeneratedImage(data.imageUrl);
            setUploadedUrl(data.imageUrl);
            if (onImageGenerated) {
              onImageGenerated({ url: data.imageUrl });
            }
          } else if (data.fallback && data.suggestion) {
            setSuggestion(data.suggestion);
            setError(
              "Image generation service unavailable. Use the suggestions below.",
            );
          } else if (data.error) {
            setError(data.error);
          }
        },
      )
      .catch(() => {
        setError("Failed to generate image. Please try again.");
      })
      .finally(() => {
        setGenerating(false);
      });
  };

  const handleUploadToS3 = (): void => {
    if (!generatedBase64) return;

    setUploading(true);
    setError(null);

    const byteCharacters = atob(generatedBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "image/png" });
    const file = new File([blob], "generated-image.png", { type: "image/png" });

    axios
      .post<{ uploadURL: string; s3URL: string }>("/api/upload", {
        fileType: "image/png",
      })
      .then(({ data }) => {
        return axios
          .put(data.uploadURL, file, {
            headers: { "Content-Type": "image/png" },
          })
          .then(() => data.s3URL);
      })
      .then((s3URL) => {
        setUploadedUrl(s3URL);
        if (onImageGenerated) {
          onImageGenerated({ url: s3URL });
        }
      })
      .catch(() => {
        setError("Failed to upload image. Please try again.");
      })
      .finally(() => {
        setUploading(false);
      });
  };

  const handleCopyPrompt = (): void => {
    const textToCopy =
      suggestion?.enhancedPrompt || prompt || getDefaultPrompt();
    void navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleOpenChange = (openState: boolean): void => {
    if (!openState) {
      onClose();
      setGeneratedImage(null);
      setGeneratedBase64(null);
      setUploadedUrl(null);
      setSuggestion(null);
      setError(null);
    }
  };

  const handlePromptChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ): void => {
    setPrompt(e.target.value);
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-purple-500" />
            Generate Blog Image
          </DialogTitle>
          <DialogDescription>
            Generate a header image for your blog post using AI
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          <div className="space-y-2">
            <Label>Image Description</Label>
            <Textarea
              onChange={handlePromptChange}
              placeholder={getDefaultPrompt()}
              rows={3}
              value={prompt}
            />
            <p className="text-xs text-muted-foreground">
              Describe what you want in the image. Leave empty to use
              auto-generated prompt.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Style</Label>
              <Select onValueChange={setStyle} value={style}>
                <SelectTrigger>
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {styleOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Aspect Ratio</Label>
              <Select onValueChange={setAspectRatio} value={aspectRatio}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ratio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {aspectRatioOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && !suggestion ? (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </div>
          ) : null}

          {suggestion ? (
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Suggested Prompt</Label>
                <Button onClick={handleCopyPrompt} size="sm" variant="ghost">
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm">{suggestion.enhancedPrompt}</p>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Stock Photo Keywords
                </Label>
                <div className="flex flex-wrap gap-1">
                  {suggestion.stockPhotoKeywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Suggested Color Palette
                </Label>
                <div className="flex gap-2">
                  {suggestion.colorPalette.map((color) => (
                    <div
                      className="w-8 h-8 rounded border"
                      key={color}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {generatedImage ? (
            <div className="space-y-2">
              <Label>Generated Image</Label>
              <div className="relative rounded-lg overflow-hidden border aspect-video">
                <Image
                  alt="Generated blog header"
                  className="object-cover"
                  fill
                  src={generatedImage}
                  unoptimized
                />
              </div>
              {uploadedUrl ? (
                <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 dark:text-green-400">
                    Uploaded successfully
                  </span>
                  <code className="text-xs bg-muted px-2 py-1 rounded max-w-xs truncate flex-1">
                    {uploadedUrl}
                  </code>
                  <Button
                    onClick={() => {
                      void navigator.clipboard.writeText(uploadedUrl);
                      setCopied(true);
                      setTimeout(() => {
                        setCopied(false);
                      }, 2000);
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            {(() => {
              if (uploadedUrl) return "Done";
              if (generatedImage) return "Close";
              return "Cancel";
            })()}
          </Button>
          {generatedImage && generatedBase64 && !uploadedUrl ? (
            <Button disabled={uploading} onClick={handleUploadToS3}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload to Storage
                </>
              )}
            </Button>
          ) : null}
          <Button disabled={generating || uploading} onClick={handleGenerate}>
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {generatedImage ? "Regenerate" : "Generate Image"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
