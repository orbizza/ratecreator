"use client";

import { IconCloud } from "@ratecreator/ui";

const slugs = [
  // Popular Social Media Platforms with messaging apps
  "facebook",
  "twitter",
  "instagram",
  "linkedin",
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
    <div className="bg-background relative flex size-full max-w-lg items-center justify-center overflow-hidden rounded-lg  px-20 pb-20 pt-8 ">
      <IconCloud iconSlugs={slugs} />
    </div>
  );
}
