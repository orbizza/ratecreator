"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import Link from "next/link";
import { Options } from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Users,
  Calendar,
  AppWindow,
  Info,
  Languages,
  ChartColumn,
  SquareStack,
} from "lucide-react";

import {
  Separator,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@ratecreator/ui";
import { CreatorData } from "@ratecreator/types/review";
import {
  formatUtcTimestamp,
  formatValue,
  fromSlug,
} from "@ratecreator/db/utils";

import { countryCodes, languageCodes } from "@ratecreator/store";

interface ChannelDetailsSectionProps {
  account: CreatorData["account"];
  categories: CreatorData["categories"];
}

const StatCard = ({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string | number;
}) => (
  <div className='flex items-center gap-3 p-4 rounded-lg border bg-card'>
    <div className='p-2 rounded-full bg-primary/10'>
      <Icon className='w-5 h-5 text-primary' />
    </div>
    <div>
      <p className='text-sm text-muted-foreground'>{label}</p>
      <p className='text-lg font-semibold'>
        {(() => {
          switch (label) {
            case "Joined":
              return formatUtcTimestamp(Number(value));
            case "Country":
              return countryCodes.find((c) => c.id === value)?.label || value;
            case "Language":
              return languageCodes.find((l) => l.id === value)?.label || value;
            default:
              return formatValue(Number(value));
          }
        })()}
      </p>
    </div>
  </div>
);

const CategoryCard = ({ categories }: { categories: string[] }) => {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
      {categories.map((category) => (
        <Link
          key={category}
          href={`/categories/${category}`}
          className='block transition-colors hover:bg-accent hover:shadow-md hover:rounded-lg'
        >
          <div className='p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors duration-200 '>
            <h4 className='font-semibold mb-2'>{fromSlug(category)}</h4>
            {/* <p className='text-sm text-muted-foreground'>{description}</p> */}
          </div>
        </Link>
      ))}
    </div>
  );
};

