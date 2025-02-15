import React from "react";
import { CreatorData } from "@ratecreator/types/review";

interface TwitterEntity {
  start?: number;
  end?: number;
}

interface TwitterUrl {
  url?: string;
  expanded_url?: string;
  display_url?: string;
  indices?: number[];
}

interface TwitterMention extends TwitterEntity {
  username?: string;
}

interface TwitterHashtag extends TwitterEntity {
  tag?: string;
}

interface TwitterCashtag extends TwitterEntity {
  tag?: string;
}

const formatDescription = (
  description: string,
  xData?: CreatorData["account"]["xData"],
) => {
  if (!description) return "No description available";
  if (!xData?.entities?.description) return description;

  // Create an array of all entities with their positions and replacement HTML
  const entities: Array<{ start: number; end: number; html: string }> = [];

  // Add URLs
  xData.entities.description.urls?.forEach((url) => {
    if (url.start !== undefined && url.end !== undefined && url.expanded_url) {
      entities.push({
        start: url.start,
        end: url.end,
        html: `<a href="${url.url}" class="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">${url.expanded_url}</a>`,
      });
    }
  });

  // Add Mentions
  xData.entities.description.mentions?.forEach((mention) => {
    if (
      mention.start !== undefined &&
      mention.end !== undefined &&
      mention.username
    ) {
      entities.push({
        start: mention.start,
        end: mention.end,
        html: `<a href="https://x.com/${mention.username}" class="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-500 hover:underline" target="_blank" rel="noopener noreferrer">@${mention.username}</a>`,
      });
    }
  });

  // Add Hashtags
  xData.entities.description.hashtags?.forEach((hashtag) => {
    if (
      hashtag.start !== undefined &&
      hashtag.end !== undefined &&
      hashtag.tag
    ) {
      entities.push({
        start: hashtag.start,
        end: hashtag.end,
        html: `<a href="https://x.com/hashtag/${hashtag.tag}" class="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-500 hover:underline" target="_blank" rel="noopener noreferrer">#${hashtag.tag}</a>`,
      });
    }
  });

  // Add Cashtags
  xData.entities.description.cashtags?.forEach((cashtag) => {
    if (
      cashtag.start !== undefined &&
      cashtag.end !== undefined &&
      cashtag.tag
    ) {
      entities.push({
        start: cashtag.start,
        end: cashtag.end,
        html: `<a href="https://x.com/search?q=%24${cashtag.tag}" class="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-500 hover:underline" target="_blank" rel="noopener noreferrer">$${cashtag.tag}</a>`,
      });
    }
  });

  // Sort entities by start position in reverse order
  entities.sort((a, b) => b.start - a.start);

  // Replace entities in the description string from end to start
  let formattedText = description;
  entities.forEach((entity) => {
    formattedText =
      formattedText.substring(0, entity.start) +
      entity.html +
      formattedText.substring(entity.end);
  });

  return formattedText;
};

const DescriptionRenderer = ({
  account,
}: {
  account: CreatorData["account"];
}) => {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <p
        className="whitespace-pre-wrap"
        dangerouslySetInnerHTML={{
          __html: formatDescription(
            account.description_en || account.description,
            account.xData,
          ),
        }}
      />
    </div>
  );
};

export default DescriptionRenderer;
