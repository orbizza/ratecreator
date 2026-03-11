/**
 * Server-side BlockNote JSON to email-safe HTML converter
 *
 * This converts BlockNote JSON content into table-based HTML suitable
 * for email clients. Unlike the client-side blocknote-to-markdown.tsx,
 * this runs server-side without needing a BlockNote editor instance.
 */

interface InlineContent {
  type: string;
  text?: string;
  styles?: Record<string, boolean | string>;
  href?: string;
  content?: InlineContent[];
}

interface Block {
  id?: string;
  type: string;
  props?: Record<string, any>;
  content?: InlineContent[];
  children?: Block[];
}

interface TableContent {
  type: string;
  rows?: { cells: InlineContent[][] }[];
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Extract YouTube video ID from various URL formats:
 * - youtube.com/watch?v=VIDEO_ID
 * - youtu.be/VIDEO_ID
 * - youtube.com/embed/VIDEO_ID
 * - youtube.com/shorts/VIDEO_ID
 * - youtube.com/v/VIDEO_ID
 */
function extractYoutubeVideoId(url: string): string | null {
  if (!url) return null;

  // youtu.be short URLs
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return shortMatch[1];

  // youtube.com/shorts/VIDEO_ID
  const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
  if (shortsMatch) return shortsMatch[1];

  // youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
  if (embedMatch) return embedMatch[1];

  // youtube.com/v/VIDEO_ID
  const vMatch = url.match(/youtube\.com\/v\/([a-zA-Z0-9_-]+)/);
  if (vMatch) return vMatch[1];

  // youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) return watchMatch[1];

  return null;
}

/**
 * Detect YouTube URL in paragraph text matching [YouTube: URL] pattern
 */
function detectYoutubeInText(text: string): string | null {
  const match = text.match(/\[YouTube:\s*(https?:\/\/[^\]]+)\]/i);
  if (match) {
    return extractYoutubeVideoId(match[1]);
  }
  return null;
}

function renderInlineContent(content: InlineContent[]): string {
  if (!content || content.length === 0) return "";

  return content
    .map((item) => {
      if (item.type === "link" && item.href) {
        const linkContent = item.content
          ? renderInlineContent(item.content)
          : "";
        return `<a href="${escapeAttr(item.href)}" style="color: #3b82f6; text-decoration: underline;">${linkContent}</a>`;
      }

      let text = escapeHtml(item.text || "");
      const styles = item.styles || {};

      if (styles.bold) text = `<strong>${text}</strong>`;
      if (styles.italic) text = `<em>${text}</em>`;
      if (styles.underline)
        text = `<span style="text-decoration: underline;">${text}</span>`;
      if (styles.strikethrough)
        text = `<span style="text-decoration: line-through;">${text}</span>`;
      if (styles.code)
        text = `<code style="background-color: #1e1e1e; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; color: #e4e4e7;">${text}</code>`;
      if (styles.textColor && styles.textColor !== "default")
        text = `<span style="color: ${escapeAttr(String(styles.textColor))};">${text}</span>`;
      if (styles.backgroundColor && styles.backgroundColor !== "default")
        text = `<span style="background-color: ${escapeAttr(String(styles.backgroundColor))}; padding: 2px 4px; border-radius: 2px;">${text}</span>`;

      return text;
    })
    .join("");
}

/**
 * Render a table block with proper table structure
 */
function renderTable(block: Block): string {
  const tableContent = block.content as unknown as TableContent;
  if (!tableContent?.rows || !Array.isArray(tableContent.rows)) {
    return "";
  }

  let html =
    '<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">';

  for (let rowIdx = 0; rowIdx < tableContent.rows.length; rowIdx++) {
    const row = tableContent.rows[rowIdx];
    html += "<tr>";

    for (const cell of row.cells) {
      const cellContent = renderInlineContent(cell);
      const isHeader = rowIdx === 0;
      const tag = isHeader ? "th" : "td";
      const headerStyle = isHeader ? "font-weight: bold; " : "";
      html += `<${tag} style="${headerStyle}border: 1px solid #3f3f46; padding: 8px 12px; color: #e4e4e7; font-size: 14px;">${cellContent}</${tag}>`;
    }

    html += "</tr>";
  }

  html += "</table>";
  return html;
}

