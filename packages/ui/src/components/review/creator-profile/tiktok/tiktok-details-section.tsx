"use client";

import Link from "next/link";

import {
  Users,
  AppWindow,
  Info,
  Globe,
  Languages,
  ChartColumn,
  SquareStack,
  Heart,
  Handshake,
  Video,
  ThumbsUp,
  Shovel,
} from "lucide-react";

import {
  Separator,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@ratecreator/ui";
import { CreatorData } from "@ratecreator/types/review";
import { formatDate, formatValue, fromSlug } from "@ratecreator/db/utils";

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

export const TiktokDetailsSection = ({
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
      label: "Followers",
      value: account.followerCount || 0,
    },
    {
      icon: Video,
      label: "Videos",
      value: account.tiktokData?.videos || 0,
    },
    {
      icon: Handshake,
      label: "Friends",
      value: account.tiktokData?.friendCount || 0,
    },
    {
      icon: Heart,
      label: "Total Hearts",
      value: account.tiktokData?.heart || 0,
    },
    {
      icon: ThumbsUp,
      label: "Total Likes",
      value: account.tiktokData?.likes || 0,
    },
    {
      icon: Shovel,
      label: "Total Diggs",
      value: account.tiktokData?.diggCount || 0,
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

  return (
    <div id="channel-details" className="mt-10 space-y-8">
      <Accordion type="single" collapsible defaultValue="channel-stats">
        <AccordionItem value="channel-stats" className="border-0">
          <AccordionTrigger className="text-2xl font-bold hover:no-underline">
            <div className="flex flex-row gap-x-2 items-center text-primary">
              <ChartColumn size={28} />
              <span className="">User Statistics</span>
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
              <span className="">User Details</span>
              <Info size={14} className="text-muted-foreground" />
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm md:text-lg font-semibold text-primary mb-2">
              Description
            </p>
            <div className="prose dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">
                {account.description_en ||
                  account.description ||
                  "No description available"}
              </p>
            </div>
            {/* Render the url if present in the entity */}
            {account.tiktokData?.bio_link && (
              <>
                <p className="text-sm md:text-lg font-semibold text-primary mb-2 mt-4">
                  Bio Link
                </p>
                <Link
                  href={account.tiktokData?.bio_link || ""}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-500 hover:underline"
                >
                  {account.tiktokData?.bio_link}
                </Link>
              </>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

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
