import React from "react";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import "@blocknote/mantine/style.css";

import { Youtube } from "./youtube-blocknote";
import { Divider } from "./divider";
import { useTheme } from "next-themes";
interface BlockNoteRendererProps {
  content: any;
  className?: string;
}

const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    youtube: Youtube,
    divider: Divider,
  },
});

const BlockNoteRenderer: React.FC<BlockNoteRendererProps> = ({
  content,
  className = "",
}) => {
  let parsedContent;
  const { resolvedTheme } = useTheme();
  try {
    parsedContent = typeof content === "string" ? JSON.parse(content) : content;
  } catch (error) {
    console.error("Failed to parse content:", error);
    parsedContent = [];
  }

  const editor = useCreateBlockNote({
    initialContent: parsedContent,
    schema,
    domAttributes: {
      editor: {
        class: "focus:outline-none bg-transparent",
      },
      block: {
        class: "my-3 first:mt-6 last:mb-6 bg-transparent",
      },
    },
  });

  return (
    <div className={`relative w-full ${className}`}>
      <div className='prose prose-lg max-w-none ml-0 p-0'>
        <div
          className='
            prose-headings:font-semibold 
            prose-h1:text-4xl prose-h1:mb-6 
            prose-h2:text-3xl prose-h2:mb-4 
            prose-h3:text-2xl prose-h3:mb-3
            prose-p:text-neutral-200 prose-p:leading-8
            prose-pre:bg-transparent 
            prose-pre:text-neutral-300
            prose-blockquote:border-l-4 
            prose-blockquote:border-neutral-500
            prose-blockquote:pl-4 
            prose-blockquote:italic
            prose-blockquote:text-neutral-400
            prose-ul:list-disc 
            prose-ul:pl-6
            prose-ul:text-neutral-300
            prose-ol:list-decimal 
            prose-ol:pl-0
            prose-ol:text-neutral-300
            prose-code:text-neutral-300
            prose-youtube:w-full prose-youtube:aspect-video
            prose-youtube:rounded-md prose-youtube:shadow-md
            prose-youtube:p-2
            prose-video:w-full prose-video:aspect-video
            prose-video:rounded-md prose-video:shadow-md
            prose-video:p-2
            prose-text:text-neutral-100
          '
        >
          <BlockNoteView
            editor={editor}
            editable={false}
            theme={resolvedTheme === "dark" ? "dark" : "light"}
            className='min-h-[200px] w-full [&_*]:ml-0 [&_*]:pl-0'
          />
        </div>
      </div>
      <style jsx global>{`
        .bn-container {
          background-color: transparent !important;
          margin-left: 0 !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
        }
        .bn-editor {
          background-color: transparent !important;
          margin-left: 0 !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
        }
        .bn-editor > div {
          margin-left: 0 !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
        }
        [data-node-type="bulletListItem"],
        [data-node-type="numberedListItem"] {
          margin-left: 0 !important;
          padding-left: 1.5rem !important;
          border-left: none !important;
          position: relative !important;
        }
        [data-node-type="bulletListItem"] [data-node-type="bulletListItem"],
        [data-node-type="numberedListItem"]
          [data-node-type="numberedListItem"] {
          margin-left: 1rem !important;
          border-left: none !important;
          position: relative !important;
        }
        [data-node-type="bulletListItem"]::before {
          content: "•" !important;
          position: absolute !important;
          left: 0.5rem !important;
        }
        [data-node-type="numberedListItem"]::before {
          position: absolute !important;
          left: 0.5rem !important;
        }
        [data-node-type="callout"] {
          background-color: rgb(34 197 94 / 0.2) !important;
          border-radius: 0.5rem !important;
          padding: 1rem !important;
        }
        [data-node-type="callout"] [data-content="true"] {
          color: rgb(209 213 219) !important;
        }
      `}</style>
    </div>
  );
};

export { BlockNoteRenderer };
