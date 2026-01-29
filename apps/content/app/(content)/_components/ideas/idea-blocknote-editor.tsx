"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { UploadComponent } from "@ratecreator/ui/common";
import { Button } from "@ratecreator/ui";
import {
  Loader2,
  Check,
  AlertCircle,
  Maximize2,
  Minimize2,
  Save,
  Image as ImageIcon,
} from "lucide-react";
import { ImageGenerationDialog } from "./image-generation-dialog";

interface IdeaBlockNoteEditorProps {
  content: string | null;
  onChange: (content: string) => Promise<void>;
  editable?: boolean;
  stageTitle?: string;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function IdeaBlockNoteEditor({
  content,
  onChange,
  editable = true,
  stageTitle = "Editor",
}: IdeaBlockNoteEditorProps): JSX.Element {
  const Editor = useMemo(
    () =>
      dynamic(
        () => import("@ratecreator/ui/common").then((mod) => mod.Editor),
        {
          ssr: false,
          loading: () => (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ),
        },
      ),
    [],
  );

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [localContent, setLocalContent] = useState(content || "");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContent = useRef<string>(content || "");
  const localContentRef = useRef<string>(content || "");
  const onChangeRef = useRef(onChange);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep refs in sync with latest values
  useEffect(() => {
    localContentRef.current = localContent;
  }, [localContent]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Save pending content on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (localContentRef.current !== lastSavedContent.current) {
        void onChangeRef.current(localContentRef.current);
      }
    };
  }, []);

  // Handle escape key in fullscreen mode
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isFullscreen]);

  const handleChange = useCallback(
    (newContent: string) => {
      setLocalContent(newContent);

      // Don't trigger save if content hasn't changed
      if (newContent === lastSavedContent.current) {
        return;
      }

      // Clear existing debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Set saving status after a brief delay to avoid flickering
      const statusTimeout = setTimeout(() => {
        setSaveStatus("saving");
      }, 500);

      // Debounce the actual save
      debounceRef.current = setTimeout(() => {
        clearTimeout(statusTimeout);
        setSaveStatus("saving");

        onChange(newContent)
          .then(() => {
            lastSavedContent.current = newContent;
            setSaveStatus("saved");

            // Reset to idle after showing "saved"
            setTimeout(() => {
              setSaveStatus("idle");
            }, 2000);
          })
          .catch(() => {
            setSaveStatus("error");
            setTimeout(() => {
              setSaveStatus("idle");
            }, 3000);
          });
      }, 2000); // 2 second debounce
    },
    [onChange],
  );

  const handleManualSave = (): void => {
    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (localContent === lastSavedContent.current) {
      return;
    }

    setSaveStatus("saving");
    onChange(localContent)
      .then(() => {
        lastSavedContent.current = localContent;
        setSaveStatus("saved");
        setTimeout(() => {
          setSaveStatus("idle");
        }, 2000);
      })
      .catch(() => {
        setSaveStatus("error");
        setTimeout(() => {
          setSaveStatus("idle");
        }, 3000);
      });
  };

  const toggleFullscreen = (): void => {
    setIsFullscreen((prev) => !prev);
  };

  const handleOpenImageDialog = (): void => {
    setShowImageDialog(true);
  };

  const handleCloseImageDialog = (): void => {
    setShowImageDialog(false);
  };

  const handleImageGenerated = (imageData: { url?: string }): void => {
    if (imageData.url) {
      setUploadedImageUrl(imageData.url);
    }
  };

  const toggleFileUpload = (value: boolean): void => {
    setIsFileUploadOpen(value);
  };

  const handleFileUpload = async (file?: File): Promise<void> => {
    if (!file) {
      setIsFileUploadOpen(false);
      return;
    }

    setIsUploading(true);
    try {
      const { default: axios } = await import("axios");
      const { data } = await axios.post<{ uploadURL: string; s3URL: string }>(
        "/api/upload",
        { fileType: file.type },
      );
      await axios.put(data.uploadURL, file, {
        headers: { "Content-Type": file.type },
      });
      setUploadedImageUrl(data.s3URL);
    } catch {
      // Error uploading
    } finally {
      setIsUploading(false);
      setIsFileUploadOpen(false);
    }
  };

  const renderSaveStatus = (): JSX.Element => {
    if (saveStatus === "saving") {
      return (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Saving...</span>
        </>
      );
    }
    if (saveStatus === "saved") {
      return (
        <>
          <Check className="h-3 w-3 text-green-500" />
          <span className="text-green-600 dark:text-green-400">Saved</span>
        </>
      );
    }
    if (saveStatus === "error") {
      return (
        <>
          <AlertCircle className="h-3 w-3 text-red-500" />
          <span className="text-red-600 dark:text-red-400">Error</span>
        </>
      );
    }
    return <span>Auto-save enabled</span>;
  };

  const containerClasses = isFullscreen
    ? "fixed inset-0 z-50 bg-background flex flex-col"
    : "flex flex-col h-full";

  return (
    <>
      <div className={containerClasses} ref={containerRef}>
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              {stageTitle}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Upload Image Button */}
            <UploadComponent
              imageUrl=""
              isFileUploadOpen={isFileUploadOpen}
              isSubmitting={isUploading}
              onChange={(file) => {
                void handleFileUpload(file);
              }}
              onCancel={() => {
                setIsFileUploadOpen(false);
              }}
              text="Upload"
              toggleFileUpload={toggleFileUpload}
            />

            {/* AI Image Generation */}
            <Button
              className="text-muted-foreground hover:text-foreground"
              onClick={handleOpenImageDialog}
              size="sm"
              variant="ghost"
            >
              <ImageIcon className="h-4 w-4 mr-1" />
              AI Image
            </Button>

            {/* Manual Save Button */}
            <Button
              className="text-muted-foreground hover:text-foreground"
              disabled={saveStatus === "saving"}
              onClick={handleManualSave}
              size="sm"
              variant="ghost"
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>

            {/* Fullscreen Toggle */}
            <Button
              className="text-muted-foreground hover:text-foreground"
              onClick={toggleFullscreen}
              size="sm"
              variant="ghost"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>

            {/* Save Status */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground ml-2 border-l border-border pl-3">
              {renderSaveStatus()}
            </div>
          </div>
        </div>

        {/* Uploaded Image Preview */}
        {uploadedImageUrl ? (
          <div className="px-4 py-2 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-24 flex-shrink-0">
                <Image
                  alt="Uploaded"
                  className="rounded border object-cover"
                  fill
                  sizes="96px"
                  src={uploadedImageUrl}
                  unoptimized
                />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">
                  Image uploaded successfully. Copy the URL to use in your
                  content.
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded max-w-xs truncate">
                    {uploadedImageUrl}
                  </code>
                  <Button
                    onClick={() => {
                      void navigator.clipboard.writeText(uploadedImageUrl);
                    }}
                    size="sm"
                    variant="outline"
                  >
                    Copy URL
                  </Button>
                  <Button
                    onClick={() => {
                      setUploadedImageUrl(null);
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Editor */}
        <div className="flex-1 overflow-auto p-4">
          <Editor
            editable={editable}
            initialContent={localContent || undefined}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* AI Image Generation Dialog */}
      <ImageGenerationDialog
        ideaTitle=""
        onClose={handleCloseImageDialog}
        onImageGenerated={handleImageGenerated}
        open={showImageDialog}
        topics={[]}
      />
    </>
  );
}
