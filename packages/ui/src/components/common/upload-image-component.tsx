"use client";

import React from "react";
import { Plus, X } from "lucide-react";

import { cn } from "@ratecreator/ui/utils";

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@ratecreator/ui";

import { SingleImageDropzone } from "./single-image-dropzone";

/**
 * Props for the UploadComponent
 */
interface UploadComponentProps {
  /** Current image URL */
  imageUrl: string;

  /** Whether the file upload dialog is open */
  isFileUploadOpen: boolean;
  /** Function to toggle the file upload dialog */
  toggleFileUpload: (value: boolean) => void;
  /** Whether the upload is in progress */
  isSubmitting: boolean;
  /** Function to handle file change */
  onChange: (file?: File) => void;

  /** Button variant for the upload button */
  buttonVariant?:
    | "metadata"
    | "default"
    | "destructive"
    | "destructive-outline"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "date"
    | null
    | undefined;
  /** Text to display on the upload button */
  text: string;
  /** Additional CSS classes */
  className?: string;
  /** Function to handle upload cancellation */
  onCancel: () => void;
}

/**
 * UploadComponent
 *
 * A reusable component for handling image uploads. It provides both a button
 * for initiating uploads and a dropzone for drag-and-drop functionality.
 *
 * @component
 * @param {UploadComponentProps} props - Component props
 * @returns {JSX.Element} An image upload component
 */
export const UploadComponent: React.FC<UploadComponentProps> = ({
  imageUrl,
  isFileUploadOpen,
  toggleFileUpload,
  isSubmitting,
  onChange,
  buttonVariant = "metadata",
  text,
  className,
  onCancel,
}: UploadComponentProps) => {
  return (
    <>
      {/* Show either the dropzone or upload button based on whether an image is selected */}
      {imageUrl ? (
        <SingleImageDropzone
          className={cn("w-full outline-none", className)}
          disabled={isSubmitting}
          value={imageUrl}
          onChange={onChange}
        />
      ) : (
        <Button
          variant={buttonVariant}
          className={cn("", className)}
          onClick={() => toggleFileUpload(true)}
        >
          <Plus className="mr-2 size-4" />
          {text}
        </Button>
      )}

      {/* File upload dialog */}
      <Dialog open={isFileUploadOpen} onOpenChange={toggleFileUpload}>
        <DialogContent className="dark:bg-neutral-700">
          <DialogHeader>
            <DialogTitle>Select file to upload</DialogTitle>
          </DialogHeader>
          <SingleImageDropzone
            className="w-full outline-none"
            disabled={isSubmitting}
            value={imageUrl}
            onChange={onChange}
          />
          {/* Show cancel button only when upload is in progress */}
          {isSubmitting && (
            <Button variant="destructive" onClick={onCancel} className="mt-2">
              <X className="mr-2 size-4" />
              Cancel Upload
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
