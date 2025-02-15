"use client";

import React from "react";
import {
  Separator,
  Badge,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@ratecreator/ui";
import { CreatorData } from "@ratecreator/types/review";
import { formatDate, formatValue, fromSlug } from "@ratecreator/db/utils";
import {
  Youtube,
  Users,
  Video,
  Eye,
  Calendar,
  Hash,
  ChevronDown,
  AppWindow,
  Info,
  Globe,
  Languages,
  ChartColumn,
  SquareStack,
} from "lucide-react";
import Link from "next/link";
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
  <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
    <div className="p-2 rounded-full bg-primary/10">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">
        {(() => {
          switch (label) {
            case "Joined":
              return formatDate(value.toString());
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((category) => (
        <Link
          key={category}
          href={`/categories/${category}`}
          className="block transition-colors hover:bg-accent hover:shadow-md hover:rounded-lg"
        >
          <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors duration-200 ">
            <h4 className="font-semibold mb-2">{fromSlug(category)}</h4>
            {/* <p className='text-sm text-muted-foreground'>{description}</p> */}
          </div>
        </Link>
      ))}
    </div>
  );
};

const KeywordBadge = ({ keyword }: { keyword: string }) => (
  <Link href={`/search?q=${keyword}`}>
    <Badge
      variant="secondary"
      className="px-3 py-1.5 gap-1.5 hover:bg-secondary/80 cursor-pointer transition-colors"
    >
      <Hash className="w-3 h-3 -mr-1" />
      {keyword.trim()}
    </Badge>
  </Link>
);

export const ChannelDetailsSection = ({
  account,
  categories,
}: ChannelDetailsSectionProps) => {
  const stats = [
    {
      icon: Users,
      label: "Subscribers",
      value: account.followerCount || 0,
    },
    {
      icon: Video,
      label: "Videos",
      value: account.ytData?.statistics?.videoCount || 0,
    },
    {
      icon: Eye,
      label: "Total Views",
      value: account.ytData?.statistics?.viewCount || 0,
    },
    {
      icon: Calendar,
      label: "Joined",
      value: account.ytData?.snippet?.publishedAt ?? "",
    },
  ];

  // Add country if available
  if (account.country) {
    stats.push({
      icon: Globe,
      label: "Country",
      value: account.country,
    });
  }

  // Add language if available
  if (account.language_code) {
    stats.push({
      icon: Languages,
      label: "Language",
      value: account.language_code,
    });
  }

  // Split keywords string into array and clean up each keyword
  const keywords = account.keywords_en
    ?.match(/\\?"([^"]+)\\?"|[^\s]+/g) // Match quoted phrases or single words
    ?.map((keyword) =>
      keyword
        .replace(/\\?"|\\?"/g, "") // Remove any quotes or escaped quotes
        .trim(),
    )
    .filter((keyword) => keyword.length > 0);

  return (
    <div id="channel-details" className="mt-10 space-y-8">
      <Accordion type="single" collapsible defaultValue="channel-stats">
        <AccordionItem value="channel-stats" className="border-0">
          <AccordionTrigger className="text-2xl font-bold hover:no-underline">
            <div className="flex flex-row gap-x-2 items-center text-primary">
              <ChartColumn size={28} />
              <span className="">Channel Statistics</span>
              <Info size={14} className="text-muted-foreground" />
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.map((stat, index) => (
                <StatCard key={index} {...stat} />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Separator />

      <Accordion type="single" collapsible defaultValue="channel-description">
        <AccordionItem value="channel-description" className="border-0">
          <AccordionTrigger className="text-2xl font-bold hover:no-underline">
            <div className="flex flex-row gap-x-2 items-center text-primary">
              <AppWindow size={28} />
              <span className="">Channel Description</span>
              <Info size={14} className="text-muted-foreground" />
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="prose dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">
                {account.description_en ||
                  account.description ||
                  "No description available"}
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {keywords && keywords.length > 0 && (
        <>
          <Separator />
          <Accordion type="single" collapsible defaultValue="channel-keywords">
            <AccordionItem value="channel-keywords" className="border-0">
              <AccordionTrigger className="text-2xl font-bold hover:no-underline">
                <div className="flex flex-row gap-x-2 items-center text-primary">
                  <Hash size={28} />
                  <span className="">Channel Keywords</span>
                  <Info size={14} className="text-muted-foreground" />
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword, index) => (
                    <KeywordBadge key={index} keyword={keyword} />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </>
      )}

      <Separator />

      <Accordion type="single" collapsible defaultValue="categories">
        <AccordionItem value="categories" id="categories" className="border-0">
          <AccordionTrigger className="text-2xl font-bold hover:no-underline">
            <div className="flex flex-row gap-x-2 items-center text-primary">
              <SquareStack size={28} />
              <span className="">Categories</span>
              <Info size={14} className="text-muted-foreground" />
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