export const RedditDetailsSection = ({
  account,
  categories,
}: ChannelDetailsSectionProps) => {
  const stats: Array<{
    icon: any;
    label: string;
    value: string | number;
  }> = [
    {
      icon: Users,
      label: "Subscribers",
      value: account.followerCount || 0,
    },

    {
      icon: Calendar,
      label: "Joined",
      value: account.redditData?.about?.data?.created_utc ?? "",
    },
  ];

  // Add language if available
  if (account.language_code) {
    stats.push({
      icon: Languages,
      label: "Language",
      value: account.redditData?.about?.data?.lang || account.language_code,
    });
  }

  return (
    <div id='channel-details' className='mt-10 space-y-8'>
      <Accordion type='single' collapsible defaultValue='channel-stats'>
        <AccordionItem value='channel-stats' className='border-0'>
          <AccordionTrigger className='text-2xl font-bold hover:no-underline'>
            <div className='flex flex-row gap-x-2 items-center text-primary'>
              <ChartColumn size={28} />
              <span className=''>Subreddit Statistics</span>
              <Info size={14} className='text-muted-foreground' />
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {stats.map((stat, index) => (
                <StatCard key={index} {...stat} />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Separator />

      <Accordion type='single' collapsible defaultValue='channel-description'>
        <AccordionItem value='channel-description' className='border-0'>
          <AccordionTrigger className='text-2xl font-bold hover:no-underline'>
            <div className='flex flex-row gap-x-2 items-center text-primary'>
              <AppWindow size={28} />
              <span className=''>Subreddit Description</span>
              <Info size={14} className='text-muted-foreground' />
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className='flex flex-col'>
              <p className='text-sm md:text-lg font-semibold text-primary mt-2'>
                Public Description
              </p>
              <div className='prose dark:prose-invert max-w-none'>
                <p className='whitespace-pre-wrap'>
                  {account.description_en ||
                    account.description ||
                    "No description available"}
                </p>
              </div>
            </div>
            <div className='flex flex-col'>
              <p className='text-sm md:text-lg font-semibold text-primary mt-2'>
                Advertiser Category
              </p>
              <div className='prose dark:prose-invert max-w-none'>
                <p className='whitespace-pre-wrap'>
                  {account.redditData?.about?.data?.advertiser_category ||
                    "No advertiser category available"}
                </p>
              </div>
            </div>
            <div className='flex flex-col'>
              <p className='text-sm md:text-lg font-semibold text-primary mt-4 md:mt-7'>
                Detailed Description
              </p>
              <div className='prose dark:prose-invert max-w-none'>
                <ReactMarkdown
                  // 1. Enable GFM (tables, strikethrough, etc.)
                  remarkPlugins={[remarkGfm]}
                  // 2. Parse raw HTML if needed
                  rehypePlugins={[rehypeRaw]}
                  // 3. Custom URL transform (if you want to rewrite /r/ links, etc.)
                  urlTransform={(url: string) => {
                    // Handle full Reddit URLs
                    let cleanUrl = url
                      .replace(/\[|\]/g, "") // Remove square brackets
                      .replace(/\%5D/g, "") // Remove escaped brackets
                      .replace(/\s+/g, "") // Remove all whitespace
                      .replace(/\/+$/, ""); // Remove trailing slashes
                    if (
                      cleanUrl.startsWith("https://reddit.com") ||
                      cleanUrl.startsWith("http://reddit.com")
                    ) {
                      return cleanUrl;
                    }

                    if (cleanUrl.startsWith("/wiki/")) {
                      return `https://reddit.com${cleanUrl}`;
                    }
                    // Handle relative /r/ links
                    if (url.match(/^\/?r\//)) {
                      return `https://reddit.com/${cleanUrl.replace(/^\//, "")}`;
                    }
                    // Handle markdown-style Reddit links that might be getting processed incorrectly
                    const redditLinkMatch = cleanUrl.match(
                      /\[?(\/r\/[^\]]+)\]?\(https:\/\/reddit\.com.*\)/
                    );
                    if (redditLinkMatch) {
                      return `https://reddit.com${redditLinkMatch[1]}`;
                    }

                    // Handle message compose URLs
                    if (cleanUrl.includes("/message/compose")) {
                      if (cleanUrl.includes("reddit.com")) {
                        return cleanUrl.replace(
                          /^@?https?:\/\/(www\.)?reddit\.com/,
                          "https://reddit.com"
                        );
                      }
                      return `https://reddit.com${cleanUrl.replace("http://localhost:3000", "")}`;
                    }

                    return cleanUrl;
                  }}
                  // 4. Provide custom component overrides
                  components={{
                    // Example: custom headings
                    h1: ({ node, ...props }) => (
                      <h1 {...props} className='text-2xl font-bold mb-4'>
                        {props.children}
                      </h1>
                    ),
                    h2: ({ node, ...props }) => (
                      <h2 {...props} className='text-xl font-semibold mb-3'>
                        {props.children}
                      </h2>
                    ),
                    h3: ({ node, ...props }) => (
                      <h3 {...props} className='text-lg font-semibold mb-2'>
                        {props.children}
                      </h3>
                    ),
                    a: ({ node, ...props }) => (
                      <a
                        {...props}
                        className='text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-500 hover:underline'
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        {props.children}
                      </a>
                    ),

                    // Example: custom table styling
                    table: ({ node, ...props }) => (
                      <div className='overflow-x-auto mb-4'>
                        <table
                          {...props}
                          className='border-collapse table-auto w-full min-w-full divide-y divide-gray-200 dark:divide-gray-700'
                        >
                          {props.children}
                        </table>
                      </div>
                    ),
                    thead: ({ node, ...props }) => (
                      <thead {...props} className='bg-gray-50 dark:bg-gray-800'>
                        {props.children}
                      </thead>
                    ),
                    tbody: ({ node, ...props }) => (
                      <tbody
                        {...props}
                        className='divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900'
                      >
                        {props.children}
                      </tbody>
                    ),
                    tr: ({ node, ...props }) => (
                      <tr
                        {...props}
                        className='hover:bg-gray-50 dark:hover:bg-gray-800'
                      >
                        {props.children}
                      </tr>
                    ),
                    td: ({ node, ...props }) => (
                      <td
                        {...props}
                        className='px-6 py-4 whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100'
                      >
                        {props.children}
                      </td>
                    ),
                    th: ({ node, ...props }) => (
                      <th
                        {...props}
                        className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'
                      >
                        {props.children}
                      </th>
                    ),

                    // Example: override <p> to preserve line breaks
                    p: ({ node, ...props }) => (
                      <p {...props} className='mb-4 whitespace-pre-line'>
                        {props.children}
                      </p>
                    ),

                    // Handle lists properly
                    ul: ({ node, ...props }) => (
                      <ul {...props} className='list-disc pl-6 mb-4'>
                        {props.children}
                      </ul>
                    ),
                    ol: ({ node, ...props }) => (
                      <ol {...props} className='list-decimal pl-6 mb-4'>
                        {props.children}
                      </ol>
                    ),
                    li: ({ node, ...props }) => (
                      <li {...props} className='mb-1'>
                        {props.children}
                      </li>
                    ),

                    // Handle blockquotes
                    blockquote: ({ node, ...props }) => (
                      <blockquote
                        {...props}
                        className='border-l-4 border-gray-200 dark:border-gray-700 pl-4 my-4 italic'
                      >
                        {props.children}
                      </blockquote>
                    ),
                  }}
                >
                  {(account.redditData?.about?.data?.description || "").replace(
                    /(?<![\[\\])(\/r\/[a-zA-Z0-9_]+)/g,
                    "[$1](https://reddit.com$1)"
                  )}
                </ReactMarkdown>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Separator />

      <Accordion type='single' collapsible defaultValue='categories'>
        <AccordionItem value='categories' id='categories' className='border-0'>
          <AccordionTrigger className='text-2xl font-bold hover:no-underline'>
            <div className='flex flex-row gap-x-2 items-center text-primary'>
              <SquareStack size={28} />
              <span className=''>Categories</span>
              <Info size={14} className='text-muted-foreground' />
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <CategoryCard categories={categories} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
