"use client";

import { useEffect, useRef } from "react";
import axios from "axios";
import { useTheme } from "next-themes";
import {
  PartialBlock,
  BlockNoteSchema,
  defaultBlockSpecs,
  insertOrUpdateBlock,
  filterSuggestionItems,
} from "@blocknote/core";
import {
  DefaultReactSuggestionItem,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";

import { FaYoutube, FaMarkdown, FaLightbulb } from "react-icons/fa";
import { Minus } from "lucide-react";

import { Youtube } from "./youtube-blocknote";
import { Divider } from "./divider";
import { makeFilePublic } from "@ratecreator/actions";

/**
 * BlockNote Editor Component
 *
 * This component provides a rich text editor interface using BlockNote.
 * It supports various block types and formatting options, including:
 * - Text formatting (bold, italic, etc.)
 * - Headings
 * - Lists
 * - Code blocks
 * - Blockquotes
 * - YouTube embeds
 * - Dividers
 *
 * The editor is theme-aware and provides a user-friendly interface for content creation.
 */

interface EditorProps {
  onChange: (value: string) => void;
  initialContent?: string;
  editable?: boolean;
}

const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    youtube: Youtube,
    divider: Divider,
  },
});

const insertYoutube = (editor: typeof schema.BlockNoteEditor) => ({
  title: "Youtube",
  onItemClick: () => {
    insertOrUpdateBlock(editor, {
      type: "youtube",
    });
  },
  group: "EMBEDS",
  icon: <FaYoutube />,
  aliases: ["youtube", "yt"],
  subtext: "Used to embed a youtube video.",
});

const insertDivider = (editor: typeof schema.BlockNoteEditor) => ({
  title: "Divider",
  onItemClick: () => {
    const block = editor.getTextCursorPosition().block;
    editor.insertBlocks([{ type: "divider" }], block, "before");
  },
  group: "Other",
  icon: <Minus />,
  aliases: ["divider", "line"],
  subtext: "Insert a horizontal divider.",
});

const getCustomSlashMenuItems = (
  editor: typeof schema.BlockNoteEditor,
): DefaultReactSuggestionItem[] => [
  ...getDefaultReactSlashMenuItems(editor),
  insertYoutube(editor),
  insertDivider(editor),
];

const Editor = ({ onChange, initialContent, editable }: EditorProps) => {
  const { resolvedTheme } = useTheme();
  // uncomment the initialContent to avoid the error on Markdown to Blocks
  // const [markdown, setMarkdown] = useState<string | undefined>(initialContent);

  const handleUpload = async (file: File) => {
    try {
      const { data } = await axios.post("/api/upload", {
        fileType: file.type,
        folderName: "content/editor-images",
      });

      const { uploadURL, s3URL, fileName } = data;

      await axios.put(uploadURL, file, {
        headers: {
          "Content-Type": file.type,
        },
      });
      await makeFilePublic(fileName);
      return s3URL;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw new Error("File upload failed");
    }
  };

  const parsedContent = (() => {
    if (!initialContent) return undefined;
    try {
      const parsed = JSON.parse(initialContent);
      if (Array.isArray(parsed)) return parsed as PartialBlock[];
      return undefined;
    } catch {
      // Content is not valid JSON - convert plain text to a paragraph block
      if (initialContent.trim()) {
        return [
          {
            type: "paragraph" as const,
            content: [
              { type: "text" as const, text: initialContent, styles: {} },
            ],
          },
        ];
      }
      return undefined;
    }
  })();

  const editor = useCreateBlockNote({
    initialContent: parsedContent,
    uploadFile: handleUpload,
    schema,
  });

  const isDark = resolvedTheme === "dark";
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Direct DOM manipulation to override BlockNote dark mode backgrounds.
  // CSS-based approaches (globals.css, imported CSS files, <style> tags) all fail
  // because @blocknote/mantine/style.css loads in a dynamic chunk that overrides them.
  // Inline styles set via JS always win over any CSS rule.
  useEffect(() => {
    if (!wrapperRef.current) return;

    const container = wrapperRef.current.querySelector(
      ".bn-container",
    ) as HTMLElement | null;
    const editorEl = wrapperRef.current.querySelector(
      ".bn-editor",
    ) as HTMLElement | null;

    if (isDark) {
      if (container) {
        container.style.setProperty(
          "--bn-colors-editor-background",
          "transparent",
        );
        container.style.setProperty(
          "--bn-colors-menu-background",
          "hsl(240, 10%, 3.9%)",
        );
        container.style.setProperty(
          "--bn-colors-hovered-background",
          "hsl(240, 3.7%, 15.9%)",
        );
        container.style.setProperty(
          "--bn-colors-selected-background",
          "hsl(240, 3.7%, 15.9%)",
        );
        container.style.setProperty(
          "--bn-colors-side-menu-background",
          "transparent",
        );
        container.style.setProperty(
          "background-color",
          "transparent",
          "important",
        );
        container.style.setProperty("border-radius", "0", "important");
      }
      if (editorEl) {
        editorEl.style.setProperty(
          "background-color",
          "transparent",
          "important",
        );
        editorEl.style.setProperty("border-radius", "0", "important");
      }
    } else {
      if (container) {
        container.style.removeProperty("--bn-colors-editor-background");
        container.style.removeProperty("--bn-colors-menu-background");
        container.style.removeProperty("--bn-colors-hovered-background");
        container.style.removeProperty("--bn-colors-selected-background");
        container.style.removeProperty("--bn-colors-side-menu-background");
        container.style.removeProperty("background-color");
        container.style.removeProperty("border-radius");
      }
      if (editorEl) {
        editorEl.style.removeProperty("background-color");
        editorEl.style.removeProperty("border-radius");
      }
    }
  }, [isDark]);

  return (
    <div ref={wrapperRef}>
      <BlockNoteView
        editor={editor}
        editable={editable}
        theme={isDark ? "dark" : "light"}
        onChange={() => {
          onChange(JSON.stringify(editor.topLevelBlocks, null, 2));
        }}
        slashMenu={false}
        data-theming-css-demo
      >
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async (query) =>
            filterSuggestionItems(getCustomSlashMenuItems(editor), query)
          }
        />
      </BlockNoteView>
    </div>
  );
};

export default Editor;
