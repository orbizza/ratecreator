/**
 * IconCloudSection Component
 *
 * This component displays a cloud of social media and communication platform icons.
 * It's used to visually represent the various platforms that creators can be rated on.
 *
 * The component uses the IconCloud component from the UI library to render a dynamic
 * cloud of icons based on the provided slugs.
 */

"use client";

import { IconCloud } from "@ratecreator/ui";

/**
 * Array of social media and communication platform slugs
 * These represent the icons that will be displayed in the cloud
 * Each slug corresponds to a platform's icon in the IconCloud component
 */
const slugs = [
  // Popular Social Media Platforms with messaging apps
  "facebook",
  "x",
  "instagram",
  // "linkedin",
  "youtube",
  "snapchat",
  "tiktok", // Although owned by ByteDance, it's globally focused
  "whatsapp",
  "pinterest",
  "reddit",
  "tumblr",
  "telegram",
  "medium",
  "slack",
  "discord",
  "dribbble",
  "behance",
  "flickr",
  "twitch",
  "messenger",
  "vimeo",
  "clubhouse",
  "quora",
  "xing",
  "mix",
  "mastodon",
  "mewe",
  "vk",
  "signal",
  "viber",
  "meetup",
];

export function IconCloudSection() {
  return (
    <div className="bg-background relative flex size-full max-w-lg lg:max-w-xl items-center justify-center overflow-hidden rounded-lg  px-20 lg:px-8 pb-20 pt-8 lg:pt-0 ">
      <IconCloud iconSlugs={slugs} />
    </div>
  );
}
