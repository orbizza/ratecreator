"use client";
import React, { useState } from "react";
import { Layout, Info, AppWindow } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Checkbox,
  Label,
} from "@ratecreator/ui";
import {
  SiInstagram,
  SiYoutube,
  SiX,
  SiReddit,
  SiTiktok,
  SiTwitch,
} from "@icons-pack/react-simple-icons";

const platformFilters = [
  {
    id: "all",
    label: "All Platforms",
    icon: Layout,
    color: "text-primary",
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: SiInstagram,
    color: "text-rose-700",
  },
  {
    id: "youtube",
    label: "YouTube",
    icon: SiYoutube,
    color: "text-red-500",
  },
  {
    id: "x",
    label: "X",
    icon: SiX,
    color: "text-neutral-900 dark:text-neutral-100",
  },
  {
    id: "reddit",
    label: "Reddit",
    icon: SiReddit,
    color: "text-orange-600",
  },
  {
    id: "tiktok",
    label: "TikTok",
    icon: SiTiktok,
    color: "text-neutral-900 dark:text-neutral-100",
  },
  {
    id: "twitch",
    label: "Twitch",
    icon: SiTwitch,
    color: "text-purple-500",
  },
];

export const PlatformCheckbox: React.FC = () => {
  const [selectedFilters, setSelectedFilters] = useState<string[]>(["all"]);

  const handleCheckboxChange = (checked: boolean, id: string) => {
    setSelectedFilters((prev) => {
      if (id === "all") {
        // If "All" is selected, clear other selections
        return checked ? ["all"] : [];
      } else {
        // Remove "All" when selecting other options
        const withoutAll = prev.filter((item) => item !== "all");

        if (checked) {
          return [...withoutAll, id];
        } else {
          return withoutAll.filter((item) => item !== id);
        }
      }
    });
  };

  return (
    <div className="flex flex-col space-y-2">
      {platformFilters.map(({ id, label, icon: Icon, color }) => (
        <div
          key={id}
          className="flex items-center space-x-2 p-2 hover:bg-neutral-200 dark:hover:bg-accent hover:rounded-md cursor-pointer transition-colors duration-200 group"
          onClick={() =>
            handleCheckboxChange(!selectedFilters.includes(id), id)
          }
        >
          <Checkbox
            id={id}
            checked={selectedFilters.includes(id)}
            className="group-hover:border-primary pointer-events-none"
          />
          <div className="flex items-center gap-2">
            <Icon size={16} className={color} />
            <Label
              htmlFor={id}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none"
            >
              {label}
            </Label>
          </div>
        </div>
      ))}
    </div>
  );
};

// export const PlatformSelect: React.FC = () => {
//   return (
//     <Accordion
//       type='single'
//       collapsible
//       className='w-full'
//       defaultValue='platform'
//     >
//       <AccordionItem value='platform' className='border-0'>
//         <AccordionContent className='mt-2 p-2 overflow-hidden shadow-md rounded-md bg-neutral-100 text-foreground dark:bg-neutral-950 dark:text-foreground'>
//           <PlatformCheckbox />
//         </AccordionContent>
//       </AccordionItem>
//     </Accordion>
//   );
// };
