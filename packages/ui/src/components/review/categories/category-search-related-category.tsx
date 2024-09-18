// components/RelatedCategories.tsx
import React from "react";
import Link from "next/link";
import { Category } from "@ratecreator/types/review";
import {
  Separator,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@ratecreator/ui";
import { ArrowRightLeft } from "lucide-react";

interface RelatedCategoriesProps {
  categories: Category[];
}

export const RelatedCategories: React.FC<RelatedCategoriesProps> = ({
  categories,
}) => {
  const length = categories.length === 0;

  return (
    <div className='mt-8 mb-8 rounded-lg overflow-hidden shadow-md flex flex-col '>
      <div className='bg-stone-50  dark:bg-gray-900 p-4 flex-grow'>
        <Accordion
          type='single'
          collapsible
          className='w-full'
          defaultValue='item-1'
        >
          <AccordionItem value='item-1'>
            <AccordionTrigger className='hover:no-underline'>
              <div className='flex flex-row items-center mb-2 text-primary text-lg gap-x-2'>
                <ArrowRightLeft size={20} />
                <p>Related Categories</p>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {!length && (
                <ul className='list-none p-0 m-0'>
                  {categories.map((subcat) => (
                    <Link
                      key={subcat.id}
                      href={`/categories/${subcat.slug}`}
                      passHref
                      className='block transition-transform hover:text-primary'
                    >
                      <li className='text-sm  py-1'>
                        {subcat.name}
                        <Separator className='my-2' />
                      </li>
                    </Link>
                  ))}
                </ul>
              )}
              {length && <p> No related categories found </p>}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};
