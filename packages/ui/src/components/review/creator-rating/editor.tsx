"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => (
    <div className='flex items-center justify-center h-[200px] bg-muted rounded-md'>
      <Loader2 className='w-6 h-6 animate-spin' />
    </div>
  ),
});

const modules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "list",
  "bullet",
  "link",
];

const editorStyles = `
  /* Common styles for both themes */
  .ql-toolbar {
    border: none !important;
    border-bottom: 1px solid hsl(var(--border)) !important;
    background-color: hsl(var(--secondary)) !important;
    position: relative !important;
  }

  .ql-container {
    border: none !important;
    background-color: hsl(var(--background)) !important;
  }

  /* Add wrapper styles for the border */
  .quill {
    border: 1px solid hsl(var(--border)) !important;
    border-radius: 0.375rem !important;
    overflow: hidden !important;
  }

  .ql-editor {
    min-height: 170px !important;
  }

  /* Fix URL popup positioning */
  .ql-tooltip {
    left: 2px !important;
    z-index: 50 !important;
    border-radius: 8px !important;
    padding: 8px !important;
  }

  .ql-tooltip[data-mode="link"]::before {
    content: "Enter link URL:" !important;
  }

  .ql-tooltip.ql-editing {
    left: 2px !important;
    top: -5px !important;
    background-color: hsl(var(--background)) !important;
    border: 1px solid hsl(var(--border)) !important;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2) !important;
    padding: 8px 12px !important;
    border-radius: 4px !important;
  }

  .ql-tooltip input[type="text"] {
    width: 200px !important;
    color: hsl(var(--foreground)) !important;
    background: hsl(var(--background)) !important;
    border: 1px solid hsl(var(--border)) !important;
    border-radius: 4px !important;
    padding: 4px 8px !important;
    margin: 0 8px !important;
  }

  .ql-tooltip a.ql-action::after {
    border-radius: 4px !important;
  }

  .ql-tooltip a.ql-remove::before {
    border-radius: 4px !important;
  }

  /* Dark theme specific styles */
  .quill-dark .ql-tooltip {
    background-color: hsl(var(--background)) !important;
    color: hsl(var(--foreground)) !important;
    border-color: hsl(var(--border)) !important;
  }

  .quill-dark .ql-tooltip input[type="text"] {
    color: hsl(var(--foreground)) !important;
    background: hsl(var(--background)) !important;
    border-color: hsl(var(--border)) !important;
  }

  .quill-dark .ql-toolbar {
    background-color: hsl(var(--secondary)) !important;
  }
  
  .quill-dark .ql-container {
    background-color: hsl(var(--background)) !important;
    color: hsl(var(--foreground)) !important;
  }

  .quill-dark .ql-toolbar .ql-stroke {
    stroke: hsl(var(--foreground)) !important;
  }

  .quill-dark .ql-toolbar .ql-fill {
    fill: hsl(var(--foreground)) !important;
  }

  .quill-dark .ql-toolbar .ql-picker {
    color: hsl(var(--foreground)) !important;
  }

  .quill-dark .ql-toolbar button:hover .ql-stroke,
  .quill-dark .ql-toolbar button.ql-active .ql-stroke {
    stroke: hsl(var(--primary)) !important;
  }

  .quill-dark .ql-toolbar button:hover .ql-fill,
  .quill-dark .ql-toolbar button.ql-active .ql-fill {
    fill: hsl(var(--primary)) !important;
  }

  .quill-dark .ql-toolbar .ql-picker-label:hover,
  .quill-dark .ql-toolbar .ql-picker-label.ql-active {
    color: hsl(var(--primary)) !important;
  }

  .quill-dark .ql-toolbar .ql-picker-options {
    background-color: hsl(var(--background)) !important;
    border: 1px solid hsl(var(--border)) !important;
  }

  .quill-dark .ql-editor.ql-blank::before {
    color: hsl(var(--muted-foreground)) !important;
  }
`;

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const Editor = ({
  value,
  onChange,
  placeholder,
  className,
}: EditorProps) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className='min-h-[200px] bg-muted rounded-md flex items-center justify-center'>
        <Loader2 className='w-6 h-6 animate-spin' />
      </div>
    );
  }

  return (
    <div className={`min-h-[200px] ${theme === "dark" ? "quill-dark" : ""}`}>
      <style dangerouslySetInnerHTML={{ __html: editorStyles }} />
      <ReactQuill
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        theme='snow'
        className={className || "h-[200px]"}
      />
    </div>
  );
};
