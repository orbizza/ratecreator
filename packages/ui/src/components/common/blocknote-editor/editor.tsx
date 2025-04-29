"use client";

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

  const editor = useCreateBlockNote({
    // comment the initialContent to avoid the error on Markdown to Blocks
    initialContent: initialContent
      ? (JSON.parse(initialContent) as PartialBlock[])
      : undefined,

    uploadFile: handleUpload,
    schema,
  });

  return (
    <div>
      <BlockNoteView
        editor={editor}
        editable={editable}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        onChange={() => {
          onChange(JSON.stringify(editor.topLevelBlocks, null, 2));
        }}
        // uncomment the onChange to avoid the error on Markdown to Blocks
        // onChange={onChangeMarkdown}
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
