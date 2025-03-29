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

interface UploadComponentProps {
  imageUrl: string;

  isFileUploadOpen: boolean;
  toggleFileUpload: (value: boolean) => void;
  isSubmitting: boolean;
  onChange: (file?: File) => void;

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
  text: string;
  className?: string;
  onCancel: () => void;
}

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
          <Plus className='mr-2 size-4' />
          {text}
        </Button>
      )}

      <Dialog open={isFileUploadOpen} onOpenChange={toggleFileUpload}>
        <DialogContent className='dark:bg-neutral-700'>
          <DialogHeader>
            <DialogTitle>Select file to upload</DialogTitle>
          </DialogHeader>
          <SingleImageDropzone
            className='w-full outline-none'
            disabled={isSubmitting}
            value={imageUrl}
            onChange={onChange}
          />
          {isSubmitting && (
            <Button variant='destructive' onClick={onCancel} className='mt-2'>
              <X className='mr-2 size-4' />
              Cancel Upload
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