/**
 * Render children blocks (nested items like sub-lists)
 */
function renderChildren(children: Block[]): string {
  if (!children || children.length === 0) return "";
  return groupListItems(children);
}

function renderBlock(block: Block): string {
  const props = block.props || {};
  const alignment = props.textAlignment || "left";
  const textColor =
    props.textColor && props.textColor !== "default"
      ? props.textColor
      : "#e4e4e7";
  const bgColor =
    props.backgroundColor && props.backgroundColor !== "default"
      ? props.backgroundColor
      : undefined;

  const baseStyle = `color: ${escapeAttr(textColor)}; text-align: ${alignment};${bgColor ? ` background-color: ${escapeAttr(bgColor)};` : ""}`;
  const content = block.content ? renderInlineContent(block.content) : "";

  switch (block.type) {
    case "paragraph": {
      if (!content) {
        return `<p style="${baseStyle} margin: 8px 0; line-height: 1.6;">&nbsp;</p>`;
      }

      // Check for YouTube embed pattern in text
      const plainText = block.content?.map((c) => c.text || "").join("") || "";
      const ytVideoId = detectYoutubeInText(plainText);
      if (ytVideoId) {
        const thumbnailUrl = `https://img.youtube.com/vi/${escapeAttr(ytVideoId)}/maxresdefault.jpg`;
        return `
<table style="width: 100%; border-spacing: 0; margin: 16px 0;">
  <tr>
    <td style="text-align: center;">
      <a href="https://www.youtube.com/watch?v=${escapeAttr(ytVideoId)}" target="_blank" style="display: inline-block; text-decoration: none;">
        <img src="${thumbnailUrl}" alt="YouTube Video" style="max-width: 100%; height: auto; border-radius: 8px;" />
        <p style="margin: 8px 0 0; color: #a1a1aa; text-align: center; font-size: 14px;">Click to watch on YouTube</p>
      </a>
    </td>
  </tr>
</table>`;
      }

      return `<p style="${baseStyle} margin: 8px 0; line-height: 1.6; font-size: 16px;">${content}</p>`;
    }

    case "heading": {
      const level = props.level || 1;
      const sizes: Record<number, string> = {
        1: "32px",
        2: "24px",
        3: "20px",
      };
      const fontSize = sizes[level] || "20px";
      return `<h${level} style="${baseStyle} margin: 24px 0 12px; font-size: ${fontSize}; font-weight: bold; line-height: 1.3;">${content}</h${level}>`;
    }

    case "bulletListItem": {
      let html = `<li style="${baseStyle} margin: 4px 0; line-height: 1.6; font-size: 16px;">${content}`;
      if (block.children && block.children.length > 0) {
        html += renderChildren(block.children);
      }
      html += "</li>";
      return html;
    }

    case "numberedListItem": {
      let html = `<li style="${baseStyle} margin: 4px 0; line-height: 1.6; font-size: 16px;">${content}`;
      if (block.children && block.children.length > 0) {
        html += renderChildren(block.children);
      }
      html += "</li>";
      return html;
    }

    case "checkListItem": {
      const checkbox = props.checked ? "&#9745;" : "&#9744;";
      let html = `<li style="${baseStyle} margin: 4px 0; line-height: 1.6; font-size: 16px; list-style: none;">${checkbox} ${content}`;
      if (block.children && block.children.length > 0) {
        html += renderChildren(block.children);
      }
      html += "</li>";
      return html;
    }

    case "codeBlock":
      return `<pre style="background-color: #1e1e1e; padding: 16px; border-radius: 8px; overflow-x: auto; color: #d4d4d8; font-family: monospace; font-size: 14px; line-height: 1.5; margin: 16px 0;">${content || escapeHtml(props.code || "")}</pre>`;

    case "image":
      if (props.url) {
        const caption = props.caption || "";
        return `<div style="text-align: center; margin: 16px 0;"><img src="${escapeAttr(props.url)}" alt="${escapeAttr(caption)}" style="max-width: 100%; height: auto; border-radius: 8px;" />${caption ? `<p style="color: #a1a1aa; font-size: 14px; margin: 8px 0 0;">${escapeHtml(caption)}</p>` : ""}</div>`;
      }
      return "";

    case "youtube": {
      const url = props.url || "";
      const videoId = extractYoutubeVideoId(url);
      if (!videoId) return "";
      const thumbnailUrl = `https://img.youtube.com/vi/${escapeAttr(videoId)}/maxresdefault.jpg`;
      return `
<table style="width: 100%; border-spacing: 0; margin: 16px 0;">
  <tr>
    <td style="text-align: center;">
      <a href="https://www.youtube.com/watch?v=${escapeAttr(videoId)}" target="_blank" style="display: inline-block; text-decoration: none;">
        <img src="${thumbnailUrl}" alt="YouTube Video" style="max-width: 100%; height: auto; border-radius: 8px;" />
        <p style="margin: 8px 0 0; color: #a1a1aa; text-align: center; font-size: 14px;">Click to watch on YouTube</p>
      </a>
    </td>
  </tr>
</table>`;
    }

    case "divider":
      return `<hr style="border: none; border-top: 1px solid #3f3f46; margin: 24px 0;" />`;

    case "table":
      return renderTable(block);

    default:
      if (content) {
        return `<div style="${baseStyle} margin: 8px 0; font-size: 16px;">${content}</div>`;
      }
      return "";
  }
}

