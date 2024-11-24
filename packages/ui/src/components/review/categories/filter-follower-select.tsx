"use client";

import React, { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Checkbox,
  Label,
} from "@ratecreator/ui";
import { Info, Users } from "lucide-react";
import { followersCheckbox } from "@ratecreator/store";

// export const FollowersSelect: React.FC = () => {
//   return (
//     <Accordion
//       type='single'
//       collapsible
//       className='w-full'
//       defaultValue='followers-count'
//     >
//       <AccordionItem value='followers-count' className='border-0 '>
//         {/* <AccordionTrigger className='hover:no-underline p-0'>
//           <div className='flex flex-row gap-x-2 items-center'>
//             <Users size={16} />
//             <span className='text-[16px]'>Followers</span>
//             <Info size={14} className='text-muted-foreground' />
//           </div>
//         </AccordionTrigger> */}
//         <AccordionContent className='mt-2 p-2 overflow-hidden shadow-md rounded-md bg-neutral-100 text-foreground dark:bg-neutral-950 dark:text-foreground'>
//           <FollowersCheckbox />
//         </AccordionContent>
//       </AccordionItem>
//     </Accordion>
//   );
// };

export const FollowersCheckbox: React.FC = () => {
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
    <div className='flex flex-col space-y-2'>
      {followersCheckbox.map((item) => (
        <div
          key={item.id}
          className='flex items-center space-x-2 p-1 hover:bg-neutral-200 dark:hover:bg-accent hover:rounded-md cursor-pointer transition-colors duration-200 group'
        >
          <Checkbox
            id={item.id}
            checked={selectedFilters.includes(item.id)}
            onCheckedChange={(checked) =>
              handleCheckboxChange(checked as boolean, item.id)
            }
            className='group-hover:border-primary'
          />
          <Label
            htmlFor={item.id}
            className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none w-full'
          >
            {item.label}
          </Label>
        </div>
      ))}
    </div>
  );
};