/**
 * Group consecutive list items into proper list elements
 */
function groupListItems(blocks: Block[]): string {
  let html = "";
  let inBulletList = false;
  let inNumberedList = false;
  let inCheckList = false;

  for (const block of blocks) {
    const isBullet = block.type === "bulletListItem";
    const isNumbered = block.type === "numberedListItem";
    const isCheck = block.type === "checkListItem";

    // Close lists if type changes
    if (inBulletList && !isBullet) {
      html += "</ul>";
      inBulletList = false;
    }
    if (inNumberedList && !isNumbered) {
      html += "</ol>";
      inNumberedList = false;
    }
    if (inCheckList && !isCheck) {
      html += "</ul>";
      inCheckList = false;
    }

    // Open lists if needed
    if (isBullet && !inBulletList) {
      html += '<ul style="margin: 8px 0; padding-left: 24px; color: #e4e4e7;">';
      inBulletList = true;
    }
    if (isNumbered && !inNumberedList) {
      html += '<ol style="margin: 8px 0; padding-left: 24px; color: #e4e4e7;">';
      inNumberedList = true;
    }
    if (isCheck && !inCheckList) {
      html +=
        '<ul style="margin: 8px 0; padding-left: 8px; color: #e4e4e7; list-style: none;">';
      inCheckList = true;
    }

    html += renderBlock(block);
  }

  // Close any remaining open lists
  if (inBulletList) html += "</ul>";
  if (inNumberedList) html += "</ol>";
  if (inCheckList) html += "</ul>";

  return html;
}

/**
 * Convert BlockNote JSON content to email-safe HTML
 */
export function blocknoteToEmailHtml(contentJson: string): string {
  let blocks: Block[];
  try {
    blocks =
      typeof contentJson === "string" ? JSON.parse(contentJson) : contentJson;
  } catch {
    return "<p>Unable to render content</p>";
  }

  if (!Array.isArray(blocks)) {
    return "<p>Unable to render content</p>";
  }

  return groupListItems(blocks);
}
